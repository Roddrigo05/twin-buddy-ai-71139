import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserSettings, useTranslation } from "@/contexts/UserSettingsContext";
import { toast } from "sonner";

export function PreferencesSection() {
  const { settings, updateSettings } = useUserSettings();
  const { t } = useTranslation();

  const handleThemeChange = async (theme: string) => {
    try {
      await updateSettings({ theme: theme as "light" | "dark" });
      toast.success(t("themeApplied"));
    } catch (error: any) {
      toast.error(`${t("error")}: ${error.message}`);
    }
  };

  const handleLanguageChange = async (language: string) => {
    try {
      await updateSettings({ language: language as "pt" | "en" });
      toast.success(t("languageUpdated"));
    } catch (error: any) {
      toast.error(`${t("error")}: ${error.message}`);
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("preferences")}</CardTitle>
        <CardDescription>{t("personalizeExperience")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="theme">{t("theme")}</Label>
          <Select value={settings?.theme || "light"} onValueChange={handleThemeChange}>
            <SelectTrigger id="theme">
              <SelectValue placeholder={t("selectTheme")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">{t("themeLight")}</SelectItem>
              <SelectItem value="dark">{t("themeDark")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="language">{t("language")}</Label>
          <Select value={settings?.language || "pt"} onValueChange={handleLanguageChange}>
            <SelectTrigger id="language">
              <SelectValue placeholder={t("selectLanguage")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pt">{t("languagePortuguese")}</SelectItem>
              <SelectItem value="en">{t("languageEnglish")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
