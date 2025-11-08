import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabaseQuery } from "@/lib/supabase-helpers";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function DataPrivacySection() {
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState({ conversations: 0, notes: 0, reminders: 0 });

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    const [convData, notesData, remindersData] = await Promise.all([
      supabaseQuery.from("conversations").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabaseQuery.from("notes").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabaseQuery.from("reminders").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    ]);

    setStats({
      conversations: (convData as any).count || 0,
      notes: (notesData as any).count || 0,
      reminders: (remindersData as any).count || 0,
    });
  };

  const handleExportData = async () => {
    if (!user) return;

    try {
      const [profiles, conversations, notes, reminders, moods, routines, goals] = await Promise.all([
        supabaseQuery.from("profiles").select("*").eq("id", user.id),
        supabaseQuery.from("conversations").select("*").eq("user_id", user.id),
        supabaseQuery.from("notes").select("*").eq("user_id", user.id),
        supabaseQuery.from("reminders").select("*").eq("user_id", user.id),
        supabaseQuery.from("mood_entries").select("*").eq("user_id", user.id),
        supabaseQuery.from("routines").select("*").eq("user_id", user.id),
        supabaseQuery.from("weekly_goals").select("*").eq("user_id", user.id),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        user_id: user.id,
        profiles: (profiles as any).data,
        conversations: (conversations as any).data,
        notes: (notes as any).data,
        reminders: (reminders as any).data,
        moods: (moods as any).data,
        routines: (routines as any).data,
        goals: (goals as any).data,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ai-twin-data-${new Date().toISOString().split("T")[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("Dados exportados com sucesso!");
    } catch (error) {
      toast.error("Erro ao exportar dados");
    }
  };

  const handleClearHistory = async () => {
    if (!user) return;
    if (!confirm("Tem certeza que deseja limpar todo o histórico? Esta ação não pode ser desfeita.")) return;

    try {
      await Promise.all([
        supabaseQuery.from("conversations").delete().eq("user_id", user.id),
        supabaseQuery.from("timeline_events").delete().eq("user_id", user.id),
      ]);

      toast.success("Histórico limpo com sucesso!");
      fetchStats();
    } catch (error) {
      toast.error("Erro ao limpar histórico");
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    const confirmText = prompt("Digite 'ELIMINAR' para confirmar a eliminação permanente da conta:");

    if (confirmText !== "ELIMINAR") {
      toast.error("Confirmação incorreta");
      return;
    }

    toast.error("Funcionalidade em desenvolvimento - contacte o suporte");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados e Privacidade</CardTitle>
        <CardDescription>Gerencie seus dados e privacidade</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-muted p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <p className="text-sm font-medium">Estatísticas de Uso</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>Conversas: {stats.conversations}</div>
            <div>Notas: {stats.notes}</div>
            <div>Lembretes: {stats.reminders}</div>
          </div>
        </div>

        <Button variant="outline" className="w-full" onClick={handleExportData}>
          Exportar Todos os Dados
        </Button>

        <div className="pt-4 border-t">
          <p className="text-sm font-medium text-destructive mb-3">Zona de Perigo</p>
          <div className="space-y-2">
            <Button variant="destructive" className="w-full" onClick={handleClearHistory}>
              Limpar Todo o Histórico
            </Button>
            <Button variant="destructive" className="w-full" onClick={handleDeleteAccount}>
              Eliminar Conta Permanentemente
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
