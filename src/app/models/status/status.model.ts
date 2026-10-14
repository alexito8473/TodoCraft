import type { RecordModel } from 'pocketbase';

export interface Status extends RecordModel {
  name: string;
  projects: string;
  category: string;
  color: string;
  position: number;
  is_initial: boolean;
}
