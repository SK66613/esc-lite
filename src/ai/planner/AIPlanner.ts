import type { Project } from '../../project/schema';
import type { CapabilityManifest } from '../capabilities/buildCapabilityManifest';
import type { AIPlan } from '../schema/AIPlanSchema';

export const MAX_AI_CONVERSATION_TURNS = 8;
export const MAX_AI_CONVERSATION_CHARS = 6000;
export const MAX_AI_CONVERSATION_TURN_CHARS = 1500;

export interface AIConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIPlannerInput {
  message: string;
  project: Project;
  capabilities: CapabilityManifest;
  conversation?: AIConversationTurn[];
}

export interface AIPlanner {
  plan(input: AIPlannerInput): Promise<AIPlan>;
}

export function boundAIConversation(turns: AIConversationTurn[] = []): AIConversationTurn[] {
  const result: AIConversationTurn[] = [];
  let remaining = MAX_AI_CONVERSATION_CHARS;
  for (let index = turns.length - 1; index >= 0 && result.length < MAX_AI_CONVERSATION_TURNS && remaining > 0; index -= 1) {
    const turn = turns[index];
    let content = turn.content.trim();
    if (!content) continue;
    content = content.slice(0, MAX_AI_CONVERSATION_TURN_CHARS);
    if (content.length > remaining) content = content.slice(0, remaining);
    result.unshift({ role: turn.role, content });
    remaining -= content.length;
  }
  return result;
}
