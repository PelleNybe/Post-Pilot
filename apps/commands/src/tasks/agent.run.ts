import { Command, Positional } from 'nestjs-command';
import { Injectable } from '@nestjs/common';
import { AgentGraphService } from '@postpilot/nestjs-libraries/agent/agent.graph.service';

@Injectable()
export class AgentRun {
  constructor(private _agentGraphService: AgentGraphService) {}
  @Command({
    command: 'run:agent <orgId> <research>',
    describe: 'Run the agent graph for an organization',
  })
  async agentRun(
    @Positional({ name: 'orgId', type: 'string' }) orgId: string,
    @Positional({ name: 'research', type: 'string' }) research: string,
  ) {
    const stream = this._agentGraphService.start(orgId, {
      research,
      isPicture: false,
      format: 'one_short',
      tone: 'personal',
    });
    for await (const event of stream) {
      console.log(event);
    }
  }
}
