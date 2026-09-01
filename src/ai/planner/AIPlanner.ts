import type { Project } from '../../project/schema';
import type { CapabilityManifest } from '../capabilities/buildCapabilityManifest';
import type { AIPlan } from '../schema/AIPlanSchema';
export type AIConversationTurn = { role: 'user' | 'assistant'; content: string };
export interface AIPlannerInput {message:string;project:Project;capabilities:CapabilityManifest;conversation?:AIConversationTurn[]}
export interface AIPlanner {plan(input:AIPlannerInput):Promise<AIPlan>}
