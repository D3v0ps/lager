export type MovementType = "in" | "out" | "adjust";
export type TenantUserRole = "admin" | "owner" | "member";

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          slug: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      tenant_users: {
        Row: {
          tenant_id: string;
          user_id: string;
          role: TenantUserRole;
          created_at: string;
        };
        Insert: {
          tenant_id: string;
          user_id: string;
          role?: TenantUserRole;
          created_at?: string;
        };
        Update: {
          tenant_id?: string;
          user_id?: string;
          role?: TenantUserRole;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tenant_users_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          id: string;
          tenant_id: string;
          sku: string;
          name: string;
          category: string | null;
          unit_price: number;
          quantity: number;
          reorder_point: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          sku: string;
          name: string;
          category?: string | null;
          unit_price?: number;
          quantity?: number;
          reorder_point?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          sku?: string;
          name?: string;
          category?: string | null;
          unit_price?: number;
          quantity?: number;
          reorder_point?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      stock_movements: {
        Row: {
          id: string;
          tenant_id: string;
          product_id: string;
          type: MovementType;
          quantity: number;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string;
          product_id: string;
          type: MovementType;
          quantity: number;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          product_id?: string;
          type?: MovementType;
          quantity?: number;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_movements_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      suppliers: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          contact_name: string | null;
          email: string | null;
          phone: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          contact_name?: string | null;
          email?: string | null;
          phone?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
          contact_name?: string | null;
          email?: string | null;
          phone?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "suppliers_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      purchase_orders: {
        Row: {
          id: string;
          tenant_id: string;
          supplier_id: string | null;
          status: "draft" | "sent" | "received" | "cancelled";
          reference: string | null;
          notes: string | null;
          created_at: string;
          received_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          supplier_id?: string | null;
          status?: "draft" | "sent" | "received" | "cancelled";
          reference?: string | null;
          notes?: string | null;
          created_at?: string;
          received_at?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          supplier_id?: string | null;
          status?: "draft" | "sent" | "received" | "cancelled";
          reference?: string | null;
          notes?: string | null;
          created_at?: string;
          received_at?: string | null;
        };
        Relationships: [];
      };
      purchase_order_items: {
        Row: {
          id: string;
          purchase_order_id: string;
          product_id: string;
          quantity: number;
          unit_cost: number;
        };
        Insert: {
          id?: string;
          purchase_order_id: string;
          product_id: string;
          quantity: number;
          unit_cost?: number;
        };
        Update: {
          id?: string;
          purchase_order_id?: string;
          product_id?: string;
          quantity?: number;
          unit_cost?: number;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          org_number: string | null;
          billing_address: string | null;
          shipping_address: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          org_number?: string | null;
          billing_address?: string | null;
          shipping_address?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          org_number?: string | null;
          billing_address?: string | null;
          shipping_address?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sales_orders: {
        Row: {
          id: string;
          tenant_id: string;
          customer_id: string | null;
          reference: string | null;
          status: "draft" | "confirmed" | "picking" | "shipped" | "cancelled";
          shipping_address: string | null;
          notes: string | null;
          created_at: string;
          shipped_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          customer_id?: string | null;
          reference?: string | null;
          status?: "draft" | "confirmed" | "picking" | "shipped" | "cancelled";
          shipping_address?: string | null;
          notes?: string | null;
          created_at?: string;
          shipped_at?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          customer_id?: string | null;
          reference?: string | null;
          status?: "draft" | "confirmed" | "picking" | "shipped" | "cancelled";
          shipping_address?: string | null;
          notes?: string | null;
          created_at?: string;
          shipped_at?: string | null;
        };
        Relationships: [];
      };
      sales_order_items: {
        Row: {
          id: string;
          sales_order_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
        };
        Insert: {
          id?: string;
          sales_order_id: string;
          product_id: string;
          quantity: number;
          unit_price?: number;
        };
        Update: {
          id?: string;
          sales_order_id?: string;
          product_id?: string;
          quantity?: number;
          unit_price?: number;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      admin_list_users: {
        Args: Record<string, never>;
        Returns: { id: string; email: string; created_at: string }[];
      };
      tenant_member_count: {
        Args: { target_tenant: string };
        Returns: number;
      };
    };
  };
}

export type Tenant = Database["public"]["Tables"]["tenants"]["Row"];
export type TenantUser = Database["public"]["Tables"]["tenant_users"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
export type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];
export type StockMovement = Database["public"]["Tables"]["stock_movements"]["Row"];
