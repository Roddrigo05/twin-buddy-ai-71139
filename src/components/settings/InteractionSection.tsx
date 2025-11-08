import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserSettings } from "@/contexts/UserSettingsContext";
import { toast } from "sonner";

export function InteractionSection() {
  const { settings, updateSettings } = useUserSettings();

  const handleTypingSpeedChange = async (speed: string) => {
    try {
      await updateSettings({ typing_speed: speed });
      toast.success("✅ Velocidade atualizada!");
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    }
  };

  const handleDailySummaryChange = async (checked: boolean) => {
    try {
      await updateSettings({ daily_summary_enabled: checked });
      toast.success("✅ Resumo diário atualizado!");
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferências de Interação</CardTitle>
        <CardDescription>Como você prefere interagir com o AI Twin</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="typing-speed">Velocidade de Resposta</Label>
          <Select
            value={settings?.typing_speed || "normal"}
            onValueChange={handleTypingSpeedChange}
          >
            <SelectTrigger id="typing-speed">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="slow">Lenta (mais natural)</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="fast">Rápida (instantânea)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Controla a velocidade de digitação da IA</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Resumo Diário Automático</Label>
            <p className="text-xs text-muted-foreground">Receber um resumo das suas atividades diárias</p>
          </div>
          <Switch
            checked={settings?.daily_summary_enabled ?? true}
            onCheckedChange={handleDailySummaryChange}
          />
        </div>
      </CardContent>
    </Card>
  );
}
