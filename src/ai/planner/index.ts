export type {AIPlanner,AIPlannerInput} from './AIPlanner';
export {MockAIPlanner} from './MockAIPlanner';
import {MockAIPlanner} from './MockAIPlanner';
import type {AIPlanner} from './AIPlanner';
export const aiPlanner:AIPlanner=new MockAIPlanner();
