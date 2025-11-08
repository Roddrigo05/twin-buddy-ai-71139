import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Target, Plus, CheckCircle2, Trash2, TrendingUp } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WeeklyGoal {
  id: string;
  title: string;
  description: string | null;
  target_value: number;
  current_value: number;
  unit: string;
  category: string;
  is_completed: boolean;
  week_start_date: string;
  created_at: string;
}

const categories = [
  { value: 'estudo', label: 'Estudo', color: 'bg-blue-500' },
  { value: 'trabalho', label: 'Trabalho', color: 'bg-purple-500' },
  { value: 'saúde', label: 'Saúde', color: 'bg-green-500' },
  { value: 'pessoal', label: 'Pessoal', color: 'bg-pink-500' },
  { value: 'fitness', label: 'Fitness', color: 'bg-orange-500' },
  { value: 'criativo', label: 'Criativo', color: 'bg-yellow-500' },
];

export default function WeeklyGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<WeeklyGoal[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProgressDialogOpen, setIsProgressDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<WeeklyGoal | null>(null);
  const [progressValue, setProgressValue] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_value: '',
    unit: 'horas',
    category: 'pessoal',
  });

  useEffect(() => {
    fetchGoals();
  }, [user]);

  const fetchGoals = async () => {
    if (!user) return;

    const weekStart = getWeekStart();
    const { data, error } = await supabase
      .from("weekly_goals")
      .select("*")
      .gte("week_start_date", weekStart)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar objetivos");
      return;
    }

    setGoals(data || []);
  };

  const getWeekStart = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    return new Date(now.setDate(diff)).toISOString().split('T')[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.target_value) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const { error } = await supabase
      .from("weekly_goals")
      .insert({
        user_id: user?.id,
        title: formData.title,
        description: formData.description || null,
        target_value: parseFloat(formData.target_value),
        unit: formData.unit,
        category: formData.category,
        week_start_date: getWeekStart(),
      });

    if (error) {
      toast.error("Erro ao criar objetivo");
      return;
    }

    toast.success("Objetivo criado com sucesso");
    setFormData({
      title: '',
      description: '',
      target_value: '',
      unit: 'horas',
      category: 'pessoal',
    });
    setIsDialogOpen(false);
    fetchGoals();
  };

  const handleUpdateProgress = async () => {
    if (!selectedGoal || !progressValue) return;

    const newValue = parseFloat(progressValue);
    const updatedValue = Math.min(
      selectedGoal.current_value + newValue,
      selectedGoal.target_value
    );

    const { error } = await supabase
      .from("weekly_goals")
      .update({
        current_value: updatedValue,
        is_completed: updatedValue >= selectedGoal.target_value,
      })
      .eq("id", selectedGoal.id);

    if (error) {
      toast.error("Erro ao atualizar progresso");
      return;
    }

    toast.success("Progresso atualizado");
    setProgressValue('');
    setIsProgressDialogOpen(false);
    fetchGoals();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("weekly_goals")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Erro ao eliminar objetivo");
      return;
    }

    toast.success("Objetivo eliminado");
    fetchGoals();
  };

  const getCategoryColor = (category: string) => {
    return categories.find(c => c.value === category)?.color || 'bg-gray-500';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Objetivos Semanais</h1>
            <p className="text-muted-foreground">Defina e acompanhe suas metas</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-primary hover:opacity-90">
                <Plus className="h-4 w-4" />
                Novo Objetivo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Objetivo Semanal</DialogTitle>
                <DialogDescription>
                  Defina uma meta para esta semana
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Estudar programação"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição (opcional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detalhes sobre o objetivo..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="target">Meta</Label>
                    <Input
                      id="target"
                      type="number"
                      step="0.1"
                      value={formData.target_value}
                      onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                      placeholder="10"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unidade</Label>
                    <Input
                      id="unit"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="horas"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">
                  Criar Objetivo
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((goal) => {
            const percentage = (goal.current_value / goal.target_value) * 100;
            return (
              <Card key={goal.id} className="animate-fade-in">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${getCategoryColor(goal.category)}`} />
                        <CardTitle className="text-lg">{goal.title}</CardTitle>
                        {goal.is_completed && (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                      {goal.description && (
                        <CardDescription className="mt-1">
                          {goal.description}
                        </CardDescription>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(goal.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium">
                        {goal.current_value}/{goal.target_value} {goal.unit}
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                    <p className="text-xs text-muted-foreground text-right">
                      {percentage.toFixed(0)}% completo
                    </p>
                  </div>
                  {!goal.is_completed && (
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => {
                        setSelectedGoal(goal);
                        setIsProgressDialogOpen(true);
                      }}
                    >
                      <TrendingUp className="h-4 w-4" />
                      Atualizar Progresso
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {goals.length === 0 && (
          <div className="flex h-64 items-center justify-center text-center text-muted-foreground">
            <div>
              <Target className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p className="mb-2 text-lg font-medium">🎯 Nenhum objetivo definido</p>
              <p className="text-sm">Crie seu primeiro objetivo semanal</p>
            </div>
          </div>
        )}

        <Dialog open={isProgressDialogOpen} onOpenChange={setIsProgressDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Atualizar Progresso</DialogTitle>
              <DialogDescription>
                {selectedGoal?.title}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="progress">Adicionar {selectedGoal?.unit}</Label>
                <Input
                  id="progress"
                  type="number"
                  step="0.1"
                  value={progressValue}
                  onChange={(e) => setProgressValue(e.target.value)}
                  placeholder="Quanto progrediu?"
                />
              </div>
              <Button onClick={handleUpdateProgress} className="w-full">
                Atualizar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
