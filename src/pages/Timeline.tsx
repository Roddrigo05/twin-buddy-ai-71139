import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabaseQuery } from "@/lib/supabase-helpers";
import { useAuth } from "@/contexts/AuthContext";
import { FileText, Bell, MessageSquare, Smile, Clock, Target, Calendar, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TimelineEvent {
  id: string;
  event_type: string;
  title: string;
  content: string | null;
  event_date: string;
  created_at: string;
}

const eventIcons = {
  note: FileText,
  reminder: Bell,
  message: MessageSquare,
  mood: Smile,
  routine: Clock,
  goal: Target,
};

const eventColors = {
  note: "bg-blue-500",
  reminder: "bg-orange-500",
  message: "bg-purple-500",
  mood: "bg-pink-500",
  routine: "bg-green-500",
  goal: "bg-yellow-500",
};

const eventLabels = {
  note: "Nota",
  reminder: "Lembrete",
  message: "Mensagem",
  mood: "Humor",
  routine: "Rotina",
  goal: "Objetivo",
};

export default function Timeline() {
  const { user } = useAuth();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, [user, filter]);

  const fetchEvents = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabaseQuery
        .from("timeline_events")
        .select("*")
        .eq("user_id", user.id)
        .order("event_date", { ascending: false })
        .limit(100);

      if (filter !== "all") {
        query = query.eq("event_type", filter);
      }

      const { data, error } = await query;

      if (error) {
        toast.error("Erro ao carregar timeline");
        return;
      }

      setEvents((data as any) || []);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Erro ao carregar timeline");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hoje";
    if (diffDays === 1) return "Ontem";
    if (diffDays < 7) return `Há ${diffDays} dias`;
    
    return date.toLocaleDateString("pt-PT", {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const groupByDate = (events: TimelineEvent[]) => {
    const grouped: { [key: string]: TimelineEvent[] } = {};
    
    events.forEach(event => {
      const date = new Date(event.event_date).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(event);
    });

    return grouped;
  };

  const groupedEvents = groupByDate(events);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Linha do Tempo</h1>
            <p className="text-muted-foreground">Histórico de suas atividades</p>
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="note">Notas</SelectItem>
              <SelectItem value="reminder">Lembretes</SelectItem>
              <SelectItem value="mood">Humor</SelectItem>
              <SelectItem value="routine">Rotina</SelectItem>
              <SelectItem value="goal">Objetivos</SelectItem>
              <SelectItem value="message">Conversas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">A carregar atividades...</p>
            </div>
          </div>
        ) : Object.keys(groupedEvents).length === 0 ? (
          <div className="flex h-[60vh] items-center justify-center text-center">
            <div className="space-y-4 max-w-md">
              <div className="mx-auto w-24 h-24 rounded-full bg-gradient-primary/10 flex items-center justify-center animate-fade-in">
                <Sparkles className="h-12 w-12 text-primary animate-pulse" />
              </div>
              <h3 className="text-2xl font-semibold animate-fade-in" style={{ animationDelay: "0.1s" }}>
                Nenhuma atividade por aqui 📭
              </h3>
              <p className="text-muted-foreground animate-fade-in" style={{ animationDelay: "0.2s" }}>
                Parece que ainda não há atividades registadas.
                <br />
                Comece criando uma nota, lembrete ou conversando com a IA!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedEvents).map(([date, dayEvents], groupIndex) => (
              <div 
                key={date} 
                className="space-y-4 animate-fade-in"
                style={{ animationDelay: `${groupIndex * 0.1}s` }}
              >
                <div className="flex items-center gap-3 sticky top-0 bg-background/95 backdrop-blur-sm py-2 z-10">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">
                    {formatDate(date)}
                  </h2>
                  <div className="h-px flex-1 bg-border" />
                </div>
                
                <div className="ml-8 space-y-3 border-l-2 border-border pl-6">
                  {dayEvents.map((event, eventIndex) => {
                    const Icon = eventIcons[event.event_type as keyof typeof eventIcons] || FileText;
                    const color = eventColors[event.event_type as keyof typeof eventColors];
                    const label = eventLabels[event.event_type as keyof typeof eventLabels];

                    return (
                      <Card 
                        key={event.id} 
                        className="animate-slide-in-right hover:shadow-md transition-all duration-300 relative group"
                        style={{ animationDelay: `${eventIndex * 0.05}s` }}
                      >
                        <div className={`absolute -left-9 top-6 h-4 w-4 rounded-full border-4 border-background ${color} group-hover:scale-125 transition-transform`} />
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`rounded-lg p-2 ${color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
                                <Icon className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <CardTitle className="text-base">{event.title}</CardTitle>
                                  <Badge variant="secondary" className="text-xs">
                                    {label}
                                  </Badge>
                                </div>
                                <CardDescription>
                                  {new Date(event.event_date).toLocaleTimeString("pt-PT", {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </CardDescription>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        {event.content && (
                          <CardContent>
                            <p className="text-sm text-muted-foreground line-clamp-2">{event.content}</p>
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
