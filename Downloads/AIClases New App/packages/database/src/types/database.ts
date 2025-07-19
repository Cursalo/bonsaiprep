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
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          title: string
          description: string
          slug: string
          thumbnail: string | null
          category: string
          level: 'beginner' | 'intermediate' | 'advanced'
          duration_hours: number
          price_credits: number
          published: boolean
          created_at: string
          updated_at: string
          auto_update_version: number
        }
        Insert: {
          id?: string
          title: string
          description: string
          slug: string
          thumbnail?: string | null
          category: string
          level: 'beginner' | 'intermediate' | 'advanced'
          duration_hours: number
          price_credits: number
          published?: boolean
          created_at?: string
          updated_at?: string
          auto_update_version?: number
        }
        Update: {
          id?: string
          title?: string
          description?: string
          slug?: string
          thumbnail?: string | null
          category?: string
          level?: 'beginner' | 'intermediate' | 'advanced'
          duration_hours?: number
          price_credits?: number
          published?: boolean
          created_at?: string
          updated_at?: string
          auto_update_version?: number
        }
      }
      lessons: {
        Row: {
          id: string
          course_id: string
          title: string
          description: string
          content: string
          order_index: number
          duration_minutes: number
          dynamic_content_blocks: Json | null
          published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          description: string
          content: string
          order_index: number
          duration_minutes: number
          dynamic_content_blocks?: Json | null
          published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          description?: string
          content?: string
          order_index?: number
          duration_minutes?: number
          dynamic_content_blocks?: Json | null
          published?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_credits: {
        Row: {
          user_id: string
          total_earned: number
          total_spent: number
          current_balance: number
          level: number
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          total_earned?: number
          total_spent?: number
          current_balance?: number
          level?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          total_earned?: number
          total_spent?: number
          current_balance?: number
          level?: number
          created_at?: string
          updated_at?: string
        }
      }
      credit_transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          transaction_type: string
          reference_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          transaction_type: string
          reference_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          transaction_type?: string
          reference_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          course_id: string
          completed_lessons: number
          total_lessons: number
          last_lesson_id: string | null
          completion_percentage: number
          last_accessed: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          completed_lessons?: number
          total_lessons?: number
          last_lesson_id?: string | null
          completion_percentage?: number
          last_accessed?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          completed_lessons?: number
          total_lessons?: number
          last_lesson_id?: string | null
          completion_percentage?: number
          last_accessed?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_credits: {
        Args: {
          p_user_id: string
          p_amount: number
          p_transaction_type: string
          p_metadata: Json
        }
        Returns: boolean
      }
      deduct_credits: {
        Args: {
          p_user_id: string
          p_amount: number
          p_transaction_type: string
          p_metadata: Json
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}