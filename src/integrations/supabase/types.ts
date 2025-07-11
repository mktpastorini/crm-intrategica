export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      daily_activities: {
        Row: {
          created_at: string | null
          date: string
          events_created: number | null
          id: string
          leads_added: number | null
          leads_moved: Json | null
          messages_sent: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date?: string
          events_created?: number | null
          id?: string
          leads_added?: number | null
          leads_moved?: Json | null
          messages_sent?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          events_created?: number | null
          id?: string
          leads_added?: number | null
          leads_moved?: Json | null
          messages_sent?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          company: string | null
          completed: boolean | null
          created_at: string
          date: string
          id: string
          lead_id: string | null
          lead_name: string | null
          responsible_id: string
          time: string
          title: string
          type: string
        }
        Insert: {
          company?: string | null
          completed?: boolean | null
          created_at?: string
          date: string
          id?: string
          lead_id?: string | null
          lead_name?: string | null
          responsible_id: string
          time: string
          title: string
          type: string
        }
        Update: {
          company?: string | null
          completed?: boolean | null
          created_at?: string
          date?: string
          id?: string
          lead_id?: string | null
          lead_name?: string | null
          responsible_id?: string
          time?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_events_lead"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_events_responsible"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_message_history: {
        Row: {
          id: string
          lead_email: string | null
          lead_id: string | null
          lead_name: string | null
          lead_phone: string | null
          media_url: string | null
          message_content: string | null
          message_title: string | null
          message_type: string | null
          schedule_id: string | null
          sent_at: string
          stage: string | null
          webhook_url: string | null
        }
        Insert: {
          id?: string
          lead_email?: string | null
          lead_id?: string | null
          lead_name?: string | null
          lead_phone?: string | null
          media_url?: string | null
          message_content?: string | null
          message_title?: string | null
          message_type?: string | null
          schedule_id?: string | null
          sent_at?: string
          stage?: string | null
          webhook_url?: string | null
        }
        Update: {
          id?: string
          lead_email?: string | null
          lead_id?: string | null
          lead_name?: string | null
          lead_phone?: string | null
          media_url?: string | null
          message_content?: string | null
          message_title?: string | null
          message_type?: string | null
          schedule_id?: string | null
          sent_at?: string
          stage?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journey_message_history_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "journey_message_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_message_schedules: {
        Row: {
          created_at: string
          id: string
          lead_email: string | null
          lead_id: string
          lead_name: string | null
          lead_phone: string | null
          media_url: string | null
          message_content: string | null
          message_title: string | null
          message_type: string | null
          scheduled_for: string
          sent_at: string | null
          stage: string
          webhook_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          lead_email?: string | null
          lead_id: string
          lead_name?: string | null
          lead_phone?: string | null
          media_url?: string | null
          message_content?: string | null
          message_title?: string | null
          message_type?: string | null
          scheduled_for: string
          sent_at?: string | null
          stage: string
          webhook_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          lead_email?: string | null
          lead_id?: string
          lead_name?: string | null
          lead_phone?: string | null
          media_url?: string | null
          message_content?: string | null
          message_title?: string | null
          message_type?: string | null
          scheduled_for?: string
          sent_at?: string | null
          stage?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      lead_contacts: {
        Row: {
          created_at: string
          email: string | null
          id: string
          lead_id: string
          name: string
          phone: string
          position: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          lead_id: string
          name: string
          phone: string
          position?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          lead_id?: string
          name?: string
          phone?: string
          position?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_contacts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          address: string | null
          company: string
          created_at: string
          email: string | null
          id: string
          instagram: string | null
          name: string
          niche: string
          phone: string
          pipeline_stage: string
          place_id: string | null
          proposal_id: string | null
          rating: number | null
          responsible_id: string
          status: string
          updated_at: string
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          company: string
          created_at?: string
          email?: string | null
          id?: string
          instagram?: string | null
          name: string
          niche: string
          phone: string
          pipeline_stage?: string
          place_id?: string | null
          proposal_id?: string | null
          rating?: number | null
          responsible_id: string
          status?: string
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          company?: string
          created_at?: string
          email?: string | null
          id?: string
          instagram?: string | null
          name?: string
          niche?: string
          phone?: string
          pipeline_stage?: string
          place_id?: string | null
          proposal_id?: string | null
          rating?: number | null
          responsible_id?: string
          status?: string
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_leads_responsible"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_approvals: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          description: string
          details: Json | null
          id: string
          status: string
          type: string
          user_id: string
          user_name: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          description: string
          details?: Json | null
          id?: string
          status?: string
          type: string
          user_id: string
          user_name: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          description?: string
          details?: Json | null
          id?: string
          status?: string
          type?: string
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      pipeline_stages: {
        Row: {
          color: string
          created_at: string
          description: string | null
          id: string
          name: string
          order: number
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          id: string
          name: string
          order?: number
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          order?: number
          updated_at?: string
        }
        Relationships: []
      }
      products_services: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          price: number
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          price: number
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          price?: number
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          last_login: string | null
          name: string
          role: string
          status: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          last_login?: string | null
          name: string
          role?: string
          status?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          last_login?: string | null
          name?: string
          role?: string
          status?: string
        }
        Relationships: []
      }
      proposal_items: {
        Row: {
          created_at: string
          id: string
          product_service_id: string | null
          proposal_id: string | null
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_service_id?: string | null
          proposal_id?: string | null
          quantity?: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          product_service_id?: string | null
          proposal_id?: string | null
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposal_items_product_service_id_fkey"
            columns: ["product_service_id"]
            isOneToOne: false
            referencedRelation: "products_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_items_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          content: string
          created_at: string
          id: string
          lead_id: string | null
          title: string
          total_value: number
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          lead_id?: string | null
          title: string
          total_value?: number
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          lead_id?: string | null
          title?: string
          total_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string
          favicon_url: string | null
          google_maps_api_key: string | null
          id: string
          journey_webhook_url: string | null
          logo_url: string | null
          message_webhook_url: string | null
          primary_color: string | null
          report_webhook_enabled: boolean | null
          report_webhook_time: string | null
          report_webhook_url: string | null
          report_whatsapp_number: string | null
          secondary_color: string | null
          system_name: string | null
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          created_at?: string
          favicon_url?: string | null
          google_maps_api_key?: string | null
          id?: string
          journey_webhook_url?: string | null
          logo_url?: string | null
          message_webhook_url?: string | null
          primary_color?: string | null
          report_webhook_enabled?: boolean | null
          report_webhook_time?: string | null
          report_webhook_url?: string | null
          report_whatsapp_number?: string | null
          secondary_color?: string | null
          system_name?: string | null
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          created_at?: string
          favicon_url?: string | null
          google_maps_api_key?: string | null
          id?: string
          journey_webhook_url?: string | null
          logo_url?: string | null
          message_webhook_url?: string | null
          primary_color?: string | null
          report_webhook_enabled?: boolean | null
          report_webhook_time?: string | null
          report_webhook_url?: string | null
          report_whatsapp_number?: string | null
          secondary_color?: string | null
          system_name?: string | null
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
