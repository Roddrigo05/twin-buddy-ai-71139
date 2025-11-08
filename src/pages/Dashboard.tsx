import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MessageSquare, FileText, Bell, TrendingUp, Sparkles, Target, Activity, Calendar, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { SummaryWidget } from "@/components/SummaryWidget";
import { useTranslation } from "@/contexts/UserSettingsContext";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    totalMessages: 0,
    totalNotes: 0,
    totalReminders: 0,
    activeReminders: 0,
    totalConversations: 0,
    totalRoutines: 0,
    totalWeeklyGoals: 0,
    totalMoodEntries: 0,
    totalTimelineEvents: 0,
    totalDailySummaries: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      const [
        messagesCount,
        notesCount,
        remindersCount,
        activeRemindersCount,
        conversationsCount,
        routinesCount,
        weeklyGoalsCount,
        moodEntriesCount,
        timelineEventsCount,
        dailySummariesCount,
      ] = await Promise.all([
        supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("sender", "user"),
        supabase
          .from("notes")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("reminders")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("reminders")
          .select("*", { count: "exact", head: true })
          .eq("completed", false),
        supabase
          .from("conversations")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("routines")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("weekly_goals")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("mood_entries")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("timeline_events")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("daily_summaries")
          .select("*", { count: "exact", head: true }),
      ]);

      setStats({
        totalMessages: messagesCount.count || 0,
        totalNotes: notesCount.count || 0,
        totalReminders: remindersCount.count || 0,
        activeReminders: activeRemindersCount.count || 0,
        totalConversations: conversationsCount.count || 0,
        totalRoutines: routinesCount.count || 0,
        totalWeeklyGoals: weeklyGoalsCount.count || 0,
        totalMoodEntries: moodEntriesCount.count || 0,
        totalTimelineEvents: timelineEventsCount.count || 0,
        totalDailySummaries: dailySummariesCount.count || 0,
      });
    };

    fetchStats();
  }, [user]);

  const statsCards = [
    {
      title: t("conversations"),
      value: stats.totalConversations,
      description: t("conversationsDescription"),
      icon: MessageSquare,
      color: "text-primary",
    },
    {
      title: t("notesTitle"),
      value: stats.totalNotes,
      description: t("notesDescription"),
      icon: FileText,
      color: "text-secondary",
    },
    {
      title: t("remindersTitle"),
      value: stats.totalReminders,
      description: t("remindersDescription"),
      icon: Bell,
      color: "text-orange-500",
    },
    {
      title: t("messagesTitle"),
      value: stats.totalMessages,
      description: t("messagesDescription"),
      icon: TrendingUp,
      color: "text-green-500",
    },
    {
      title: t("routinesTitle"),
      value: stats.totalRoutines,
      description: t("routinesDescription"),
      icon: Activity,
      color: "text-purple-500",
    },
    {
      title: t("goalsTitle"),
      value: stats.totalWeeklyGoals,
      description: t("goalsDescription"),
      icon: Target,
      color: "text-pink-500",
    },
    {
      title: t("moodTitle"),
      value: stats.totalMoodEntries,
      description: t("moodDescription"),
      icon: Calendar,
      color: "text-yellow-500",
    },
    {
      title: t("timelineTitle"),
      value: stats.totalTimelineEvents,
      description: t("timelineDescription"),
      icon: FileSpreadsheet,
      color: "text-cyan-500",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("dashboard")}</h1>
            <p className="text-muted-foreground">
              {t("welcomeBack")}
            </p>
          </div>
          <Button onClick={() => navigate("/chat")} className="gap-2 bg-gradient-primary hover:opacity-90 relative overflow-hidden group">
            <span className="absolute inset-0 animate-shimmer opacity-0 group-hover:opacity-100" />
            <Sparkles className="h-4 w-4 relative z-10" />
            <span className="relative z-10">{t("newConversationBtn")}</span>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat, index) => (
            <Card 
              key={stat.title} 
              className="animate-fade-in overflow-hidden group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className="rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 p-2 transition-transform group-hover:scale-110">
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <SummaryWidget />

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("quickActionsTitle")}</CardTitle>
              <CardDescription>{t("quickActionsDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button variant="outline" className="justify-start" onClick={() => navigate("/chat")}>
                <MessageSquare className="mr-2 h-4 w-4" />
                {t("startConversationBtn")}
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => navigate("/notes")}>
                <FileText className="mr-2 h-4 w-4" />
                {t("newNoteBtn")}
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => navigate("/reminders")}>
                <Bell className="mr-2 h-4 w-4" />
                {t("addReminderBtn")}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("todaySummaryTitle")}</CardTitle>
              <CardDescription>{t("todaySummaryDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <MessageSquare className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{t("activeConversationsLabel")}</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.totalConversations} {t("conversationsTotalText")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/10">
                    <Bell className="h-4 w-4 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{t("remindersLabel")}</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.activeReminders} {t("pendingRemindersText")} {stats.totalReminders} {t("totalText")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10">
                    <FileText className="h-4 w-4 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{t("notesLabel")}</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.totalNotes} {t("notesSavedText")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/10">
                    <Activity className="h-4 w-4 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{t("routinesLabel")}</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.totalRoutines} {t("routinesActiveText")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-500/10">
                    <Target className="h-4 w-4 text-pink-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{t("weeklyGoalsLabel")}</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.totalWeeklyGoals} {t("goalDefinedText")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/10">
                    <FileSpreadsheet className="h-4 w-4 text-cyan-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{t("timelineLabel")}</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.totalTimelineEvents} {t("eventsRecordedText")}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
