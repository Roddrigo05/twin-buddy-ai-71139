import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useUserSettings, useTranslation } from "@/contexts/UserSettingsContext";
import { toast } from "sonner";
import { Mail } from "lucide-react";

export function EmailNotificationsSection() {
  const { settings, updateSettings } = useUserSettings();
  const { t } = useTranslation();

  const handleToggleReminders = async (checked: boolean) => {
    try {
      await updateSettings({ email_reminders_enabled: checked });
      toast.success(checked ? "Emails de lembretes ativados" : "Emails de lembretes desativados");
    } catch (error: any) {
      toast.error(`${t("error")}: ${error.message}`);
    }
  };

  const handleToggleNotes = async (checked: boolean) => {
    try {
      await updateSettings({ email_notes_enabled: checked });
      toast.success(checked ? "Emails de notas ativados" : "Emails de notas desativados");
    } catch (error: any) {
      toast.error(`${t("error")}: ${error.message}`);
    }
  };

  const handleReminderDelayChange = async (value: number[]) => {
    try {
      await updateSettings({ reminder_email_delay_hours: value[0] });
      toast.success(`Atraso configurado para ${value[0]} horas`);
    } catch (error: any) {
      toast.error(`${t("error")}: ${error.message}`);
    }
  };

  const handleNoteDelayChange = async (value: number[]) => {
    try {
      await updateSettings({ note_email_delay_days: value[0] });
      toast.success(`Atraso configurado para ${value[0]} dias`);
    } catch (error: any) {
      toast.error(`${t("error")}: ${error.message}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <CardTitle>Notificações por Email</CardTitle>
        </div>
        <CardDescription>
          Configure quando deseja receber emails sobre lembretes e notas pendentes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Reminders Email Toggle */}
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1 space-y-1">
            <Label htmlFor="email-reminders" className="text-base font-medium">
              Emails de Lembretes
            </Label>
            <p className="text-sm text-muted-foreground">
              Receba emails quando lembretes não forem concluídos
            </p>
          </div>
          <Switch
            id="email-reminders"
            checked={settings?.email_reminders_enabled ?? true}
            onCheckedChange={handleToggleReminders}
          />
        </div>

        {/* Reminder Delay Slider */}
        {settings?.email_reminders_enabled && (
          <div className="space-y-3 pl-4 border-l-2 border-primary/20">
            <Label>Enviar email após (horas)</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[settings?.reminder_email_delay_hours ?? 24]}
                onValueChange={handleReminderDelayChange}
                max={72}
                min={1}
                step={1}
                className="flex-1"
              />
              <span className="w-12 text-sm font-medium text-center">
                {settings?.reminder_email_delay_hours ?? 24}h
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Tempo após o lembrete estar pendente antes de enviar email
            </p>
          </div>
        )}

        {/* Notes Email Toggle */}
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1 space-y-1">
            <Label htmlFor="email-notes" className="text-base font-medium">
              Emails de Notas
            </Label>
            <p className="text-sm text-muted-foreground">
              Receba emails quando notas não forem atualizadas há muito tempo
            </p>
          </div>
          <Switch
            id="email-notes"
            checked={settings?.email_notes_enabled ?? true}
            onCheckedChange={handleToggleNotes}
          />
        </div>

        {/* Note Delay Slider */}
        {settings?.email_notes_enabled && (
          <div className="space-y-3 pl-4 border-l-2 border-primary/20">
            <Label>Enviar email após (dias)</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[settings?.note_email_delay_days ?? 7]}
                onValueChange={handleNoteDelayChange}
                max={30}
                min={1}
                step={1}
                className="flex-1"
              />
              <span className="w-12 text-sm font-medium text-center">
                {settings?.note_email_delay_days ?? 7}d
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Dias sem atualização antes de enviar email
            </p>
          </div>
        )}

        <div className="rounded-lg bg-muted/50 p-4 space-y-2">
          <p className="text-sm font-medium flex items-center gap-2">
            <span className="text-lg">💡</span>
            Dica
          </p>
          <p className="text-xs text-muted-foreground">
            Os emails são enviados diariamente às 10:00. Configure os atrasos de acordo com a sua rotina para receber lembretes no momento ideal.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
