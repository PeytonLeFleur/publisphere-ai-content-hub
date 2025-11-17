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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agencies: {
        Row: {
          contact_email: string
          created_at: string | null
          custom_domain: string | null
          id: string
          logo_url: string | null
          name: string
          primary_color: string | null
          secondary_color: string | null
          subdomain: string
        }
        Insert: {
          contact_email: string
          created_at?: string | null
          custom_domain?: string | null
          id?: string
          logo_url?: string | null
          name: string
          primary_color?: string | null
          secondary_color?: string | null
          subdomain: string
        }
        Update: {
          contact_email?: string
          created_at?: string | null
          custom_domain?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          secondary_color?: string | null
          subdomain?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          client_id: string
          created_at: string | null
          encrypted_key: string
          id: string
          is_valid: boolean | null
          last_tested: string | null
          service_name: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          encrypted_key: string
          id?: string
          is_valid?: boolean | null
          last_tested?: string | null
          service_name: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          encrypted_key?: string
          id?: string
          is_valid?: boolean | null
          last_tested?: string | null
          service_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          agency_id: string
          business_name: string
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          password_hash: string
        }
        Insert: {
          agency_id: string
          business_name: string
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          password_hash: string
        }
        Update: {
          agency_id?: string
          business_name?: string
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          password_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      content_items: {
        Row: {
          character_count: number | null
          client_id: string
          content: string
          created_at: string | null
          cta_type: string | null
          emoji_count: number | null
          estimated_api_cost: number | null
          featured_image_url: string | null
          focus_keyword: string | null
          generation_params: Json | null
          id: string
          meta_description: string | null
          performance_clicks: number | null
          performance_views: number | null
          published_at: string | null
          scheduled_for: string | null
          status: string
          suggested_image_query: string | null
          title: string | null
          type: string
          updated_at: string | null
          wordpress_post_id: number | null
          wordpress_site_id: string | null
        }
        Insert: {
          character_count?: number | null
          client_id: string
          content: string
          created_at?: string | null
          cta_type?: string | null
          emoji_count?: number | null
          estimated_api_cost?: number | null
          featured_image_url?: string | null
          focus_keyword?: string | null
          generation_params?: Json | null
          id?: string
          meta_description?: string | null
          performance_clicks?: number | null
          performance_views?: number | null
          published_at?: string | null
          scheduled_for?: string | null
          status?: string
          suggested_image_query?: string | null
          title?: string | null
          type: string
          updated_at?: string | null
          wordpress_post_id?: number | null
          wordpress_site_id?: string | null
        }
        Update: {
          character_count?: number | null
          client_id?: string
          content?: string
          created_at?: string | null
          cta_type?: string | null
          emoji_count?: number | null
          estimated_api_cost?: number | null
          featured_image_url?: string | null
          focus_keyword?: string | null
          generation_params?: Json | null
          id?: string
          meta_description?: string | null
          performance_clicks?: number | null
          performance_views?: number | null
          published_at?: string | null
          scheduled_for?: string | null
          status?: string
          suggested_image_query?: string | null
          title?: string | null
          type?: string
          updated_at?: string | null
          wordpress_post_id?: number | null
          wordpress_site_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_items_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_items_wordpress_site_id_fkey"
            columns: ["wordpress_site_id"]
            isOneToOne: false
            referencedRelation: "wordpress_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_templates: {
        Row: {
          client_id: string
          created_at: string | null
          custom_instructions: string | null
          default_tone: string | null
          id: string
          sample_content: string | null
          target_audience: string | null
          template_name: string
          template_type: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          custom_instructions?: string | null
          default_tone?: string | null
          id?: string
          sample_content?: string | null
          target_audience?: string | null
          template_name: string
          template_type: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          custom_instructions?: string | null
          default_tone?: string | null
          id?: string
          sample_content?: string | null
          target_audience?: string | null
          template_name?: string
          template_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "generation_templates_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      wordpress_sites: {
        Row: {
          app_password: string
          client_id: string
          created_at: string | null
          id: string
          is_connected: boolean | null
          last_sync: string | null
          site_info: Json | null
          site_name: string
          site_url: string
          username: string
        }
        Insert: {
          app_password: string
          client_id: string
          created_at?: string | null
          id?: string
          is_connected?: boolean | null
          last_sync?: string | null
          site_info?: Json | null
          site_name: string
          site_url: string
          username: string
        }
        Update: {
          app_password?: string
          client_id?: string
          created_at?: string | null
          id?: string
          is_connected?: boolean | null
          last_sync?: string | null
          site_info?: Json | null
          site_name?: string
          site_url?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "wordpress_sites_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
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
