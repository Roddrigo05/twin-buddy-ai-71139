import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, MessageSquare, StickyNote, Calendar } from "lucide-react";

export default function Welcome() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Se já visitou, redirecionar para dashboard
    const hasVisited = localStorage.getItem(`welcome_seen_${user?.id}`);
    if (hasVisited) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleStart = () => {
    if (user) {
      localStorage.setItem(`welcome_seen_${user.id}`, 'true');
    }
    navigate('/dashboard');
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center mb-12">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 shadow-lg">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Bem-vindo ao AI Twin, {user?.user_metadata?.name || 'amigo'}! 🎉
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Seu assistente pessoal inteligente está pronto para ajudá-lo a organizar sua vida,
            criar notas, gerenciar lembretes e muito mais.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold mb-2">Chat Inteligente</h3>
            <p className="text-sm text-muted-foreground">
              Converse com sua IA personalizada para tirar dúvidas e obter sugestões.
            </p>
          </Card>
          
          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <StickyNote className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold mb-2">Notas Organizadas</h3>
            <p className="text-sm text-muted-foreground">
              Crie e organize suas notas com cores e tags personalizadas.
            </p>
          </Card>
          
          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold mb-2">Lembretes & Rotinas</h3>
            <p className="text-sm text-muted-foreground">
              Nunca mais esqueça compromissos importantes com lembretes inteligentes.
            </p>
          </Card>
        </div>

        <div className="text-center">
          <Button onClick={handleStart} size="lg" className="px-8">
            Começar a Usar
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
