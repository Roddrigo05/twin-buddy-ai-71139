import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain, Sparkles, MessageSquare, FileText, Bell, TrendingUp } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: MessageSquare,
      title: "Chat Inteligente",
      description: "Converse com IA avançada para ajudar no seu dia a dia",
    },
    {
      icon: FileText,
      title: "Notas Rápidas",
      description: "Organize suas ideias e informações importantes",
    },
    {
      icon: Bell,
      title: "Lembretes",
      description: "Nunca esqueça compromissos e tarefas importantes",
    },
    {
      icon: TrendingUp,
      title: "Análises",
      description: "Acompanhe sua produtividade e progresso",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-16">
        <div className="mb-16 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-primary shadow-glow">
            <Brain className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="mb-4 text-5xl font-bold tracking-tight">
            Bem-vindo ao <span className="bg-gradient-primary bg-clip-text text-transparent">AI Twin</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground">
            Seu assistente pessoal inteligente. Organize seu dia, converse com IA e aumente sua produtividade.
          </p>
          <div className="flex justify-center gap-4">
            <Button onClick={() => navigate("/login")} size="lg" className="gap-2">
              <Sparkles className="h-5 w-5" />
              Começar Agora
            </Button>
            <Button onClick={() => navigate("/login")} variant="outline" size="lg">
              Entrar
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary shadow-md transition-transform group-hover:scale-110">
                <feature.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
