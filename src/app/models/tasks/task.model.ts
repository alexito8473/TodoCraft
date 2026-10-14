import type { RecordModel } from 'pocketbase';

export type TaskPriority = 'low' | 'medium' | 'high' | 'highest';

export interface Task extends RecordModel {
  title: string;
  description: string;
  project: string;
  phase: string;
  status: string;
  priority: TaskPriority;
  position: number;
  parent_task: string;
  assignees: string[];
  reporter: string;
}
