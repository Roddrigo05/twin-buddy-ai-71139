import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MessageSquare, FileText, Bell, TrendingUp } from "lucide-react";

export default function Analytics() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalMessages: 0,
    totalNotes: 0,
    activeReminders: 0,
    totalConversations: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      const [messagesCount, notesCount, remindersCount, conversationsCount] = await Promise.all([
        supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("sender", "user"),
        supabase
          .from("notes")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("reminders")
          .select("*", { count: "exact", head: true })
          .eq("completed", false),
        supabase
          .from("conversations")
          .select("*", { count: "exact", head: true }),
      ]);

      setStats({
        totalMessages: messagesCount.count || 0,
        totalNotes: notesCount.count || 0,
        activeReminders: remindersCount.count || 0,
        totalConversations: conversationsCount.count || 0,
      });
    };

    fetchStats();
  }, [user]);

  const statsCards = [
    {
      title: "Total de Conversas",
      value: stats.totalConversations,
      description: "Conversas iniciadas com a IA",
      icon: MessageSquare,
      color: "text-primary",
    },
    {
      title: "Mensagens Enviadas",
      value: stats.totalMessages,
      description: "Total de mensagens suas",
      icon: TrendingUp,
      color: "text-green-500",
    },
    {
      title: "Notas Criadas",
      value: stats.totalNotes,
      description: "Total de notas guardadas",
      icon: FileText,
      color: "text-secondary",
    },
    {
      title: "Lembretes Ativos",
      value: stats.activeReminders,
      description: "Lembretes pendentes",
      icon: Bell,
      color: "text-orange-500",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Análises</h1>
          <p className="text-muted-foreground">Estatísticas de uso do AI Twin</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat) => (
            <Card key={stat.title} className="transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Resumo de Atividade</CardTitle>
            <CardDescription>Sua produtividade com o AI Twin</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Conversas por Dia (Média)</span>
                <span className="text-sm text-muted-foreground">
                  {(stats.totalConversations / 7).toFixed(1)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Mensagens por Conversa (Média)</span>
                <span className="text-sm text-muted-foreground">
                  {stats.totalConversations > 0
                    ? (stats.totalMessages / stats.totalConversations).toFixed(1)
                    : 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Taxa de Conclusão de Lembretes</span>
                <span className="text-sm text-muted-foreground">
                  {stats.activeReminders > 0 ? "Em progresso" : "Nenhum pendente"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
