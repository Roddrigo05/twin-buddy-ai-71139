import { DashboardLayout } from "@/components/DashboardLayout";
import { ProfileSection } from "@/components/settings/ProfileSection";
import { AIPersonalitySection } from "@/components/settings/AIPersonalitySection";
import { SecuritySection } from "@/components/settings/SecuritySection";
import { PreferencesSection } from "@/components/settings/PreferencesSection";
import { EmailNotificationsSection } from "@/components/settings/EmailNotificationsSection";
import { useTranslation } from "@/contexts/UserSettingsContext";

export default function Settings() {
  const { t } = useTranslation();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("settings")}</h1>
          <p className="text-muted-foreground">{t("managePreferences")}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <ProfileSection />
          <AIPersonalitySection />
          <SecuritySection />
          <PreferencesSection />
        </div>

        <div className="mt-6">
          <EmailNotificationsSection />
        </div>
      </div>
    </DashboardLayout>
  );
}
