import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserSettings, useTranslation } from "@/contexts/UserSettingsContext";
import { toast } from "sonner";

const personalityExamples = {
  'formal': {
    emoji: '🎓',
    sample: 'Prezado utilizador, procedo à análise das suas solicitações de forma sistemática.',
    description: 'Tom técnico, sem emojis, linguagem precisa'
  },
  'amigável': {
    emoji: '😊',
    sample: 'Oi! Adoraria ajudar você com isso! Vamos lá? ✨',
    description: 'Tom casual, emojis ocasionais, linguagem simples'
  },
  'motivacional': {
    emoji: '🌟',
    sample: 'Você consegue! Cada passo é uma vitória! 💪🎉',
    description: 'Tom inspirador, muitos emojis positivos'
  },
  'calma': {
    emoji: '🌸',
    sample: 'Entendo como você está se sentindo. Vamos com calma... 💙',
    description: 'Tom sereno, validação emocional'
  },
  'criativa': {
    emoji: '🎨',
    sample: 'Que tal pensarmos nisso como uma tela em branco? 🚀💡',
    description: 'Tom imaginativo, metáforas, múltiplas perspectivas'
  }
};

export function AIPersonalitySection() {
  const { settings, updateSettings } = useUserSettings();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [localSettings, setLocalSettings] = useState({
    about_me: settings?.about_me || "",
    ai_personality: settings?.ai_personality || "amigável",
    ai_response_detail: settings?.ai_response_detail || "moderado",
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateSettings(localSettings);
      toast.success(t("personalityUpdated"));
    } catch (error: any) {
      toast.error(`${t("error")}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const currentExample = personalityExamples[localSettings.ai_personality as keyof typeof personalityExamples];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("aiPersonality")}</CardTitle>
        <CardDescription>{t("configureAIBehavior")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="about-me">{t("aboutMe")}</Label>
          <Textarea
            id="about-me"
            value={localSettings.about_me}
            onChange={(e) => setLocalSettings({ ...localSettings, about_me: e.target.value })}
            placeholder={t("aboutMePlaceholder")}
            className="min-h-[100px]"
          />
          <p className="text-xs text-muted-foreground">
            {t("aboutMeHelp")}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ai-personality">{t("personalityLabel")}</Label>
          <Select
            value={localSettings.ai_personality}
            onValueChange={(value) => setLocalSettings({ ...localSettings, ai_personality: value })}
          >
            <SelectTrigger id="ai-personality">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="formal">{t("personalityFormal")}</SelectItem>
              <SelectItem value="amigável">{t("personalityFriendly")}</SelectItem>
              <SelectItem value="motivacional">{t("personalityMotivational")}</SelectItem>
              <SelectItem value="calma">{t("personalityCalm")}</SelectItem>
              <SelectItem value="criativa">{t("personalityCreative")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ai-detail">{t("detailLevel")}</Label>
          <Select
            value={localSettings.ai_response_detail}
            onValueChange={(value) => setLocalSettings({ ...localSettings, ai_response_detail: value })}
          >
            <SelectTrigger id="ai-detail">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="conciso">{t("detailConcise")}</SelectItem>
              <SelectItem value="moderado">{t("detailModerate")}</SelectItem>
              <SelectItem value="detalhado">{t("detailDetailed")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="p-4 bg-muted rounded-lg space-y-2">
          <p className="text-xs font-medium flex items-center gap-2">
            {currentExample.emoji} {t("personalityExample")}
          </p>
          <p className="text-sm italic">
            "{currentExample.sample}"
          </p>
          <p className="text-xs text-muted-foreground">
            {currentExample.description}
          </p>
        </div>

        <Button onClick={handleSave} disabled={loading}>
          {loading ? t("saving") : t("save")}
        </Button>
      </CardContent>
    </Card>
  );
}
