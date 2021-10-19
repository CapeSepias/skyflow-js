import bus from 'framebus';
import PureJsFrameController from '../../../../src/container/internal/pureJs/PureJsFrameController';
import { ELEMENT_EVENTS_TO_IFRAME, LogLevel, PUREJS_TYPES } from '../../../../src/container/constants';
import clientModule from '../../../../src/client';
import * as busEvents from '../../../../src/utils/busEvents';

busEvents.getAccessToken = jest.fn(() => Promise.resolve('access token'));
const on = jest.fn();

const skyflowConfig = {
  vaultID: 'e20afc3ae1b54f0199f24130e51e0c11',
  vaultURL: 'https://testurl.com',
  getBearerToken: jest.fn(),
};

const clientData = {
  client: {
    config: { ...skyflowConfig },
    metadata: {},
  },
  context: { logLevel: LogLevel.PROD }
}

const records = {
  records: [
    {
      table: 'pii_fields',
      fields: {
        first_name: 'Joseph',
        primary_card: {
          card_number: '4111111111111111',
          cvv: '123',
        },
      },
    }],
};

const options = {
  tokens: true,
};

const insertResponse = {
  vaultID: 'vault123',
  responses: [
    {
      records: [
        {
          skyflow_id: 'testId',
        },
      ],
    },
    {
      fields: {
        '*': 'testId',
        first_name: 'token1',
        primary_card: {
          card_number: 'token2',
          cvv: 'token3',
        },
      },
    },
  ],
};

const insertResponseWithoutTokens = {
  vaultID: 'vault123',
  responses: [
    {
      records: [
        {
          skyflow_id: 'testId',
        },
      ],
    },
  ],
};

const errorResponse = {
  error: {
    http_code: 403,
    message: 'RBAC: access denied',
  },
};

describe('Inserting records into the vault', () => {
  let emitSpy;
  let targetSpy;
  beforeEach(() => {
    emitSpy = jest.spyOn(bus, 'emit');
    targetSpy = jest.spyOn(bus, 'target');
    targetSpy.mockReturnValue({
      on,
    });
  });

  test('insert records with tokens as true', (done) => {
    const clientReq = jest.fn(() => Promise.resolve(insertResponse));
    jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({ ...clientData.client, request: clientReq }));

    PureJsFrameController.init();

    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY);
    emitCb(clientData);

    const onCb = on.mock.calls[0][1];
    const data = {
      type: PUREJS_TYPES.INSERT,
      records,
      options,
    };
    const cb2 = jest.fn();
    onCb(data, cb2);

    setTimeout(() => {
      expect(cb2.mock.calls[0][0].records.length).toBe(1);
      expect(cb2.mock.calls[0][0].records[0].fields).toBeDefined();
      expect(cb2.mock.calls[0][0].error).toBeUndefined();
      done();
    }, 1000);
  });

  test('insert records with tokens as false', (done) => {
    const clientReq = jest.fn(() => Promise.resolve(insertResponseWithoutTokens));
    jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({ ...clientData.client, request: clientReq }));

    PureJsFrameController.init();

    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY);
    emitCb(clientData);

    const onCb = on.mock.calls[0][1];
    const data = {
      type: PUREJS_TYPES.INSERT,
      records,
      options: { tokens: false },
    };
    const cb2 = jest.fn();
    onCb(data, cb2);

    setTimeout(() => {
      expect(cb2.mock.calls[0][0].records.length).toBe(1);
      expect(cb2.mock.calls[0][0].records[0].fields).toBeUndefined();
      expect(cb2.mock.calls[0][0].error).toBeUndefined();
      done();
    }, 1000);
  });

  test('insert records with error', (done) => {
    const clientReq = jest.fn(() => Promise.reject(errorResponse));
    jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({ ...clientData.client, request: clientReq }));

    PureJsFrameController.init();

    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY);
    emitCb(clientData);

    const onCb = on.mock.calls[0][1];
    const data = {
      type: PUREJS_TYPES.INSERT,
      records,
      options,
    };
    const cb2 = jest.fn();
    onCb(data, cb2);

    setTimeout(() => {
      expect(cb2.mock.calls[0][0].error).toBeDefined();
      done();
    }, 1000);
  });
});

const detokenizeRecords = [{
  token: 'token1',
  redaction: 'PLAIN_TEXT',
}];
const detokenizeResponse = {
  records: [{
    token_id: 'token1',
    fields: {
      cvv: '123',
    },
  }],
};
const detokenizeErrorResponse = {
  error: {
    grpc_code: 5,
    http_code: 404,
    message: 'Token not found for token1',
    http_status: 'Not Found',
    details: [],
  },
};

describe('Retrieving data using skyflow tokens', () => {
  let emitSpy;
  let targetSpy;
  beforeEach(() => {
    emitSpy = jest.spyOn(bus, 'emit');
    targetSpy = jest.spyOn(bus, 'target');
    targetSpy.mockReturnValue({
      on,
    });
  });

  test('detokenize success', (done) => {
    const clientReq = jest.fn(() => Promise.resolve(detokenizeResponse));
    jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({ ...clientData.client, request: clientReq }));

    PureJsFrameController.init();

    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY);
    emitCb(clientData);

    const onCb = on.mock.calls[0][1];
    const data = {
      type: PUREJS_TYPES.DETOKENIZE,
      records: detokenizeRecords,
    };
    const cb2 = jest.fn();
    onCb(data, cb2);

    setTimeout(() => {
      expect(cb2.mock.calls[0][0].records.length).toBe(1);
      done();
    }, 1000);
  });

  test('detokenize error', (done) => {
    const clientReq = jest.fn(() => Promise.reject(detokenizeErrorResponse));
    jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({ ...clientData.client, request: clientReq }));

    PureJsFrameController.init();

    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY);
    emitCb(clientData);

    const onCb = on.mock.calls[0][1];
    const data = {
      type: PUREJS_TYPES.DETOKENIZE,
      records: detokenizeRecords,
    };
    const cb2 = jest.fn();
    onCb(data, cb2);

    setTimeout(() => {
      expect(cb2.mock.calls[0][0].records).toBeUndefined();
      expect(cb2.mock.calls[0][0].error).toBeDefined();
      done();
    }, 1000);
  });
});

const getByIdReq = [{
  ids: ['id1'],
  redaction: 'PLAIN_TEXT',
  table: 'table1',
}];

const getByIdRes = {
  records: [{
    fields: {
      skyflow_id: 'id1',
      cvv: '123',
    },
  }],
};

describe('Retrieving data using skyflowId', () => {
  let emitSpy;
  let targetSpy;
  beforeEach(() => {
    emitSpy = jest.spyOn(bus, 'emit');
    targetSpy = jest.spyOn(bus, 'target');
    targetSpy.mockReturnValue({
      on,
    });
  });

  test('getById success', (done) => {
    const clientReq = jest.fn(() => Promise.resolve(getByIdRes));
    jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({ ...clientData.client, request: clientReq }));

    PureJsFrameController.init();

    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY);
    emitCb(clientData);

    const onCb = on.mock.calls[0][1];
    const data = {
      type: PUREJS_TYPES.GET_BY_SKYFLOWID,
      records: getByIdReq,
    };
    const cb2 = jest.fn();
    onCb(data, cb2);

    setTimeout(() => {
      expect(cb2.mock.calls[0][0].records.length).toBe(1);
      done();
    }, 1000);
  });

  test('getById error', (done) => {
    const clientReq = jest.fn(() => Promise.reject(errorResponse));
    jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({ ...clientData.client, request: clientReq }));

    PureJsFrameController.init();

    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY);
    emitCb(clientData);

    const onCb = on.mock.calls[0][1];
    const data = {
      type: PUREJS_TYPES.GET_BY_SKYFLOWID,
      records: getByIdReq,
    };
    const cb2 = jest.fn();
    onCb(data, cb2);

    setTimeout(() => {
      expect(cb2.mock.calls[0][0].error).toBeDefined();
      done();
    }, 1000);
  });
});

const invokeGatewayReq = {
  gatewayURL: 'http://gatewayurl.com',
  methodName: 'POST',
  pathParams: {
    cardNumber: '4111111111111111',
  },
  queryParams: {
    expiryDate: '12/2024',
  },
  responseBody: {
    resource: {
      cvv: 'cvvId:123',
    },
  },
};

const invokeGatewayRes = {
  receivedTimestamp: '2019-05-29 21:49:56.625',
  processingTimeinMs: 116,
  resource: {
    cvv: '123',
  },
};

describe('Invoking gateway', () => {
  let emitSpy;
  let targetSpy;
  let windowSpy;
  beforeEach(() => {
    emitSpy = jest.spyOn(bus, 'emit');
    targetSpy = jest.spyOn(bus, 'target');
    targetSpy.mockReturnValue({
      on,
    });

    const ifrm = document.createElement('iframe');
    ifrm.setAttribute('id', 'cvvId:123');
    ifrm.setAttribute('name', 'cvvId:123');
    document.body.appendChild(ifrm);

    windowSpy = jest.spyOn(global, 'window', 'get');
    windowSpy.mockImplementation(() => ({
      parent: {
        frames: {
          'cvvId:123': ifrm,
        },
      },
    }));
  });

  test('Invoke gateway success', (done) => {
    const clientReq = jest.fn(() => Promise.resolve(invokeGatewayRes));
    jest.spyOn(clientModule, 'fromJSON').mockImplementation(() => ({ ...clientData.client, request: clientReq }));

    PureJsFrameController.init();

    const emitEventName = emitSpy.mock.calls[0][0];
    const emitCb = emitSpy.mock.calls[0][2];
    expect(emitEventName).toBe(ELEMENT_EVENTS_TO_IFRAME.PUREJS_FRAME_READY);
    emitCb(clientData);

    const onCb = on.mock.calls[0][1];
    const data = {
      type: PUREJS_TYPES.INVOKE_GATEWAY,
      config: invokeGatewayReq,
    };
    const cb2 = jest.fn();
    onCb(data, cb2);

    setTimeout(() => {
      expect(cb2.mock.calls[0][0].error).toBeUndefined();
      expect(!('resource' in cb2.mock.calls[0][0])).toBeTruthy();
      done();
    }, 1000);
  });
});

describe('Failed to fetch accessToken', () => {
  let emitSpy;
  let targetSpy;
  beforeEach(() => {
    emitSpy = jest.spyOn(bus, 'emit');
    targetSpy = jest.spyOn(bus, 'target');
    targetSpy.mockReturnValue({
      on,
    });
  });

  test('accessToken error', (done) => {
    busEvents.getAccessToken = jest.fn(() => Promise.reject({ error: 'error' }));
    PureJsFrameController.init();
    const onCb = on.mock.calls[0][1];

    const insertData = {
      type: PUREJS_TYPES.INSERT,
      records,
    };
    const insertCb = jest.fn();
    onCb(insertData, insertCb);

    const detokenizeData = {
      type: PUREJS_TYPES.DETOKENIZE,
      records: detokenizeRecords,
    };
    const detokenizeCb = jest.fn();
    onCb(detokenizeData, detokenizeCb);

    const getByIdData = {
      type: PUREJS_TYPES.GET_BY_SKYFLOWID,
      records: getByIdReq,
    };
    const getByIdCb = jest.fn();
    onCb(getByIdData, getByIdCb);

    setTimeout(() => {
      expect(insertCb.mock.calls[0][0].error).toBeDefined();
      expect(detokenizeCb.mock.calls[0][0].error).toBeDefined();
      expect(getByIdCb.mock.calls[0][0].error).toBeDefined();
      done();
    }, 1000);
  });
});