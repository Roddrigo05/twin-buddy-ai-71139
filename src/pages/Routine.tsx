import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Clock, Plus, Trash2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

interface Routine {
  id: string;
  name: string;
  target_hours: number;
  is_active: boolean;
  created_at: string;
}

interface RoutineLog {
  id: string;
  routine_id: string;
  hours_completed: number;
  date: string;
  notes: string | null;
}

export default function Routine() {
  const { user } = useAuth();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [logs, setLogs] = useState<RoutineLog[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [formData, setFormData] = useState({ name: '', target_hours: '' });
  const [logData, setLogData] = useState({ hours: '', notes: '' });

  useEffect(() => {
    fetchRoutines();
    fetchTodayLogs();
  }, [user]);

  const fetchRoutines = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("routines")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar rotinas");
      return;
    }

    setRoutines(data || []);
  };

  const fetchTodayLogs = async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from("routine_logs")
      .select("*")
      .eq("date", today);

    if (error) {
      toast.error("Erro ao carregar registos");
      return;
    }

    setLogs(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.target_hours) {
      toast.error("Preencha todos os campos");
      return;
    }

    const { error } = await supabase
      .from("routines")
      .insert({
        user_id: user?.id,
        name: formData.name,
        target_hours: parseFloat(formData.target_hours),
      });

    if (error) {
      toast.error("Erro ao criar rotina");
      return;
    }

    toast.success("Rotina criada com sucesso");
    setFormData({ name: '', target_hours: '' });
    setIsDialogOpen(false);
    fetchRoutines();
  };

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRoutine || !logData.hours) {
      toast.error("Preencha as horas");
      return;
    }

    const { error } = await supabase
      .from("routine_logs")
      .insert({
        user_id: user?.id,
        routine_id: selectedRoutine.id,
        hours_completed: parseFloat(logData.hours),
        notes: logData.notes || null,
        date: new Date().toISOString().split('T')[0],
      });

    if (error) {
      toast.error("Erro ao registar atividade");
      return;
    }

    toast.success("Atividade registada");
    setLogData({ hours: '', notes: '' });
    setIsLogDialogOpen(false);
    fetchTodayLogs();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("routines")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao desativar rotina");
      return;
    }

    toast.success("Rotina desativada");
    fetchRoutines();
  };

  const getTodayProgress = (routineId: string, targetHours: number) => {
    const todayLog = logs.find(log => log.routine_id === routineId);
    const completed = todayLog?.hours_completed || 0;
    const percentage = (completed / targetHours) * 100;
    return { completed, percentage: Math.min(percentage, 100) };
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Rotina Inteligente</h1>
            <p className="text-muted-foreground">Acompanhe seus hábitos diários</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-primary hover:opacity-90">
                <Plus className="h-4 w-4" />
                Nova Rotina
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Rotina</DialogTitle>
                <DialogDescription>
                  Defina uma nova rotina diária
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Rotina</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Sono, Exercício, Estudo"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target">Meta Diária (horas)</Label>
                  <Input
                    id="target"
                    type="number"
                    step="0.5"
                    value={formData.target_hours}
                    onChange={(e) => setFormData({ ...formData, target_hours: e.target.value })}
                    placeholder="8"
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Criar Rotina
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {routines.map((routine) => {
            const { completed, percentage } = getTodayProgress(routine.id, routine.target_hours);
            const isCompleted = completed >= routine.target_hours;

            return (
              <Card key={routine.id} className="animate-fade-in">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{routine.name}</CardTitle>
                        <CardDescription>
                          Meta: {routine.target_hours}h/dia
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(routine.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Hoje</span>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">
                          {completed.toFixed(1)}h / {routine.target_hours}h
                        </span>
                        {isCompleted && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSelectedRoutine(routine);
                      setIsLogDialogOpen(true);
                    }}
                  >
                    Registar Tempo
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {routines.length === 0 && (
          <div className="flex h-64 items-center justify-center text-center text-muted-foreground">
            <div>
              <Clock className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p className="mb-2 text-lg font-medium">Nenhuma rotina criada</p>
              <p className="text-sm">Crie sua primeira rotina para começar</p>
            </div>
          </div>
        )}

        <Dialog open={isLogDialogOpen} onOpenChange={setIsLogDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registar Atividade</DialogTitle>
              <DialogDescription>
                {selectedRoutine?.name}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleLogSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hours">Horas Completadas</Label>
                <Input
                  id="hours"
                  type="number"
                  step="0.25"
                  value={logData.hours}
                  onChange={(e) => setLogData({ ...logData, hours: e.target.value })}
                  placeholder="2.5"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Textarea
                  id="notes"
                  value={logData.notes}
                  onChange={(e) => setLogData({ ...logData, notes: e.target.value })}
                  placeholder="Como foi?"
                  rows={3}
                />
              </div>
              <Button type="submit" className="w-full">
                Registar
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
