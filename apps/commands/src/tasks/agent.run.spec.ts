import { AgentRun } from './agent.run';

describe('AgentRun command', () => {
  it('starts the agent graph stream and iterates emitted events', async () => {
    async function* fakeStream() {
      yield { step: 1 };
      yield { step: 2 };
    }
    const agentGraphService = {
      start: jest.fn().mockReturnValue(fakeStream()),
    };
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    const cmd = new AgentRun(agentGraphService as any);
    await cmd.agentRun('org-1', 'AI scheduling');

    expect(agentGraphService.start).toHaveBeenCalledWith('org-1', {
      research: 'AI scheduling',
      isPicture: false,
      format: 'one_short',
      tone: 'personal',
    });
    expect(logSpy).toHaveBeenCalledTimes(2);
    logSpy.mockRestore();
  });
});
