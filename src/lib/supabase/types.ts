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
          cover_type: string
          cover_image: string
          cover_video: string
          cover_mobile_image: string
          cover_overlay: string
          cover_cta_text: string
          cover_subtitle: string
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
          cover_type?: string
          cover_image?: string
          cover_video?: string
          cover_mobile_image?: string
          cover_overlay?: string
          cover_cta_text?: string
          cover_subtitle?: string
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
          cover_type?: string
          cover_image?: string
          cover_video?: string
          cover_mobile_image?: string
          cover_overlay?: string
          cover_cta_text?: string
          cover_subtitle?: string
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
      delivery_off_days: {
        Row: {
          id: number
          off_date: string
          note: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          off_date: string
          note?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          off_date?: string
          note?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      visitor_sessions: {
        Row: {
          id: string
          visitor_id: string
          ip_address: string | null
          ip_hash: string | null
          user_agent: string | null
          device_type: string | null
          device_model: string | null
          browser: string | null
          browser_version: string | null
          os: string | null
          os_version: string | null
          screen_width: number | null
          screen_height: number | null
          language: string | null
          country: string | null
          city: string | null
          region: string | null
          referrer: string | null
          referrer_domain: string | null
          landing_page: string | null
          exit_page: string | null
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          utm_term: string | null
          utm_content: string | null
          page_views: number
          events_count: number
          duration_seconds: number
          is_bounce: boolean
          customer_id: string | null
          converted: boolean
          conversion_value: number
          started_at: string
          last_activity_at: string
          ended_at: string | null
        }
        Insert: {
          id?: string
          visitor_id: string
          ip_address?: string | null
          ip_hash?: string | null
          user_agent?: string | null
          device_type?: string | null
          device_model?: string | null
          browser?: string | null
          browser_version?: string | null
          os?: string | null
          os_version?: string | null
          screen_width?: number | null
          screen_height?: number | null
          language?: string | null
          country?: string | null
          city?: string | null
          region?: string | null
          referrer?: string | null
          referrer_domain?: string | null
          landing_page?: string | null
          exit_page?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          utm_term?: string | null
          utm_content?: string | null
          page_views?: number
          events_count?: number
          duration_seconds?: number
          is_bounce?: boolean
          customer_id?: string | null
          converted?: boolean
          conversion_value?: number
          started_at?: string
          last_activity_at?: string
          ended_at?: string | null
        }
        Update: {
          id?: string
          visitor_id?: string
          ip_address?: string | null
          ip_hash?: string | null
          user_agent?: string | null
          device_type?: string | null
          device_model?: string | null
          browser?: string | null
          browser_version?: string | null
          os?: string | null
          os_version?: string | null
          screen_width?: number | null
          screen_height?: number | null
          language?: string | null
          country?: string | null
          city?: string | null
          region?: string | null
          referrer?: string | null
          referrer_domain?: string | null
          landing_page?: string | null
          exit_page?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          utm_term?: string | null
          utm_content?: string | null
          page_views?: number
          events_count?: number
          duration_seconds?: number
          is_bounce?: boolean
          customer_id?: string | null
          converted?: boolean
          conversion_value?: number
          started_at?: string
          last_activity_at?: string
          ended_at?: string | null
        }
      }
      page_views: {
        Row: {
          id: string
          session_id: string
          visitor_id: string
          page_url: string
          page_path: string
          page_title: string | null
          page_type: string | null
          product_id: number | null
          product_name: string | null
          category_slug: string | null
          category_name: string | null
          referrer_path: string | null
          load_time_ms: number | null
          time_on_page_seconds: number
          scroll_depth_percent: number
          viewed_at: string
          left_at: string | null
        }
        Insert: {
          id?: string
          session_id: string
          visitor_id: string
          page_url: string
          page_path: string
          page_title?: string | null
          page_type?: string | null
          product_id?: number | null
          product_name?: string | null
          category_slug?: string | null
          category_name?: string | null
          referrer_path?: string | null
          load_time_ms?: number | null
          time_on_page_seconds?: number
          scroll_depth_percent?: number
          viewed_at?: string
          left_at?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          visitor_id?: string
          page_url?: string
          page_path?: string
          page_title?: string | null
          page_type?: string | null
          product_id?: number | null
          product_name?: string | null
          category_slug?: string | null
          category_name?: string | null
          referrer_path?: string | null
          load_time_ms?: number | null
          time_on_page_seconds?: number
          scroll_depth_percent?: number
          viewed_at?: string
          left_at?: string | null
        }
      }
      visitor_events: {
        Row: {
          id: string
          session_id: string
          page_view_id: string | null
          visitor_id: string
          event_name: string
          event_category: string | null
          event_label: string | null
          event_value: number | null
          properties: Json
          page_url: string | null
          page_path: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          page_view_id?: string | null
          visitor_id: string
          event_name: string
          event_category?: string | null
          event_label?: string | null
          event_value?: number | null
          properties?: Json
          page_url?: string | null
          page_path?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          page_view_id?: string | null
          visitor_id?: string
          event_name?: string
          event_category?: string | null
          event_label?: string | null
          event_value?: number | null
          properties?: Json
          page_url?: string | null
          page_path?: string | null
          created_at?: string
        }
      }
      analytics_daily_summary: {
        Row: {
          id: number
          date: string
          total_sessions: number
          unique_visitors: number
          total_page_views: number
          avg_session_duration_seconds: number
          avg_pages_per_session: number
          bounce_rate: number
          total_conversions: number
          conversion_rate: number
          total_revenue: number
          desktop_sessions: number
          mobile_sessions: number
          tablet_sessions: number
          direct_sessions: number
          organic_sessions: number
          social_sessions: number
          paid_sessions: number
          referral_sessions: number
          top_pages: Json
          top_products: Json
          top_categories: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          date: string
          total_sessions?: number
          unique_visitors?: number
          total_page_views?: number
          avg_session_duration_seconds?: number
          avg_pages_per_session?: number
          bounce_rate?: number
          total_conversions?: number
          conversion_rate?: number
          total_revenue?: number
          desktop_sessions?: number
          mobile_sessions?: number
          tablet_sessions?: number
          direct_sessions?: number
          organic_sessions?: number
          social_sessions?: number
          paid_sessions?: number
          referral_sessions?: number
          top_pages?: Json
          top_products?: Json
          top_categories?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          date?: string
          total_sessions?: number
          unique_visitors?: number
          total_page_views?: number
          avg_session_duration_seconds?: number
          avg_pages_per_session?: number
          bounce_rate?: number
          total_conversions?: number
          conversion_rate?: number
          total_revenue?: number
          desktop_sessions?: number
          mobile_sessions?: number
          tablet_sessions?: number
          direct_sessions?: number
          organic_sessions?: number
          social_sessions?: number
          paid_sessions?: number
          referral_sessions?: number
          top_pages?: Json
          top_products?: Json
          top_categories?: Json
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
