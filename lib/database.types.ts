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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}

export type Tenant = Database["public"]["Tables"]["tenants"]["Row"];
export type TenantUser = Database["public"]["Tables"]["tenant_users"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
export type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];
export type StockMovement = Database["public"]["Tables"]["stock_movements"]["Row"];
