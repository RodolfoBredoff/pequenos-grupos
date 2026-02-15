export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          organization_id: string
          name: string
          default_meeting_day: number
          default_meeting_time: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          default_meeting_day: number
          default_meeting_time: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          default_meeting_day?: number
          default_meeting_time?: string
          created_at?: string
          updated_at?: string
        }
      }
      leaders: {
        Row: {
          id: string
          organization_id: string
          group_id: string | null
          full_name: string
          email: string
          phone: string | null
          created_at: string
        }
        Insert: {
          id: string
          organization_id: string
          group_id?: string | null
          full_name: string
          email: string
          phone?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          group_id?: string | null
          full_name?: string
          email?: string
          phone?: string | null
          created_at?: string
        }
      }
      members: {
        Row: {
          id: string
          group_id: string
          full_name: string
          phone: string
          birth_date: string
          member_type: 'participant' | 'visitor'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          full_name: string
          phone: string
          birth_date: string
          member_type: 'participant' | 'visitor'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          full_name?: string
          phone?: string
          birth_date?: string
          member_type?: 'participant' | 'visitor'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      meetings: {
        Row: {
          id: string
          group_id: string
          meeting_date: string
          is_cancelled: boolean
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          meeting_date: string
          is_cancelled?: boolean
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          meeting_date?: string
          is_cancelled?: boolean
          notes?: string | null
          created_at?: string
        }
      }
      attendance: {
        Row: {
          id: string
          meeting_id: string
          member_id: string
          is_present: boolean
          created_at: string
        }
        Insert: {
          id?: string
          meeting_id: string
          member_id: string
          is_present: boolean
          created_at?: string
        }
        Update: {
          id?: string
          meeting_id?: string
          member_id?: string
          is_present?: boolean
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          group_id: string
          notification_type: 'absence_alert' | 'birthday'
          member_id: string | null
          message: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          notification_type: 'absence_alert' | 'birthday'
          member_id?: string | null
          message: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          notification_type?: 'absence_alert' | 'birthday'
          member_id?: string | null
          message?: string
          is_read?: boolean
          created_at?: string
        }
      }
    }
    Functions: {
      get_consecutive_absences: {
        Args: {
          member_uuid: string
          limit_count?: number
        }
        Returns: {
          meeting_date: string
          is_present: boolean
        }[]
      }
      get_birthdays_today: {
        Args: {
          group_uuid: string
        }
        Returns: {
          id: string
          full_name: string
          phone: string
          birth_date: string
        }[]
      }
    }
  }
}
