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
      custom_boxes: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string | null
          vessel_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id?: string | null
          vessel_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string | null
          vessel_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_boxes_vessel_id_fkey"
            columns: ["vessel_id"]
            isOneToOne: false
            referencedRelation: "vessels"
            referencedColumns: ["id"]
          },
        ]
      }
      deck_orders: {
        Row: {
          colour: string
          id: number
          link: string
          product_name: string
          quantity: string
          size: string
          vessel_id: string
        }
        Insert: {
          colour?: string
          id?: number
          link?: string
          product_name: string
          quantity?: string
          size?: string
          vessel_id?: string
        }
        Update: {
          colour?: string
          id?: number
          link?: string
          product_name?: string
          quantity?: string
          size?: string
          vessel_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deck_orders_vessel_id_fkey"
            columns: ["vessel_id"]
            isOneToOne: false
            referencedRelation: "vessels"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          id: string
          username: string
        }
        Insert: {
          id: string
          username: string
        }
        Update: {
          id?: string
          username?: string
        }
        Relationships: []
      }
      stock_items: {
        Row: {
          box: string
          created_at: string
          id: string
          name: string
          quantity: number
          sort_order: number
          updated_at: string
          user_id: string | null
          vessel_id: string | null
        }
        Insert: {
          box: string
          created_at?: string
          id?: string
          name: string
          quantity?: number
          sort_order?: number
          updated_at?: string
          user_id?: string | null
          vessel_id?: string | null
        }
        Update: {
          box?: string
          created_at?: string
          id?: string
          name?: string
          quantity?: number
          sort_order?: number
          updated_at?: string
          user_id?: string | null
          vessel_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_items_vessel_id_fkey"
            columns: ["vessel_id"]
            isOneToOne: false
            referencedRelation: "vessels"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignees: string[]
          completed: boolean
          completed_at: string | null
          completed_by: string | null
          completed_by_username: string | null
          created_at: string
          created_by: string | null
          created_by_username: string | null
          id: number
          notes: string | null
          starred: boolean
          text: string
          vessel_id: string
        }
        Insert: {
          assignees?: string[]
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          completed_by_username?: string | null
          created_at?: string
          created_by?: string | null
          created_by_username?: string | null
          id?: number
          notes?: string | null
          starred?: boolean
          text: string
          vessel_id?: string
        }
        Update: {
          assignees?: string[]
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          completed_by_username?: string | null
          created_at?: string
          created_by?: string | null
          created_by_username?: string | null
          id?: number
          notes?: string | null
          starred?: boolean
          text?: string
          vessel_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_vessel_id_fkey"
            columns: ["vessel_id"]
            isOneToOne: false
            referencedRelation: "vessels"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_history: {
        Row: {
          actor_username: string | null
          box: string
          id: string
          item_name: string
          quantity: number
          recorded_at: string
          user_id: string | null
          vessel_id: string | null
        }
        Insert: {
          actor_username?: string | null
          box: string
          id?: string
          item_name: string
          quantity: number
          recorded_at?: string
          user_id?: string | null
          vessel_id?: string | null
        }
        Update: {
          actor_username?: string | null
          box?: string
          id?: string
          item_name?: string
          quantity?: number
          recorded_at?: string
          user_id?: string | null
          vessel_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_history_vessel_id_fkey"
            columns: ["vessel_id"]
            isOneToOne: false
            referencedRelation: "vessels"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          role: string
          user_id: string
          vessel_id: string
        }
        Insert: {
          role?: string
          user_id: string
          vessel_id: string
        }
        Update: {
          role?: string
          user_id?: string
          vessel_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_vessel_id_fkey"
            columns: ["vessel_id"]
            isOneToOne: false
            referencedRelation: "vessels"
            referencedColumns: ["id"]
          },
        ]
      }
      vessel_credentials: {
        Row: {
          password_hash: string
          vessel_id: string
        }
        Insert: {
          password_hash: string
          vessel_id: string
        }
        Update: {
          password_hash?: string
          vessel_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vessel_credentials_vessel_id_fkey"
            columns: ["vessel_id"]
            isOneToOne: true
            referencedRelation: "vessels"
            referencedColumns: ["id"]
          },
        ]
      }
      vessel_members: {
        Row: {
          created_at: string
          user_id: string
          vessel_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
          vessel_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
          vessel_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vessel_members_vessel_id_fkey"
            columns: ["vessel_id"]
            isOneToOne: false
            referencedRelation: "vessels"
            referencedColumns: ["id"]
          },
        ]
      }
      vessels: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adjust_stock: {
        Args: { absolute_quantity?: number; delta?: number; item_id: string }
        Returns: number
      }
      current_vessel: { Args: never; Returns: string }
      setup_vessel: {
        Args: {
          crew_username: string
          owner_id: string
          vessel_name: string
          vessel_password: string
        }
        Returns: string
      }
      verify_vessel_password: {
        Args: { candidate: string; vid: string }
        Returns: boolean
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
