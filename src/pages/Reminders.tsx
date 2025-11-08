import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Trash2, Tag } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Reminder {
  id: string;
  title: string;
  datetime: string;
  completed: boolean;
  category: string;
  tags: string[];
  created_at: string;
}

const categories = [
  { value: 'estudo', label: 'Estudo', color: 'bg-blue-500' },
  { value: 'trabalho', label: 'Trabalho', color: 'bg-purple-500' },
  { value: 'pessoal', label: 'Pessoal', color: 'bg-pink-500' },
  { value: 'saúde', label: 'Saúde', color: 'bg-green-500' },
  { value: 'financeiro', label: 'Financeiro', color: 'bg-yellow-500' },
  { value: 'outros', label: 'Outros', color: 'bg-gray-500' },
];

const suggestedTags = ['urgente', 'importante', 'rápido', 'projeto', 'reunião', 'compras', 'casa'];

export default function Reminders() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    title: "", 
    datetime: "",
    category: "outros",
    tags: ""
  });

  useEffect(() => {
    fetchReminders();
  }, [user]);

  const fetchReminders = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("reminders")
      .select("*")
      .order("datetime", { ascending: true });

    if (error) {
      toast.error("Erro ao carregar lembretes");
      return;
    }

    setReminders(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.datetime) {
      toast.error("Preencha todos os campos");
      return;
    }

    const tagsArray = formData.tags.split(",").map(t => t.trim()).filter(t => t);

    const { error } = await supabase.from("reminders").insert({
      user_id: user?.id,
      title: formData.title,
      datetime: formData.datetime,
      category: formData.category,
      tags: tagsArray,
    });

    if (error) {
      toast.error("Erro ao criar lembrete");
      return;
    }

    toast.success("Lembrete criado com sucesso");
    setFormData({ title: "", datetime: "", category: "outros", tags: "" });
    setIsDialogOpen(false);
    fetchReminders();
  };

  const handleToggleComplete = async (id: string, completed: boolean) => {
    const { error } = await supabase
      .from("reminders")
      .update({ completed: !completed })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao atualizar lembrete");
      return;
    }

    fetchReminders();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("reminders").delete().eq("id", id);

    if (error) {
      toast.error("Erro ao eliminar lembrete");
      return;
    }

    toast.success("Lembrete eliminado com sucesso");
    fetchReminders();
  };

  const getCategoryColor = (category: string) => {
    return categories.find(c => c.value === category)?.color || 'bg-gray-500';
  };

  const activeReminders = reminders.filter((r) => !r.completed);
  const completedReminders = reminders.filter((r) => r.completed);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Lembretes</h1>
            <p className="text-muted-foreground">Gerencie seus lembretes</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="gap-2"
                onClick={() => setFormData({ title: "", datetime: "", category: "outros", tags: "" })}
              >
                <Plus className="h-4 w-4" />
                Novo Lembrete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Lembrete</DialogTitle>
                <DialogDescription>Crie um novo lembrete</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Título do lembrete"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="datetime">Data e Hora</Label>
                  <Input
                    id="datetime"
                    type="datetime-local"
                    value={formData.datetime}
                    onChange={(e) => setFormData({ ...formData, datetime: e.target.value })}
                    required
                  />
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
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="urgente, importante"
                  />
                  <div className="flex flex-wrap gap-2">
                    {suggestedTags.map(tag => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="cursor-pointer hover:bg-accent"
                        onClick={() => {
                          const currentTags = formData.tags ? formData.tags.split(',').map(t => t.trim()) : [];
                          if (!currentTags.includes(tag)) {
                            setFormData({ ...formData, tags: [...currentTags, tag].join(', ') });
                          }
                        }}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  Criar
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ativos</CardTitle>
              <CardDescription>{activeReminders.length} lembrete(s) pendente(s)</CardDescription>
            </CardHeader>
            <CardContent>
              {activeReminders.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">Nenhum lembrete ativo</p>
              ) : (
                <div className="space-y-2">
                  {activeReminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className="flex items-start justify-between rounded-lg border border-border p-3 transition-colors hover:bg-accent"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <Checkbox
                          checked={reminder.completed}
                          onCheckedChange={() =>
                            handleToggleComplete(reminder.id, reminder.completed)
                          }
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${getCategoryColor(reminder.category)}`} />
                            <p className="font-medium">{reminder.title}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(reminder.datetime).toLocaleString("pt-PT")}
                          </p>
                          {reminder.tags && reminder.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {reminder.tags.map((tag, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  <Tag className="h-3 w-3 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(reminder.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {completedReminders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Concluídos</CardTitle>
                <CardDescription>{completedReminders.length} lembrete(s) concluído(s)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {completedReminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className="flex items-start justify-between rounded-lg border border-border p-3 opacity-60"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <Checkbox
                          checked={reminder.completed}
                          onCheckedChange={() =>
                            handleToggleComplete(reminder.id, reminder.completed)
                          }
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${getCategoryColor(reminder.category)}`} />
                            <p className="font-medium line-through">{reminder.title}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(reminder.datetime).toLocaleString("pt-PT")}
                          </p>
                          {reminder.tags && reminder.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {reminder.tags.map((tag, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  <Tag className="h-3 w-3 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(reminder.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
