import bus from 'framebus';
import Client from '../../../client';
import {
  constructInsertRecordRequest,
  constructInsertRecordResponse,
} from '../../../core/collect';
import {
  fetchRecordsBySkyflowID,
  fetchRecordsByTokenId,
} from '../../../core/reveal';
import { deletePropertyPath, fillUrlWithPathAndQueryParams, flattenObject } from '../../../libs/objectParse';
// import { containerObjectParse } from '../../../libs/objectParse';
import { IGatewayConfig, IRevealRecord, ISkyflowIdRecord } from '../../../Skyflow';
import { ELEMENT_EVENTS_TO_IFRAME, PUREJS_TYPES } from '../../constants';

class PureJsFrameController {
  #clientDomain: string;

  #client!: Client;

  constructor() {
    this.#clientDomain = document.referrer.split('/').slice(0, 3).join('/');
    bus
      .target(this.#clientDomain)
      .on(ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST, (data, callback) => {
        if (data.type === PUREJS_TYPES.DETOKENIZE) {
          fetchRecordsByTokenId(data.records as IRevealRecord[], this.#client)
            .then(
              (resolvedResult) => {
                callback(resolvedResult);
              },
              (rejectedResult) => {
                callback({ error: rejectedResult });
              },
            )
            .catch((error) => {
              callback({ error });
            });
        } else if (data.type === PUREJS_TYPES.INSERT) {
          this.insertData(data.records, data.options)
            .then((result) => {
              callback(result);
            })
            .catch((error) => {
              callback(error);
            });
        } else if (data.type === PUREJS_TYPES.GET_BY_SKYFLOWID) {
          fetchRecordsBySkyflowID(
            data.records as ISkyflowIdRecord[],
            this.#client,
          )
            .then(
              (resolvedResult) => {
                callback(resolvedResult);
              },
              (rejectedResult) => {
                callback({ error: rejectedResult });
              },
            )
            .catch((error) => {
              callback(error);
            });
        } else if (data.type === PUREJS_TYPES.INVOKE_GATEWAY) {
          const config = data.config as IGatewayConfig;
          // containerObjectParse(config.requestBody);
          // console.log(config);
          const promiseList = [];
          // collectObjectParse(config.requestBody, promiseList);

          // console.log(promiseList);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          Promise.all(promiseList).then((res) => {
            // console.log(res);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          }).catch((err) => {
            // console.log(err);
          });
          // console.log('Final', config.requestBody);
          const filledUrl = fillUrlWithPathAndQueryParams(config.gatewayURL, config.pathParams);
          config.gatewayURL = filledUrl;
          this.sendInvokeGateWayRequest(config).then((resultResponse) => {
            callback(resultResponse);
          }).catch((rejectedResponse) => {
            callback({ error: rejectedResponse });
          });
        }
      });
    bus
      // .target(this.#clientDomain)
      .emit(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY, {}, (data: any) => {
        const deserializedBearerToken = new Function(
          `return ${data.bearerToken}`,
        )();
        data.client.config = {
          ...data.client.config,
          getBearerToken: deserializedBearerToken,
        };
        this.#client = Client.fromJSON(data.client) as any;
      });
  }

  static init() {
    return new PureJsFrameController();
  }

  insertData(records, options) {
    const requestBody = constructInsertRecordRequest(records, options);
    return new Promise((resolve, reject) => {
      this.#client
        .request({
          body: { records: requestBody },
          requestMethod: 'POST',
          url:
            `${this.#client.config.vaultURL
            }/v1/vaults/${
              this.#client.config.vaultID}`,
        })
        .then((response: any) => {
          resolve(
            constructInsertRecordResponse(
              response,
              options.tokens,
              records.records,
            ),
          );
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  sendInvokeGateWayRequest(config:IGatewayConfig) {
    console.log(config);
    console.log(config.responseBody);
    const invokeRequest = this.#client.request({
      url: config.gatewayURL,
      requestMethod: config.methodName,
      body: config.requestBody,
      headers: config.requestHeader,
    });
    return new Promise((resolve, reject) => {
      invokeRequest.then((response) => {
        if (config.responseBody) {
          const flattenResponseBody = flattenObject(config.responseBody);
          const flattenGatewayResponse = flattenObject(response);
          Object.entries(flattenResponseBody).forEach(([key, value]) => {
            const responseValue = flattenGatewayResponse[key];
            const elementIFrame = window.parent.frames[value as string];
            if (elementIFrame) {
              const revealSpanElement = elementIFrame
                .document.getElementById(value) as HTMLSpanElement;
              if (revealSpanElement) {
                revealSpanElement.innerText = responseValue;
              }
              deletePropertyPath(response, key);
              console.log(response);
            }
          });
        }
        resolve(response);
      }).catch((err) => {
        reject(err);
      });
    });
  }
}
export default PureJsFrameController;
