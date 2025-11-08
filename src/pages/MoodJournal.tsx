import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Smile, Frown, Meh, Heart, Zap, CloudRain, Star, AlertCircle } from "lucide-react";
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
import { Slider } from "@/components/ui/slider";

interface MoodEntry {
  id: string;
  mood: string;
  intensity: number;
  notes: string | null;
  date: string;
  created_at: string;
}

const moods = [
  { value: 'feliz', label: 'Feliz', icon: Smile, color: 'text-yellow-500' },
  { value: 'triste', label: 'Triste', icon: Frown, color: 'text-blue-500' },
  { value: 'ansioso', label: 'Ansioso', icon: AlertCircle, color: 'text-orange-500' },
  { value: 'calmo', label: 'Calmo', icon: Heart, color: 'text-green-500' },
  { value: 'energizado', label: 'Energizado', icon: Zap, color: 'text-purple-500' },
  { value: 'cansado', label: 'Cansado', icon: CloudRain, color: 'text-gray-500' },
  { value: 'motivado', label: 'Motivado', icon: Star, color: 'text-pink-500' },
  { value: 'estressado', label: 'Estressado', icon: Meh, color: 'text-red-500' },
];

export default function MoodJournal() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string>('feliz');
  const [intensity, setIntensity] = useState<number>(3);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    fetchEntries();
  }, [user]);

  const fetchEntries = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("mood_entries")
      .select("*")
      .order("date", { ascending: false })
      .limit(30);

    if (error) {
      toast.error("Erro ao carregar registos");
      return;
    }

    setEntries(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase
      .from("mood_entries")
      .insert({
        user_id: user?.id,
        mood: selectedMood,
        intensity,
        notes: notes || null,
      });

    if (error) {
      toast.error("Erro ao registar humor");
      return;
    }

    toast.success("Humor registado com sucesso");
    setNotes('');
    setIntensity(3);
    setSelectedMood('feliz');
    setIsDialogOpen(false);
    fetchEntries();
  };

  const getMoodIcon = (moodValue: string) => {
    const mood = moods.find(m => m.value === moodValue);
    return mood || moods[0];
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Diário Emocional</h1>
            <p className="text-muted-foreground">Registe e acompanhe como se sente</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-primary hover:opacity-90">
                <Smile className="h-4 w-4" />
                Registar Humor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Como se sente hoje?</DialogTitle>
                <DialogDescription>
                  Escolha o seu humor e intensidade
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <Label>Selecione o seu humor</Label>
                  <div className="grid grid-cols-4 gap-3">
                    {moods.map((mood) => {
                      const Icon = mood.icon;
                      return (
                        <button
                          key={mood.value}
                          type="button"
                          onClick={() => setSelectedMood(mood.value)}
                          className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all hover:bg-accent ${
                            selectedMood === mood.value
                              ? 'border-primary bg-accent'
                              : 'border-border'
                          }`}
                        >
                          <Icon className={`h-8 w-8 ${mood.color}`} />
                          <span className="text-sm font-medium">{mood.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Intensidade: {intensity}/5</Label>
                  <Slider
                    value={[intensity]}
                    onValueChange={(value) => setIntensity(value[0])}
                    min={1}
                    max={5}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Leve</span>
                    <span>Moderado</span>
                    <span>Intenso</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notas (opcional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="O que causou este sentimento?"
                    rows={4}
                  />
                </div>

                <Button type="submit" className="w-full">
                  Registar
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => {
            const moodInfo = getMoodIcon(entry.mood);
            const Icon = moodInfo.icon;
            return (
              <Card key={entry.id} className="animate-fade-in">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-accent p-2">
                        <Icon className={`h-6 w-6 ${moodInfo.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{moodInfo.label}</CardTitle>
                        <CardDescription>
                          {new Date(entry.date).toLocaleDateString("pt-PT", {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1">
                      <span className="text-xs font-medium text-primary">
                        {entry.intensity}/5
                      </span>
                    </div>
                  </div>
                </CardHeader>
                {entry.notes && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{entry.notes}</p>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {entries.length === 0 && (
          <div className="flex h-64 items-center justify-center text-center text-muted-foreground">
            <div>
              <Smile className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p className="mb-2 text-lg font-medium">😊 Nenhum registo ainda</p>
              <p className="text-sm">Comece a registar como se sente hoje</p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
