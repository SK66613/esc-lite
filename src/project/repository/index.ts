import { LocalStorageProjectRepository } from './LocalStorageProjectRepository';
import type { ProjectRepository } from './ProjectRepository';
export const projectRepository:ProjectRepository=new LocalStorageProjectRepository();
