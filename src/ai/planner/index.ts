import type { AIPlanner } from './AIPlanner';
import { MockAIPlanner } from './MockAIPlanner';

export const aiPlanner: AIPlanner = new MockAIPlanner();
export type { AIPlanner, AIPlannerInput } from './AIPlanner';
