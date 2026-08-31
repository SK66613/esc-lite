import type { Project } from '../../project/schema';
import type { CapabilityManifest } from '../capabilities/buildCapabilityManifest';
import type { AIPlan } from '../schema/AIPlanSchema';
export interface AIPlannerInput {message:string;project:Project;capabilities:CapabilityManifest}
export interface AIPlanner {plan(input:AIPlannerInput):Promise<AIPlan>}
