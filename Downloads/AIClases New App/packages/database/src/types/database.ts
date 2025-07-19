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
          id: string
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
          instructor_id: string | null
          auto_update_version: number
          created_at: string
          updated_at: string
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
          price_credits?: number
          published?: boolean
          instructor_id?: string | null
          auto_update_version?: number
          created_at?: string
          updated_at?: string
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
          instructor_id?: string | null
          auto_update_version?: number
          created_at?: string
          updated_at?: string
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
      instructors: {
        Row: {
          id: string
          user_id: string
          bio: string | null
          expertise: string[]
          social_links: Json | null
          verified: boolean
          rating: number
          total_students: number
          total_courses: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bio?: string | null
          expertise?: string[]
          social_links?: Json | null
          verified?: boolean
          rating?: number
          total_students?: number
          total_courses?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          bio?: string | null
          expertise?: string[]
          social_links?: Json | null
          verified?: boolean
          rating?: number
          total_students?: number
          total_courses?: number
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
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          total_earned?: number
          total_spent?: number
          current_balance?: number
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
          last_accessed?: string
          created_at?: string
          updated_at?: string
        }
      }
      course_enrollments: {
        Row: {
          id: string
          user_id: string
          course_id: string
          enrolled_at: string
          completed_at: string | null
          credits_spent: number
          payment_method: string | null
          refunded: boolean
          certificate_issued: boolean
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          enrolled_at?: string
          completed_at?: string | null
          credits_spent: number
          payment_method?: string | null
          refunded?: boolean
          certificate_issued?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          enrolled_at?: string
          completed_at?: string | null
          credits_spent?: number
          payment_method?: string | null
          refunded?: boolean
          certificate_issued?: boolean
        }
      }
      course_reviews: {
        Row: {
          id: string
          user_id: string
          course_id: string
          rating: number
          comment: string | null
          helpful_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          rating: number
          comment?: string | null
          helpful_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          rating?: number
          comment?: string | null
          helpful_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      lesson_completions: {
        Row: {
          id: string
          user_id: string
          lesson_id: string
          completed_at: string
          time_spent_minutes: number | null
        }
        Insert: {
          id?: string
          user_id: string
          lesson_id: string
          completed_at?: string
          time_spent_minutes?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          lesson_id?: string
          completed_at?: string
          time_spent_minutes?: number | null
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'course' | 'achievement' | 'credit' | 'system' | 'mentor'
          read: boolean
          action_url: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: 'course' | 'achievement' | 'credit' | 'system' | 'mentor'
          read?: boolean
          action_url?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: 'course' | 'achievement' | 'credit' | 'system' | 'mentor'
          read?: boolean
          action_url?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
      user_preferences: {
        Row: {
          user_id: string
          language: string
          timezone: string
          email_notifications: boolean
          push_notifications: boolean
          daily_reminder: boolean
          weekly_summary: boolean
          theme: 'light' | 'dark' | 'auto'
          mentor_personality: 'friendly' | 'professional' | 'casual'
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          language?: string
          timezone?: string
          email_notifications?: boolean
          push_notifications?: boolean
          daily_reminder?: boolean
          weekly_summary?: boolean
          theme?: 'light' | 'dark' | 'auto'
          mentor_personality?: 'friendly' | 'professional' | 'casual'
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          language?: string
          timezone?: string
          email_notifications?: boolean
          push_notifications?: boolean
          daily_reminder?: boolean
          weekly_summary?: boolean
          theme?: 'light' | 'dark' | 'auto'
          mentor_personality?: 'friendly' | 'professional' | 'casual'
          created_at?: string
          updated_at?: string
        }
      }
      mentor_conversations: {
        Row: {
          id: string
          user_id: string
          title: string | null
          last_message_at: string
          message_count: number
          credits_used: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          last_message_at?: string
          message_count?: number
          credits_used?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          last_message_at?: string
          message_count?: number
          credits_used?: number
          created_at?: string
        }
      }
      mentor_messages: {
        Row: {
          id: string
          conversation_id: string
          role: 'user' | 'assistant'
          content: string
          credits_cost: number
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          role: 'user' | 'assistant'
          content: string
          credits_cost?: number
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: 'user' | 'assistant'
          content?: string
          credits_cost?: number
          metadata?: Json | null
          created_at?: string
        }
      }
      payment_transactions: {
        Row: {
          id: string
          user_id: string
          amount_usd: number
          credits_purchased: number
          payment_method: string
          payment_provider: string
          provider_transaction_id: string | null
          status: 'pending' | 'completed' | 'failed' | 'refunded'
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount_usd: number
          credits_purchased: number
          payment_method: string
          payment_provider: string
          provider_transaction_id?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount_usd?: number
          credits_purchased?: number
          payment_method?: string
          payment_provider?: string
          provider_transaction_id?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      user_certificates: {
        Row: {
          id: string
          user_id: string
          course_id: string
          certificate_hash: string
          issued_at: string
          verified: boolean
          ipfs_hash: string | null
          verification_url: string | null
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          certificate_hash: string
          issued_at?: string
          verified?: boolean
          ipfs_hash?: string | null
          verification_url?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          certificate_hash?: string
          issued_at?: string
          verified?: boolean
          ipfs_hash?: string | null
          verification_url?: string | null
        }
      }
      community_posts: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          post_type: 'question' | 'discussion' | 'showcase' | 'help'
          tags: string[]
          upvotes: number
          reply_count: number
          solved: boolean
          featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          post_type: 'question' | 'discussion' | 'showcase' | 'help'
          tags?: string[]
          upvotes?: number
          reply_count?: number
          solved?: boolean
          featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          post_type?: 'question' | 'discussion' | 'showcase' | 'help'
          tags?: string[]
          upvotes?: number
          reply_count?: number
          solved?: boolean
          featured?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      community_replies: {
        Row: {
          id: string
          post_id: string
          user_id: string
          content: string
          upvotes: number
          is_solution: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          content: string
          upvotes?: number
          is_solution?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          content?: string
          upvotes?: number
          is_solution?: boolean
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