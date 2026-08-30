import { createDefaultProject } from '../defaults';
import { migrateLegacyState } from '../migration/migrateLegacyState';
import type { Project } from '../schema';
import { validateProjectRuntime } from '../validation/validateProjectRuntime';
import type { ProjectRepository } from './ProjectRepository';

export const PROJECT_STORAGE_KEY = 'escalita-lite-project-v2';
export const LEGACY_STORAGE_KEY = 'escalita-lite-demo-v1';

export class LocalStorageProjectRepository implements ProjectRepository {
  loadProject(): Project {
    try {
      const current = localStorage.getItem(PROJECT_STORAGE_KEY);
      if (current) {
        const result = validateProjectRuntime(JSON.parse(current));
        if (result.warnings.length) {
          console.warn('[Escalita] Project data repaired', result.warnings);
          this.saveProject(result.project);
        }
        return result.project;
      }
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        const migrated = migrateLegacyState(JSON.parse(legacy));
        if (migrated) { this.saveProject(migrated); return migrated; }
      }
    } catch (error) {
      console.warn('[Escalita] Invalid local project, loading defaults', error);
    }
    const project = createDefaultProject();
    this.saveProject(project);
    return project;
  }

  saveProject(project: Project): void {
    const validated = validateProjectRuntime(project).project;
    localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(validated));
  }

  resetProject(): Project {
    localStorage.removeItem(PROJECT_STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    const project = createDefaultProject();
    this.saveProject(project);
    return project;
  }
}
