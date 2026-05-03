export type MovementType = "in" | "out" | "adjust";

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
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
        Relationships: [];
      };
      stock_movements: {
        Row: {
          id: string;
          product_id: string;
          type: MovementType;
          quantity: number;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          type: MovementType;
          quantity: number;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
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
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}

export type Product = Database["public"]["Tables"]["products"]["Row"];
export type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
export type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];
export type StockMovement = Database["public"]["Tables"]["stock_movements"]["Row"];
