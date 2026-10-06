export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          address: string
          assigned_provider_id: string | null
          created_at: string
          customer_id: string
          customer_name: string
          customer_phone: string
          description: string | null
          id: string
          payment_amount: number | null
          preferred_time: string | null
          service_id: string | null
          status: string | null
          updated_at: string
          image_url: string | null
          before_photo_url: string | null
          after_photo_url: string | null
          reached_site: boolean | null
        }
        Insert: {
          address: string
          assigned_provider_id?: string | null
          created_at?: string
          customer_id: string
          customer_name: string
          customer_phone: string
          description?: string | null
          id?: string
          payment_amount?: number | null
          preferred_time?: string | null
          service_id?: string | null
          status?: string | null
          updated_at?: string
          image_url?: string | null
          before_photo_url?: string | null
          after_photo_url?: string | null
          reached_site?: boolean | null
        }
        Update: {
          address?: string
          assigned_provider_id?: string | null
          created_at?: string
          customer_id?: string
          customer_name?: string
          customer_phone?: string
          description?: string | null
          id?: string
          payment_amount?: number | null
          preferred_time?: string | null
          service_id?: string | null
          status?: string | null
          updated_at?: string
          image_url?: string | null
          before_photo_url?: string | null
          after_photo_url?: string | null
          reached_site?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_assigned_provider_id_fkey"
            columns: ["assigned_provider_id"]
            isOneToOne: false
            referencedRelation: "provider_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          id: string
          booking_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          rating?: number
          comment?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      provider_profiles: {
        Row: {
          address: string | null
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          is_approved: boolean | null
          is_available: boolean | null
          phone: string
          skills: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id?: string
          is_approved?: boolean | null
          is_available?: boolean | null
          phone: string
          skills?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_approved?: boolean | null
          is_available?: boolean | null
          phone?: string
          skills?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          icon: string
          id: string
          is_active: boolean | null
          name_en: string
          name_hi: string
          name_mr: string
          starting_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon: string
          id?: string
          is_active?: boolean | null
          name_en: string
          name_hi: string
          name_mr: string
          starting_price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean | null
          name_en?: string
          name_hi?: string
          name_mr?: string
          starting_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      phone_otps: {
        Row: {
          id: string
          phone: string
          otp: string
          expires_at: string
          verified: boolean
          created_at: string
        }
        Insert: {
          id?: string
          phone: string
          otp: string
          expires_at: string
          verified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          phone?: string
          otp?: string
          expires_at?: string
          verified?: boolean
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "provider"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "provider"],
    },
  },
} as const
