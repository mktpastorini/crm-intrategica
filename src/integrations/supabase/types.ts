export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
        ]
      }
      leads: {
        Row: {
          address: string | null
          company: string
          created_at: string
          email: string | null
          id: string
          name: string
          niche: string
          phone: string
          pipeline_stage: string | null
          place_id: string | null
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
          name: string
          niche: string
          phone: string
          pipeline_stage?: string | null
          place_id?: string | null
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
          name?: string
          niche?: string
          phone?: string
          pipeline_stage?: string | null
          place_id?: string | null
          rating?: number | null
          responsible_id?: string
          status?: string
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
