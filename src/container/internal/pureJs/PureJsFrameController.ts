import bus from "framebus";
import Client from "../../../client";
import {
  constructInsertRecordRequest,
  constructInsertRecordResponse,
} from "../../../core/collect";
import { fetchRecordsByTokenId } from "../../../core/reveal";
import { IRevealRecord } from "../../../Skyflow";
import { ELEMENT_EVENTS_TO_IFRAME, PUREJS_TYPES } from "../../constants";

class PureJsFrameController {
  #clientDomain: string;
  #client!: Client;
  constructor() {
    this.#clientDomain = document.referrer.split("/").slice(0, 3).join("/");
    bus
      .target(this.#clientDomain)
      .on(ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST, (data, callback) => {
        if (data.type === PUREJS_TYPES.GET) {
          console.log(this.#client);
          fetchRecordsByTokenId(data.records as IRevealRecord[], this.#client)
            .then((result) => {
              callback(result);
            })
            .catch((error) => {
              callback({ error });
              console.log(error);
            });
        } else if (data.type === PUREJS_TYPES.INSERT) {
          this.insertData(data.records, data.options)
            .then((result) => {
              callback(result);
            })
            .catch((error) => {
              console.log(error);
            });
        }
      });
    bus
      .target(this.#clientDomain)
      .emit(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY, {}, (data: any) => {
        const deserializedBearerToken = new Function(
          "return " + data.bearerToken
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
          requestMethod: "POST",
          url:
            this.#client.config.vaultURL +
            "/v1/vaults/" +
            this.#client.config.vaultID,
        })
        .then((response: any) => {
          resolve(
            constructInsertRecordResponse(
              response,
              options.tokens,
              records.records
            )
          );
        })
        .catch((error) => {
          reject(error);
        });
    });
  }
}
export default PureJsFrameController;
