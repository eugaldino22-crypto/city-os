export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      municipalities: {
        Row: {
          id: string;
          name: string;
          state: string;
          ibge_code: string | null;
          status: "active" | "inactive";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          state: string;
          ibge_code?: string | null;
          status?: "active" | "inactive";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          state?: string;
          ibge_code?: string | null;
          status?: "active" | "inactive";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      citizen_profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          avatar_path: string | null;
          municipality_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_path?: string | null;
          municipality_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_path?: string | null;
          municipality_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      protocols: {
        Row: {
          id: string;
          protocol_code: string;
          citizen_id: string;
          municipality_id: string;
          category: string;
          subject: string;
          description: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          protocol_code: string;
          citizen_id: string;
          municipality_id: string;
          category: string;
          subject: string;
          description?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          protocol_code?: string;
          citizen_id?: string;
          municipality_id?: string;
          category?: string;
          subject?: string;
          description?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      occurrences: {
        Row: {
          id: string;
          citizen_id: string;
          municipality_id: string;
          protocol_id: string | null;
          type_id: string;
          description: string;
          latitude: number | null;
          longitude: number | null;
          address: string | null;
          neighborhood: string | null;
          locality: string | null;
          priority: string;
          agency: string | null;
          status: string;
          confirmations_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          citizen_id: string;
          municipality_id: string;
          protocol_id?: string | null;
          type_id: string;
          description: string;
          latitude?: number | null;
          longitude?: number | null;
          address?: string | null;
          neighborhood?: string | null;
          locality?: string | null;
          priority: string;
          agency?: string | null;
          status?: string;
          confirmations_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          citizen_id?: string;
          municipality_id?: string;
          protocol_id?: string | null;
          type_id?: string;
          description?: string;
          latitude?: number | null;
          longitude?: number | null;
          address?: string | null;
          neighborhood?: string | null;
          locality?: string | null;
          priority?: string;
          agency?: string | null;
          status?: string;
          confirmations_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      occurrence_media: {
        Row: {
          id: string;
          occurrence_id: string;
          media_type: "image" | "video";
          mime_type: string | null;
          storage_path: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          occurrence_id: string;
          media_type: "image" | "video";
          mime_type?: string | null;
          storage_path: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          occurrence_id?: string;
          media_type?: "image" | "video";
          mime_type?: string | null;
          storage_path?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      occurrence_confirmations: {
        Row: { id: string; occurrence_id: string; citizen_id: string; created_at: string };
        Insert: { id?: string; occurrence_id: string; citizen_id: string; created_at?: string };
        Update: { id?: string; occurrence_id?: string; citizen_id?: string; created_at?: string };
        Relationships: [];
      };
      city_feed: {
        Row: {
          id: string;
          municipality_id: string;
          kind: string;
          title: string;
          description: string | null;
          image_path: string | null;
          link_url: string | null;
          published_at: string | null;
          starts_at: string | null;
          ends_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          municipality_id: string;
          kind: string;
          title: string;
          description?: string | null;
          image_path?: string | null;
          link_url?: string | null;
          published_at?: string | null;
          starts_at?: string | null;
          ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          municipality_id?: string;
          kind?: string;
          title?: string;
          description?: string | null;
          image_path?: string | null;
          link_url?: string | null;
          published_at?: string | null;
          starts_at?: string | null;
          ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      city_events: {
        Row: {
          id: string;
          municipality_id: string;
          title: string;
          description: string | null;
          location: string | null;
          starts_at: string;
          ends_at: string | null;
          image_path: string | null;
          link_url: string | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          municipality_id: string;
          title: string;
          description?: string | null;
          location?: string | null;
          starts_at: string;
          ends_at?: string | null;
          image_path?: string | null;
          link_url?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          municipality_id?: string;
          title?: string;
          description?: string | null;
          location?: string | null;
          starts_at?: string;
          ends_at?: string | null;
          image_path?: string | null;
          link_url?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_occurrence: {
        Args: {
          p_type_id: string;
          p_description: string;
          p_latitude?: number | null;
          p_longitude?: number | null;
          p_address?: string | null;
          p_neighborhood?: string | null;
          p_locality?: string | null;
          p_priority?: string;
          p_agency?: string | null;
        };
        Returns: { occurrence_id: string; protocol_code: string; created_at: string }[];
      };
      confirm_occurrence: { Args: { p_occurrence_id: string }; Returns: number };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
