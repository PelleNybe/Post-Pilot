jest.mock('@temporalio/common', () => ({
  TypedSearchAttributes: jest.fn().mockImplementation((attrs) => ({ attrs })),
  SearchAttributeType: {
    TEXT: 'TEXT',
    KEYWORD: 'KEYWORD',
    INT: 'INT',
    DOUBLE: 'DOUBLE',
    BOOL: 'BOOL',
    DATETIME: 'DATETIME',
    KEYWORD_LIST: 'KEYWORD_LIST',
  },
  defineSearchAttributeKey: jest.fn((name: string, type: string) => ({
    name,
    type,
  })),
}));

jest.mock('@temporalio/workflow', () => {
  const getPostsList = jest.fn();
  const inAppNotification = jest.fn();
  const changeState = jest.fn();
  const updatePost = jest.fn();
  const sendWebhooks = jest.fn();
  const isCommentable = jest.fn();
  const postSocial = jest.fn();
  const postComment = jest.fn();
  const getIntegrationById = jest.fn();
  const refreshToken = jest.fn();
  const internalPlugs = jest.fn();
  const globalPlugs = jest.fn();
  const processInternalPlug = jest.fn();
  const processPlug = jest.fn();

  const condition = jest.fn();
  const sleep = jest.fn();
  const startChild = jest.fn();
  const setHandler = jest.fn();

  class MockApplicationFailure extends Error {
    constructor(public type: string, message = '') {
      super(message);
    }
  }
  class MockActivityFailure extends Error {
    constructor(public cause?: unknown) {
      super('ActivityFailure');
    }
  }

  return {
    __mocks: {
      getPostsList,
      inAppNotification,
      changeState,
      updatePost,
      sendWebhooks,
      isCommentable,
      postSocial,
      postComment,
      getIntegrationById,
      refreshToken,
      internalPlugs,
      globalPlugs,
      processInternalPlug,
      processPlug,
      condition,
      sleep,
      startChild,
      setHandler,
    },
    ActivityFailure: MockActivityFailure,
    ApplicationFailure: MockApplicationFailure,
    condition: (...args: any[]) => condition(...args),
    sleep: (...args: any[]) => sleep(...args),
    startChild: (...args: any[]) => startChild(...args),
    setHandler: (...args: any[]) => setHandler(...args),
    defineSignal: (name: string) => ({ name }),
    uuid4: () => '12345678-90ab-cdef-1234-567890abcdef',
    proxyActivities: (opts: { taskQueue?: string }) =>
      opts?.taskQueue
        ? {
            postSocial,
            postComment,
            getIntegrationById,
            refreshToken,
            internalPlugs,
            globalPlugs,
            processInternalPlug,
            processPlug,
          }
        : {
            getPostsList,
            inAppNotification,
            changeState,
            updatePost,
            sendWebhooks,
            isCommentable,
          },
  };
});

import * as workflow from '@temporalio/workflow';
import { ActivityFailure, ApplicationFailure } from '@temporalio/workflow';
import { postWorkflowV101 } from './post.workflow.v1.0.1';

const {
  getPostsList: mockGetPostsList,
  inAppNotification: mockInAppNotification,
  changeState: mockChangeState,
  updatePost: mockUpdatePost,
  sendWebhooks: mockSendWebhooks,
  isCommentable: mockIsCommentable,
  postSocial: mockPostSocial,
  internalPlugs: mockInternalPlugs,
  globalPlugs: mockGlobalPlugs,
  condition: mockCondition,
  sleep: mockSleep,
} = (workflow as any).__mocks;

describe('postWorkflowV101', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCondition.mockResolvedValue(true);
    mockSleep.mockResolvedValue(undefined);
    mockIsCommentable.mockResolvedValue(false);
    mockInternalPlugs.mockResolvedValue([]);
    mockGlobalPlugs.mockResolvedValue([]);
  });

  it('returns early when post is missing or not in QUEUE state', async () => {
    mockGetPostsList.mockResolvedValue([]);
    await postWorkflowV101({
      taskQueue: 'x',
      postId: 'p1',
      organizationId: 'org1',
    });
    expect(mockPostSocial).not.toHaveBeenCalled();

    mockGetPostsList.mockResolvedValue([
      { id: 'p1', state: 'PUBLISHED', publishDate: new Date().toISOString() },
    ]);
    await postWorkflowV101({
      taskQueue: 'x',
      postId: 'p1',
      organizationId: 'org1',
      postNow: false,
    });
    expect(mockPostSocial).not.toHaveBeenCalled();
  });

  it('notifies and aborts when integration requires reconnect or is disabled', async () => {
    mockGetPostsList.mockResolvedValue([
      {
        id: 'p1',
        state: 'QUEUE',
        organizationId: 'org1',
        publishDate: new Date().toISOString(),
        integration: {
          id: 'int1',
          providerIdentifier: 'x',
          name: 'Main X',
          refreshNeeded: true,
        },
      },
    ]);

    await postWorkflowV101({
      taskQueue: 'x',
      postId: 'p1',
      organizationId: 'org1',
      postNow: true,
    });

    expect(mockInAppNotification).toHaveBeenCalledWith(
      'org1',
      expect.stringContaining('x'),
      expect.stringContaining('reconnect'),
      true,
      false,
      'info'
    );
    expect(mockPostSocial).not.toHaveBeenCalled();
  });

  it('publishes post immediately, updates post state, notifies, and dispatches webhooks', async () => {
    mockGetPostsList.mockResolvedValue([
      {
        id: 'p1',
        state: 'QUEUE',
        organizationId: 'org1',
        publishDate: new Date().toISOString(),
        settings: '{}',
        integration: {
          id: 'int1',
          organizationId: 'org1',
          providerIdentifier: 'x',
          name: 'Main X',
          refreshNeeded: false,
          disabled: false,
        },
      },
    ]);
    mockPostSocial.mockResolvedValue([
      { id: 'p1', postId: 'ext-1', releaseURL: 'https://x.com/1', status: 'posted' },
    ]);

    await postWorkflowV101({
      taskQueue: 'x',
      postId: 'p1',
      organizationId: 'org1',
      postNow: true,
    });

    expect(mockUpdatePost).toHaveBeenCalledWith('p1', 'ext-1', 'https://x.com/1');
    expect(mockSendWebhooks).toHaveBeenCalledWith('ext-1', 'org1', 'int1');
    expect(mockInAppNotification).toHaveBeenCalledWith(
      'org1',
      expect.stringContaining('published'),
      expect.stringContaining('https://x.com/1'),
      true,
      true
    );
  });

  it('sets post state to ERROR when non-retryable bad_body failure occurs', async () => {
    const post = {
      id: 'p1',
      state: 'QUEUE',
      organizationId: 'org1',
      publishDate: new Date().toISOString(),
      integration: {
        id: 'int1',
        organizationId: 'org1',
        providerIdentifier: 'linkedin',
        name: 'LI',
      },
    };
    mockGetPostsList.mockResolvedValue([post]);

    const appErr = new (ApplicationFailure as any)('bad_body', 'Invalid payload');
    const actErr = new (ActivityFailure as any)(appErr);
    Object.setPrototypeOf(appErr, ApplicationFailure.prototype);
    Object.setPrototypeOf(actErr, ActivityFailure.prototype);
    mockPostSocial.mockRejectedValue(actErr);

    const res = await postWorkflowV101({
      taskQueue: 'linkedin',
      postId: 'p1',
      organizationId: 'org1',
      postNow: true,
    });

    expect(res).toBe(false);
    expect(mockChangeState).toHaveBeenCalledWith('p1', 'ERROR', actErr, [post]);
    expect(mockInAppNotification).toHaveBeenCalledWith(
      'org1',
      expect.stringContaining('Error posting'),
      expect.stringContaining('Invalid payload'),
      true,
      false,
      'fail'
    );
  });
});
