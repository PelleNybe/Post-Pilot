import { Metadata } from 'next';
import { Agent } from '@postpilot/frontend/components/agents/agent';
import { AgentChat } from '@postpilot/frontend/components/agents/agent.chat';
export const metadata: Metadata = {
  title: 'PostPilot - Agent',
  description: '',
};
export default async function Page() {
  return (
    <AgentChat />
  );
}
