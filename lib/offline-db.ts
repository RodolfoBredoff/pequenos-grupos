import Dexie, { Table } from 'dexie';

export interface OfflineMember {
  id: string;
  group_id: string;
  full_name: string;
  phone: string;
  birth_date: string;
  member_type: 'participant' | 'visitor';
  is_active: boolean;
  synced: boolean;
  updated_at: string;
}

export interface OfflineMeeting {
  id: string;
  group_id: string;
  meeting_date: string;
  is_cancelled: boolean;
  synced: boolean;
}

export interface OfflineAttendance {
  id: string;
  meeting_id: string;
  member_id: string;
  is_present: boolean;
  synced: boolean;
  created_at: string;
}

export interface PendingSync {
  id?: number;
  type: 'member' | 'meeting' | 'attendance';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
}

export class OfflineDatabase extends Dexie {
  members!: Table<OfflineMember>;
  meetings!: Table<OfflineMeeting>;
  attendance!: Table<OfflineAttendance>;
  pendingSync!: Table<PendingSync>;

  constructor() {
    super('PequenosGruposDB');
    
    this.version(1).stores({
      members: 'id, group_id, synced',
      meetings: 'id, group_id, meeting_date, synced',
      attendance: 'id, meeting_id, member_id, synced',
      pendingSync: '++id, type, timestamp'
    });
  }
}

export const db = new OfflineDatabase();
