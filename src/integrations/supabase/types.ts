export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      collections: {
        Row: {
          created_at: string;
          emoji: string | null;
          id: string;
          is_published: boolean;
          name: string;
          slug: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          emoji?: string | null;
          id?: string;
          is_published?: boolean;
          name: string;
          slug: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          emoji?: string | null;
          id?: string;
          is_published?: boolean;
          name?: string;
          slug?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      discount_codes: {
        Row: {
          code: string;
          created_at: string;
          expires_at: string | null;
          id: string;
          is_active: boolean;
          max_uses: number | null;
          min_order: number;
          type: string;
          updated_at: string;
          uses: number;
          value: number;
        };
        Insert: {
          code: string;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean;
          max_uses?: number | null;
          min_order?: number;
          type: string;
          updated_at?: string;
          uses?: number;
          value: number;
        };
        Update: {
          code?: string;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean;
          max_uses?: number | null;
          min_order?: number;
          type?: string;
          updated_at?: string;
          uses?: number;
          value?: number;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          image: string | null;
          line_total: number;
          name: string;
          order_id: string;
          price: number;
          product_id: string;
          qty: number;
          size: string;
        };
        Insert: {
          id?: string;
          image?: string | null;
          line_total: number;
          name: string;
          order_id: string;
          price: number;
          product_id: string;
          qty: number;
          size: string;
        };
        Update: {
          id?: string;
          image?: string | null;
          line_total?: number;
          name?: string;
          order_id?: string;
          price?: number;
          product_id?: string;
          qty?: number;
          size?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          address: Json;
          courier: string | null;
          created_at: string;
          discount: number;
          discount_code: string | null;
          id: string;
          notes: string | null;
          payment_method: string;
          payment_status: string;
          shipping: number;
          status: string;
          subtotal: number;
          total: number;
          tracking_number: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          address: Json;
          courier?: string | null;
          created_at?: string;
          discount?: number;
          discount_code?: string | null;
          id?: string;
          notes?: string | null;
          payment_method: string;
          payment_status?: string;
          shipping?: number;
          status?: string;
          subtotal: number;
          total: number;
          tracking_number?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          address?: Json;
          courier?: string | null;
          created_at?: string;
          discount?: number;
          discount_code?: string | null;
          id?: string;
          notes?: string | null;
          payment_method?: string;
          payment_status?: string;
          shipping?: number;
          status?: string;
          subtotal?: number;
          total?: number;
          tracking_number?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      product_stock: {
        Row: {
          id: string;
          product_id: string;
          qty: number;
          size: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          qty?: number;
          size: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          qty?: number;
          size?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_stock_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          badge: string | null;
          category: string;
          collection_id: string | null;
          created_at: string;
          description: string | null;
          gender: string;
          id: string;
          image_url: string;
          is_published: boolean;
          mrp: number;
          name: string;
          price: number;
          sizes: string[];
          sku: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          badge?: string | null;
          category?: string;
          collection_id?: string | null;
          created_at?: string;
          description?: string | null;
          gender?: string;
          id?: string;
          image_url?: string;
          is_published?: boolean;
          mrp?: number;
          name: string;
          price?: number;
          sizes?: string[];
          sku: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          badge?: string | null;
          category?: string;
          collection_id?: string | null;
          created_at?: string;
          description?: string | null;
          gender?: string;
          id?: string;
          image_url?: string;
          is_published?: boolean;
          mrp?: number;
          name?: string;
          price?: number;
          sizes?: string[];
          sku?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_collection_id_fkey";
            columns: ["collection_id"];
            isOneToOne: false;
            referencedRelation: "collections";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string | null;
          id: string;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      decrement_stock: { Args: { items: Json }; Returns: undefined };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin" | "customer";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "customer"],
    },
  },
} as const;
