import { createDefaultProject } from '../defaults';
import { migrateLegacyState } from '../migration/migrateLegacyState';
import { ProjectSchema, type Project } from '../schema';
import type { ProjectRepository } from './ProjectRepository';
export const PROJECT_STORAGE_KEY='escalita-lite-project-v2';
export const LEGACY_STORAGE_KEY='escalita-lite-demo-v1';
export class LocalStorageProjectRepository implements ProjectRepository {
  loadProject():Project {try{const current=localStorage.getItem(PROJECT_STORAGE_KEY);if(current)return ProjectSchema.parse(JSON.parse(current));const legacy=localStorage.getItem(LEGACY_STORAGE_KEY);if(legacy){const migrated=migrateLegacyState(JSON.parse(legacy));if(migrated){this.saveProject(migrated);return migrated;}}}catch{/* Invalid local data safely falls back. */}const project=createDefaultProject();this.saveProject(project);return project;}
  saveProject(project:Project){localStorage.setItem(PROJECT_STORAGE_KEY,JSON.stringify(ProjectSchema.parse(project)));}
  resetProject(){localStorage.removeItem(PROJECT_STORAGE_KEY);localStorage.removeItem(LEGACY_STORAGE_KEY);const project=createDefaultProject();this.saveProject(project);return project;}
}
