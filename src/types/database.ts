export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      municipalities: {
        Row: {
          id: string;
          name: string;
          state: string;
          ibge_code: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          state: string;
          ibge_code?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          state?: string;
          ibge_code?: string | null;
          status?: string;
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
          avatar_url: string | null;
          municipality_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          municipality_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
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
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      occurrence_media: {
        Row: {
          id: string;
          occurrence_id: string;
          media_type: string;
          mime_type: string | null;
          storage_path: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          occurrence_id: string;
          media_type: string;
          mime_type?: string | null;
          storage_path: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          occurrence_id?: string;
          media_type?: string;
          mime_type?: string | null;
          storage_path?: string;
          created_at?: string;
        };
        Relationships: [];
      };

      occurrence_confirmations: {
        Row: {
          id: string;
          occurrence_id: string;
          citizen_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          occurrence_id: string;
          citizen_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          occurrence_id?: string;
          citizen_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};
