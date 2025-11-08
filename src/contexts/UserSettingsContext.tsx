import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabaseQuery } from "@/lib/supabase-helpers";
import { useTheme } from "next-themes";
import { t, Language, TranslationKey } from "@/lib/i18n";
import { toast } from "sonner";

interface UserSettings {
  theme: "light" | "dark";
  language: "pt" | "en";
  notifications_enabled: boolean;
  about_me: string;
  ai_personality: string;
  ai_response_detail: string;
  typing_speed: string;
  daily_summary_enabled: boolean;
}

interface UserProfile {
  name: string;
  email: string;
}

interface UserSettingsContextType {
  settings: UserSettings | null;
  profile: UserProfile | null;
  loading: boolean;
  updateSettings: (partial: Partial<UserSettings>) => Promise<void>;
  updateProfile: (partial: Partial<UserProfile>) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);

const defaultSettings: UserSettings = {
  theme: "light",
  language: "pt",
  notifications_enabled: true,
  about_me: "",
  ai_personality: "amigável",
  ai_response_detail: "moderado",
  typing_speed: "normal",
  daily_summary_enabled: true,
};

export function UserSettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { setTheme } = useTheme();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSettings = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const [settingsData, profileData] = await Promise.all([
        supabaseQuery.from("user_settings").select("*").eq("user_id", user.id).maybeSingle(),
        supabaseQuery.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      ]);

      const settingsResult = settingsData as any;
      const profileResult = profileData as any;

      if (settingsResult.data) {
        const loadedSettings = {
          theme: settingsResult.data.theme || defaultSettings.theme,
          language: settingsResult.data.language || defaultSettings.language,
          notifications_enabled: settingsResult.data.notifications_enabled ?? defaultSettings.notifications_enabled,
          about_me: settingsResult.data.about_me || defaultSettings.about_me,
          ai_personality: settingsResult.data.ai_personality || defaultSettings.ai_personality,
          ai_response_detail: settingsResult.data.ai_response_detail || defaultSettings.ai_response_detail,
          typing_speed: settingsResult.data.typing_speed || defaultSettings.typing_speed,
          daily_summary_enabled: settingsResult.data.daily_summary_enabled ?? defaultSettings.daily_summary_enabled,
        };
        setSettings(loadedSettings);
        setTheme(loadedSettings.theme);
      } else {
        setSettings(defaultSettings);
      }

      if (profileResult.data) {
        setProfile({
          name: profileResult.data.name || "",
          email: profileResult.data.email || "",
        });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const channel = supabaseQuery
      .channel("user_settings_changes")
      .on(
        "postgres_changes" as any,
        {
          event: "UPDATE",
          schema: "public",
          table: "user_settings",
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          const newSettings = payload.new;
          setSettings(newSettings as UserSettings);
          if (newSettings.theme) {
            setTheme(newSettings.theme);
          }
        }
      )
      .subscribe();

    return () => {
      supabaseQuery.removeChannel(channel);
    };
  }, [user, setTheme]);

  const updateSettings = async (partial: Partial<UserSettings>) => {
    if (!user || !settings) {
      toast.error("Utilizador não autenticado");
      return;
    }

    try {
      const merged = { ...settings, ...partial, user_id: user.id };

      const { error } = await supabaseQuery
        .from("user_settings")
        .upsert(merged, { onConflict: "user_id" });

      if (error) throw error;

      setSettings((prev) => ({ ...prev!, ...partial }));

      if (partial.theme) {
        setTheme(partial.theme);
      }
    } catch (error: any) {
      console.error("Error updating settings:", error);
      throw error;
    }
  };

  const updateProfile = async (partial: Partial<UserProfile>) => {
    if (!user) {
      toast.error("Utilizador não autenticado");
      return;
    }

    try {
      const { data: existingProfile } = await supabaseQuery
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (!existingProfile) {
        const { error } = await supabaseQuery.from("profiles").insert({
          id: user.id,
          email: user.email || "",
          ...partial,
        });
        if (error) throw error;
      } else {
        const { error } = await supabaseQuery
          .from("profiles")
          .update(partial)
          .eq("id", user.id);
        if (error) throw error;
      }

      setProfile((prev) => ({ ...prev!, ...partial }));
    } catch (error: any) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };

  return (
    <UserSettingsContext.Provider
      value={{
        settings,
        profile,
        loading,
        updateSettings,
        updateProfile,
        refreshSettings,
      }}
    >
      {children}
    </UserSettingsContext.Provider>
  );
}

export function useUserSettings() {
  const context = useContext(UserSettingsContext);
  if (!context) {
    throw new Error("useUserSettings must be used within UserSettingsProvider");
  }
  return context;
}

export function useTranslation() {
  const { settings } = useUserSettings();
  const lang = (settings?.language || "pt") as Language;

  return {
    t: (key: TranslationKey) => t(lang, key),
    lang,
  };
}
