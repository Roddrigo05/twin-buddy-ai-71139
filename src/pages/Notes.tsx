import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Trash2, Edit, Search, Tag } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

interface Note {
  id: string;
  title: string;
  content: string | null;
  created_at: string;
  tags: string[];
  color: string;
  is_favorite: boolean;
}

const suggestedTags = ['estudo', 'trabalho', 'pessoal', 'saúde', 'financeiro', 'criativo', 'ideias', 'projeto'];

export default function Notes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [formData, setFormData] = useState({ title: "", content: "", tags: "", color: "#10B981", is_favorite: false });

  useEffect(() => {
    fetchNotes();
  }, [user]);

  const fetchNotes = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar notas");
      return;
    }

    setNotes(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("O título é obrigatório");
      return;
    }

    const tagsArray = formData.tags.split(",").map(t => t.trim()).filter(t => t);

    if (editingNote) {
      const { error } = await supabase
        .from("notes")
        .update({ 
          title: formData.title, 
          content: formData.content,
          tags: tagsArray,
          color: formData.color,
          is_favorite: formData.is_favorite
        })
        .eq("id", editingNote.id);

      if (error) {
        toast.error("Erro ao atualizar nota");
        return;
      }

      toast.success("Nota atualizada com sucesso");
    } else {
      const { error } = await supabase
        .from("notes")
        .insert({
          user_id: user?.id,
          title: formData.title,
          content: formData.content,
          tags: tagsArray,
          color: formData.color,
          is_favorite: formData.is_favorite
        });

      if (error) {
        toast.error("Erro ao criar nota");
        return;
      }

      toast.success("Nota criada com sucesso");
    }

    setFormData({ title: "", content: "", tags: "", color: "#10B981", is_favorite: false });
    setEditingNote(null);
    setIsDialogOpen(false);
    fetchNotes();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("notes").delete().eq("id", id);

    if (error) {
      toast.error("Erro ao eliminar nota");
      return;
    }

    toast.success("Nota eliminada com sucesso");
    fetchNotes();
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setFormData({ 
      title: note.title, 
      content: note.content || "", 
      tags: note.tags?.join(", ") || "",
      color: note.color || "#10B981",
      is_favorite: note.is_favorite || false
    });
    setIsDialogOpen(true);
  };

  const allTags = Array.from(new Set(notes.flatMap(note => note.tags || [])));

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTag = !selectedTag || (note.tags && note.tags.includes(selectedTag));
    
    return matchesSearch && matchesTag;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notas</h1>
            <p className="text-muted-foreground">Gerencie suas notas pessoais</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="gap-2"
                onClick={() => {
                  setEditingNote(null);
                  setFormData({ title: "", content: "", tags: "", color: "#10B981", is_favorite: false });
                }}
              >
                <Plus className="h-4 w-4" />
                Nova Nota
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingNote ? "Editar Nota" : "Nova Nota"}</DialogTitle>
                <DialogDescription>
                  {editingNote ? "Atualize sua nota" : "Crie uma nova nota"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Título da nota"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Conteúdo</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Escreva aqui..."
                    rows={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="estudo, trabalho, projeto"
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
                  {editingNote ? "Atualizar" : "Criar"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Pesquisar notas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={selectedTag === null ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedTag(null)}
              >
                Todas
              </Badge>
              {allTags.map(tag => (
                <Badge
                  key={tag}
                  variant={selectedTag === tag ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedTag(tag)}
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note) => (
            <Card key={note.id} className="transition-shadow hover:shadow-md animate-fade-in">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-1 text-lg">{note.title}</CardTitle>
                    <CardDescription>
                      {new Date(note.created_at).toLocaleDateString("pt-PT")}
                    </CardDescription>
                    {note.tags && note.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {note.tags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(note)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(note.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {note.content && (
                <CardContent>
                  <p className="line-clamp-4 text-sm text-muted-foreground">{note.content}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {filteredNotes.length === 0 && (
          <div className="flex h-64 items-center justify-center text-center text-muted-foreground">
            <div>
              <p className="mb-2 text-lg font-medium">Nenhuma nota encontrada</p>
              <p className="text-sm">
                {selectedTag ? `Nenhuma nota com a tag "${selectedTag}"` : "Crie sua primeira nota para começar"}
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
