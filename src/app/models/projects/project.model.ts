import { RecordModel } from 'pocketbase';

export interface Project extends RecordModel {
  name: string;
  description: string;
  color: string;
  owner: string;
}
