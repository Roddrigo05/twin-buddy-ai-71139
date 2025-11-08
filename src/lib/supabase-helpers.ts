// Temporary helper to handle empty Database types
import { supabase } from "@/integrations/supabase/client";

type AnyTable = any;

export const supabaseQuery = {
  from: (table: string) => supabase.from(table as AnyTable),
  channel: (name: string) => supabase.channel(name),
  auth: supabase.auth,
  removeChannel: (channel: any) => supabase.removeChannel(channel),
};
