export type { AIPlanner, AIPlannerInput } from './AIPlanner';
export { MockAIPlanner } from './MockAIPlanner';
export { RemoteAIPlanner } from './RemoteAIPlanner';
import type { AIPlanner } from './AIPlanner';
import { MockAIPlanner } from './MockAIPlanner';
import { RemoteAIPlanner } from './RemoteAIPlanner';

const mode = import.meta.env.VITE_AI_PLANNER;
const useMock = mode === 'mock' || (import.meta.env.DEV && mode !== 'remote');
export const aiPlanner: AIPlanner = useMock ? new MockAIPlanner() : new RemoteAIPlanner();
