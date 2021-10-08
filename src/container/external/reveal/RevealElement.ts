import bus from 'framebus';
import uuid from '../../../libs/uuid';
import properties from '../../../properties';
import {
  ELEMENT_EVENTS_TO_CONTAINER,
  ELEMENT_EVENTS_TO_IFRAME,
  FRAME_REVEAL,
  MessageType,
} from '../../constants';
import IFrame from '../element/IFrame';
import { IRevealElementInput } from '../RevealContainer';
import { LogLevelOptions, parameterizedString, printLog } from '../../../utils/helper';
import { Context } from '../../../Skyflow';
import { logs } from '../../../utils/logs';

class RevealElement {
  #iframe: IFrame;

  #metaData: any;

  #recordData: any;

  #containerId: string;

  #isMounted:boolean = false;

  #showErrorLogs: boolean;

  #showInfoLogs: boolean;

  #context:Context;

  constructor(record: IRevealElementInput, metaData: any, containerId: string, context:Context) {
    this.#metaData = metaData;
    this.#recordData = record;
    this.#containerId = containerId;
    this.#context = context;
    this.#iframe = new IFrame(
      `${FRAME_REVEAL}:${btoa(record.token || uuid())}`,
      { metaData },
      this.#containerId,
    );
    this.#showErrorLogs = LogLevelOptions[context.logLevel].showErrorLogs;
    this.#showInfoLogs = LogLevelOptions[context.logLevel].showInfoLogs;
    printLog(parameterizedString(logs.infoLogs.CREATED_ELEMENT, `${record.token || ''}reveal`), MessageType.INFO, this.#showErrorLogs, this.#showInfoLogs);
  }

  mount(domElementSelector) {
    this.#iframe.mount(domElementSelector);
    const sub = (data, callback) => {
      if (data.name === this.#iframe.name) {
        callback({
          ...this.#metaData,
          record: this.#recordData,
          context: this.#context,
        });

        bus.off(ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY, sub);

        bus
          // .target(location.origin)
          .emit(
            ELEMENT_EVENTS_TO_CONTAINER.ELEMENT_MOUNTED + this.#containerId,
            {
              id: this.#recordData.token,
              containerId: this.#containerId,
            },
          );
        this.#isMounted = true;
      }
    };
    bus
      .target(properties.IFRAME_SECURE_ORGIN)
      .on(ELEMENT_EVENTS_TO_IFRAME.REVEAL_FRAME_READY, sub);
  }

  // Gateway
  iframeName(): string {
    return this.#iframe.name;
  }

  isMounted():boolean {
    return this.#isMounted;
  }

  hasToken():boolean {
    if (this.#recordData.token) return true;
    return false;
  }
}

export default RevealElement;
