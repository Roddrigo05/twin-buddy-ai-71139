import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabaseQuery } from "@/lib/supabase-helpers";
import { useAuth } from "@/contexts/AuthContext";
import { MessageSquare, FileText, Bell, TrendingUp, Smile, BarChart3, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoodDistributionChart } from "@/components/analytics/MoodDistributionChart";
import { MoodTrendChart } from "@/components/analytics/MoodTrendChart";
import { MoodBarChart } from "@/components/analytics/MoodBarChart";
import { ActivityHeatmap } from "@/components/analytics/ActivityHeatmap";
import { subDays, format } from "date-fns";

interface MoodEntry {
  mood: string;
  intensity: number;
  date: string;
}

export default function Analytics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMessages: 0,
    totalNotes: 0,
    activeReminders: 0,
    totalConversations: 0,
  });
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      setLoading(true);

      const [messagesCount, notesCount, remindersCount, conversationsCount, moodData] = await Promise.all([
        supabaseQuery
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("sender", "user"),
        supabaseQuery
          .from("notes")
          .select("*", { count: "exact", head: true }),
        supabaseQuery
          .from("reminders")
          .select("*", { count: "exact", head: true })
          .eq("completed", false),
        supabaseQuery
          .from("conversations")
          .select("*", { count: "exact", head: true }),
        supabaseQuery
          .from("mood_entries")
          .select("mood, intensity, date")
          .order("date", { ascending: false })
          .limit(90),
      ]);

      setStats({
        totalMessages: messagesCount.count || 0,
        totalNotes: notesCount.count || 0,
        activeReminders: remindersCount.count || 0,
        totalConversations: conversationsCount.count || 0,
      });

      if (moodData.data) {
        setMoodEntries(moodData.data as MoodEntry[]);
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const getMoodDistribution = () => {
    const distribution = moodEntries.reduce((acc, entry) => {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(distribution).map(([mood, count]) => ({
      mood,
      count,
    }));
  };

  const getMoodTrend = () => {
    const last30Days = subDays(new Date(), 30);
    const trendData = moodEntries
      .filter((entry) => new Date(entry.date) >= last30Days)
      .reduce((acc, entry) => {
        const date = entry.date;
        if (!acc[date]) {
          acc[date] = { total: 0, count: 0 };
        }
        acc[date].total += entry.intensity;
        acc[date].count += 1;
        return acc;
      }, {} as Record<string, { total: number; count: number }>);

    return Object.entries(trendData)
      .map(([date, { total, count }]) => ({
        date,
        avgIntensity: total / count,
        count,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const getActivityHeatmap = () => {
    const last90Days = subDays(new Date(), 90);
    const activities = moodEntries
      .filter((entry) => new Date(entry.date) >= last90Days)
      .reduce((acc, entry) => {
        acc[entry.date] = (acc[entry.date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(activities).map(([date, count]) => ({
      date,
      count,
    }));
  };

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
      color: "text-secondary",
    },
    {
      title: "Notas Criadas",
      value: stats.totalNotes,
      description: "Total de notas guardadas",
      icon: FileText,
      color: "text-primary",
    },
    {
      title: "Lembretes Ativos",
      value: stats.activeReminders,
      description: "Lembretes pendentes",
      icon: Bell,
      color: "text-secondary",
    },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Análises</h1>
          <p className="text-muted-foreground">Estatísticas e insights do AI Twin</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat) => (
            <Card key={stat.title} className="transition-all hover:shadow-md animate-fade-in">
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

        {moodEntries.length > 0 ? (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">
                <BarChart3 className="h-4 w-4 mr-2" />
                Resumo
              </TabsTrigger>
              <TabsTrigger value="mood">
                <Smile className="h-4 w-4 mr-2" />
                Humor
              </TabsTrigger>
              <TabsTrigger value="trends">
                <TrendingUp className="h-4 w-4 mr-2" />
                Tendências
              </TabsTrigger>
              <TabsTrigger value="activity">
                <Calendar className="h-4 w-4 mr-2" />
                Atividade
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
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
                      <span className="text-sm font-medium">Registos de Humor</span>
                      <span className="text-sm text-muted-foreground">{moodEntries.length}</span>
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
            </TabsContent>

            <TabsContent value="mood" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Distribuição de Humor</CardTitle>
                    <CardDescription>Frequência de cada estado emocional</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <MoodDistributionChart data={getMoodDistribution()} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Humor por Frequência</CardTitle>
                    <CardDescription>Estados emocionais mais comuns</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <MoodBarChart data={getMoodDistribution()} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="trends" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Tendência de Humor (30 dias)</CardTitle>
                  <CardDescription>Evolução da intensidade emocional</CardDescription>
                </CardHeader>
                <CardContent>
                  {getMoodTrend().length > 0 ? (
                    <MoodTrendChart data={getMoodTrend()} />
                  ) : (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      <p>Sem dados suficientes para exibir tendências</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Mapa de Atividade (90 dias)</CardTitle>
                  <CardDescription>Frequência de registos ao longo do tempo</CardDescription>
                </CardHeader>
                <CardContent>
                  <ActivityHeatmap data={getActivityHeatmap()} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Análise de Humor</CardTitle>
              <CardDescription>Comece a registar o seu humor para ver análises</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                <Smile className="h-12 w-12 mb-4 opacity-50" />
                <p className="mb-2 text-lg font-medium">Nenhum registo de humor ainda</p>
                <p className="text-sm text-center">
                  Visite a página de Diário de Humor para começar a registar as suas emoções
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
