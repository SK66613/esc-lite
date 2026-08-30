import type { Project } from '../schema';
export interface ProjectRepository { loadProject():Project; saveProject(project:Project):void; resetProject():Project; }
