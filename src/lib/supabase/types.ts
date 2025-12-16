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
      customer_email_otps: {
        Row: {
          id: string
          email: string
          purpose: string
          code_hash: string
          attempts: number
          last_sent_at: string | null
          created_at: string | null
          expires_at: string
          consumed_at: string | null
        }
        Insert: {
          id?: string
          email: string
          purpose: string
          code_hash: string
          attempts?: number
          last_sent_at?: string | null
          created_at?: string | null
          expires_at: string
          consumed_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          purpose?: string
          code_hash?: string
          attempts?: number
          last_sent_at?: string | null
          created_at?: string | null
          expires_at?: string
          consumed_at?: string | null
        }
      }
      products: {
        Row: {
          id: number
          name: string
          slug: string
          description: string
          long_description: string
          price: number
          old_price: number
          discount: number
          image: string
          hover_image: string
          gallery: string[]
          rating: number
          review_count: number
          category: string
          category_name: string
          in_stock: boolean
          stock_count: number
          sku: string
          tags: string[]
          features: string[]
          delivery_info: string
          care_tips: string
          occasion_tags: string[]
          color_tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          slug: string
          description: string
          long_description?: string
          price: number
          old_price?: number
          discount?: number
          image: string
          hover_image?: string
          gallery?: string[]
          rating?: number
          review_count?: number
          category: string
          category_name: string
          in_stock?: boolean
          stock_count?: number
          sku: string
          tags?: string[]
          features?: string[]
          delivery_info?: string
          care_tips?: string
          occasion_tags?: string[]
          color_tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          slug?: string
          description?: string
          long_description?: string
          price?: number
          old_price?: number
          discount?: number
          image?: string
          hover_image?: string
          gallery?: string[]
          rating?: number
          review_count?: number
          category?: string
          category_name?: string
          in_stock?: boolean
          stock_count?: number
          sku?: string
          tags?: string[]
          features?: string[]
          delivery_info?: string
          care_tips?: string
          occasion_tags?: string[]
          color_tags?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: number
          name: string
          slug: string
          description: string
          image: string
          product_count: number
          order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          slug: string
          description?: string
          image?: string
          product_count?: number
          order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          slug?: string
          description?: string
          image?: string
          product_count?: number
          order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          email: string
          name: string
          phone: string
          password: string
          addresses: Json
          orders: string[]
          favorites: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          phone: string
          password: string
          addresses?: Json
          orders?: string[]
          favorites?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          phone?: string
          password?: string
          addresses?: Json
          orders?: string[]
          favorites?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          order_number: number
          customer_id: string | null
          customer_name: string
          customer_email: string
          customer_phone: string
          is_guest: boolean
          status: string
          products: Json
          subtotal: number
          discount: number
          delivery_fee: number
          total: number
          delivery: Json
          payment: Json
          message: Json | null
          notes: string
          tracking_url: string
          order_time_group: string | null
          timeline: Json
          created_at: string
          updated_at: string
          delivered_at: string | null
        }
        Insert: {
          id?: string
          order_number?: number
          customer_id?: string | null
          customer_name?: string
          customer_email?: string
          customer_phone?: string
          is_guest?: boolean
          status?: string
          products: Json
          subtotal: number
          discount?: number
          delivery_fee?: number
          total: number
          delivery: Json
          payment?: Json
          message?: Json | null
          notes?: string
          tracking_url?: string
          order_time_group?: string | null
          timeline?: Json
          created_at?: string
          updated_at?: string
          delivered_at?: string | null
        }
        Update: {
          id?: string
          order_number?: number
          customer_id?: string | null
          customer_name?: string
          customer_email?: string
          customer_phone?: string
          is_guest?: boolean
          status?: string
          products?: Json
          subtotal?: number
          discount?: number
          delivery_fee?: number
          total?: number
          delivery?: Json
          payment?: Json
          message?: Json | null
          notes?: string
          tracking_url?: string
          order_time_group?: string | null
          timeline?: Json
          created_at?: string
          updated_at?: string
          delivered_at?: string | null
        }
      }
      coupons: {
        Row: {
          id: string
          code: string
          type: string
          value: number
          min_order_amount: number
          max_discount_amount: number | null
          usage_limit: number
          used_count: number
          valid_from: string
          valid_until: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          type: string
          value: number
          min_order_amount?: number
          max_discount_amount?: number | null
          usage_limit?: number
          used_count?: number
          valid_from: string
          valid_until: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          type?: string
          value?: number
          min_order_amount?: number
          max_discount_amount?: number | null
          usage_limit?: number
          used_count?: number
          valid_from?: string
          valid_until?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
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
  }
}
