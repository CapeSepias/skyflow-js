/*
Copyright (c) 2022 Skyflow, Inc.
*/
import bus from 'framebus';
import Client from '../../client';
import iframer, {
  getIframeSrc,
  setAttributes,
  setStyles,
} from '../../iframe-libs/iframer';
import properties from '../../properties';
import {
  validateInsertRecords,
  validateDetokenizeInput, validateGetByIdInput,
  validateInitConfig,
} from '../../utils/validators';
import {
  CONTROLLER_STYLES,
  ELEMENT_EVENTS_TO_IFRAME,
  SKYFLOW_FRAME_CONTROLLER,
  PUREJS_TYPES,
} from '../constants';
import {
  printLog,
  parameterizedString,
} from '../../utils/logs-helper';
import logs from '../../utils/logs';
import {
  IDetokenizeInput, IGetByIdInput, Context, MessageType,
} from '../../utils/common';

const CLASS_NAME = 'SkyflowContainer';
class SkyflowContainer {
  #containerId: string;

  #client: Client;

  #isControllerFrameReady: boolean = false;

  #context: Context;

  constructor(client, context) {
    this.#client = client;
    this.#containerId = this.#client.toJSON()?.metaData?.uuid || '';
    this.#context = context;
    const iframe = iframer({
      name: `${SKYFLOW_FRAME_CONTROLLER}:${this.#containerId}`,
    });
    setAttributes(iframe, {
      src: getIframeSrc(),
    });
    setStyles(iframe, { ...CONTROLLER_STYLES });
    document.body.append(iframe);
    bus
      .target(properties.IFRAME_SECURE_ORGIN)
      .on(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY + this.#containerId, (data, callback) => {
        printLog(parameterizedString(logs.infoLogs.CAPTURE_PUREJS_FRAME, CLASS_NAME),
          MessageType.LOG,
          this.#context.logLevel);
        callback({
          client: this.#client,
          context,
        });
        this.#isControllerFrameReady = true;
      });
    printLog(parameterizedString(logs.infoLogs.PUREJS_CONTROLLER_INITIALIZED, CLASS_NAME),
      MessageType.LOG,
      this.#context.logLevel);
  }

  detokenize(detokenizeInput: IDetokenizeInput): Promise<any> {
    if (this.#isControllerFrameReady) {
      return new Promise((resolve, reject) => {
        try {
          validateInitConfig(this.#client.config);
          printLog(parameterizedString(logs.infoLogs.VALIDATE_DETOKENIZE_INPUT, CLASS_NAME),
            MessageType.LOG,
            this.#context.logLevel);

          validateDetokenizeInput(detokenizeInput);
          bus
          // .target(properties.IFRAME_SECURE_ORGIN)
            .emit(
              ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST + this.#containerId,
              {
                type: PUREJS_TYPES.DETOKENIZE,
                records: detokenizeInput.records,
              },
              (revealData: any) => {
                if (revealData.error) reject(revealData.error);
                else resolve(revealData);
              },
            );
          printLog(parameterizedString(logs.infoLogs.EMIT_PURE_JS_REQUEST, CLASS_NAME,
            PUREJS_TYPES.DETOKENIZE),
          MessageType.LOG, this.#context.logLevel);
        } catch (e) {
          printLog(e.message, MessageType.ERROR, this.#context.logLevel);
          reject(e);
        }
      });
    }
    return new Promise((resolve, reject) => {
      try {
        validateInitConfig(this.#client.config);
        printLog(parameterizedString(logs.infoLogs.VALIDATE_DETOKENIZE_INPUT, CLASS_NAME),
          MessageType.LOG,
          this.#context.logLevel);

        validateDetokenizeInput(detokenizeInput);
        bus
          .target(properties.IFRAME_SECURE_ORGIN)
          .on(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY + this.#containerId, () => {
            bus.emit(
              ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST + this.#containerId,
              {
                type: PUREJS_TYPES.DETOKENIZE,
                records: detokenizeInput.records,
              },
              (revealData: any) => {
                if (revealData.error) reject(revealData.error);
                else resolve(revealData);
              },
            );
          });
        printLog(parameterizedString(logs.infoLogs.EMIT_PURE_JS_REQUEST, CLASS_NAME,
          PUREJS_TYPES.DETOKENIZE),
        MessageType.LOG, this.#context.logLevel);
      } catch (e) {
        printLog(e.message, MessageType.ERROR, this.#context.logLevel);
        reject(e);
      }
    });
  }

  insert(records, options): Promise<any> {
    if (this.#isControllerFrameReady) {
      return new Promise((resolve, reject) => {
        validateInitConfig(this.#client.config);
        try {
          printLog(parameterizedString(logs.infoLogs.VALIDATE_RECORDS, CLASS_NAME), MessageType.LOG,
            this.#context.logLevel);

          validateInsertRecords(records, options);
          if (options) {
            options = { ...options, tokens: options?.tokens !== undefined ? options.tokens : true };
          } else {
            options = {
              tokens: true,
            };
          }
          bus
          // .target(properties.IFRAME_SECURE_ORGIN)
            .emit(
              ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST + this.#containerId,
              {
                type: PUREJS_TYPES.INSERT,
                records,
                options,
              },
              (insertedData: any) => {
                if (insertedData.error) {
                  printLog(`${JSON.stringify(insertedData.error)}`, MessageType.ERROR, this.#context.logLevel);
                  reject(insertedData.error);
                } else resolve(insertedData);
              },
            );
          printLog(parameterizedString(logs.infoLogs.EMIT_PURE_JS_REQUEST, CLASS_NAME,
            PUREJS_TYPES.INSERT),
          MessageType.LOG, this.#context.logLevel);
        } catch (e) {
          printLog(e.message, MessageType.ERROR, this.#context.logLevel);

          reject(e);
        }
      });
    }
    return new Promise((resolve, reject) => {
      try {
        validateInitConfig(this.#client.config);
        printLog(parameterizedString(logs.infoLogs.VALIDATE_RECORDS, CLASS_NAME), MessageType.LOG,
          this.#context.logLevel);

        validateInsertRecords(records, options);
        if (options) {
          options = { ...options, tokens: options?.tokens !== undefined ? options.tokens : true };
        }
        bus
          .target(properties.IFRAME_SECURE_ORGIN)
          .on(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY + this.#containerId, () => {
            bus.emit(
              ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST + this.#containerId,
              {
                type: PUREJS_TYPES.INSERT,
                records,
                options,
              },
              (insertedData: any) => {
                if (insertedData.error) {
                  printLog(`${JSON.stringify(insertedData.error)}`, MessageType.ERROR, this.#context.logLevel);
                  reject(insertedData.error);
                } else resolve(insertedData);
              },
            );
          });
        printLog(parameterizedString(logs.infoLogs.EMIT_PURE_JS_REQUEST, CLASS_NAME,
          PUREJS_TYPES.INSERT),
        MessageType.LOG, this.#context.logLevel);
      } catch (e) {
        printLog(e.message, MessageType.ERROR, this.#context.logLevel);
        reject(e);
      }
    });
  }

  getById(getByIdInput: IGetByIdInput) {
    if (this.#isControllerFrameReady) {
      return new Promise((resolve, reject) => {
        validateInitConfig(this.#client.config);
        try {
          printLog(parameterizedString(logs.infoLogs.VALIDATE_GET_BY_ID_INPUT, CLASS_NAME),
            MessageType.LOG,
            this.#context.logLevel);

          validateGetByIdInput(getByIdInput);

          bus
          // .target(properties.IFRAME_SECURE_ORGIN)
            .emit(
              ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST + this.#containerId,
              {
                type: PUREJS_TYPES.GET_BY_SKYFLOWID,
                records: getByIdInput.records,
              },
              (revealData: any) => {
                if (revealData.error) reject(revealData.error);
                else resolve(revealData);
              },
            );
          printLog(parameterizedString(logs.infoLogs.EMIT_PURE_JS_REQUEST,
            CLASS_NAME, PUREJS_TYPES.GET_BY_SKYFLOWID),
          MessageType.LOG, this.#context.logLevel);
        } catch (e) {
          printLog(e.message, MessageType.ERROR, this.#context.logLevel);

          reject(e);
        }
      });
    }
    return new Promise((resolve, reject) => {
      try {
        validateInitConfig(this.#client.config);
        printLog(parameterizedString(logs.infoLogs.VALIDATE_GET_BY_ID_INPUT,
          CLASS_NAME), MessageType.LOG,
        this.#context.logLevel);

        validateGetByIdInput(getByIdInput);
        bus
          .target(properties.IFRAME_SECURE_ORGIN)
          .on(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY + this.#containerId, () => {
            bus.emit(
              ELEMENT_EVENTS_TO_IFRAME.PUREJS_REQUEST + this.#containerId,
              {
                type: PUREJS_TYPES.GET_BY_SKYFLOWID,
                records: getByIdInput.records,
              },
              (revealData: any) => {
                if (revealData.error) reject(revealData.error);
                else resolve(revealData);
              },
            );
          });
        printLog(parameterizedString(logs.infoLogs.EMIT_PURE_JS_REQUEST,
          CLASS_NAME, PUREJS_TYPES.GET_BY_SKYFLOWID),
        MessageType.LOG, this.#context.logLevel);
      } catch (e) {
        printLog(e.message, MessageType.ERROR, this.#context.logLevel);

        reject(e);
      }
    });
  }
}
export default SkyflowContainer;
