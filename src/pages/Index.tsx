import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessageSquare, FileText, Bell, TrendingUp, Target, Clock, Sparkles, Check, Shield, Zap, Palette } from "lucide-react";
import { useTheme } from "next-themes";
import logoDark from "@/assets/logo-dark.png";
import logoLight from "@/assets/logo-light.png";

const Index = () => {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();

  const features = [
    {
      icon: MessageSquare,
      title: "Chat Inteligente com Samantha",
      description: "A Samantha não é apenas um chatbot. Ela aprende com você, adapta-se ao seu estilo e oferece sugestões personalizadas baseadas nos seus hábitos e objetivos.",
      badge: "Powered by AI",
    },
    {
      icon: FileText,
      title: "Notas Rápidas Inteligentes",
      description: "Capture pensamentos no momento certo. Tags inteligentes, cores personalizadas e pesquisa instantânea fazem com que nunca mais perca aquela ideia brilhante.",
      badge: "Pesquisa Instantânea",
    },
    {
      icon: Bell,
      title: "Lembretes Proativos",
      description: "Lembretes inteligentes que se adaptam à sua rotina. Receba notificações no momento certo, por email ou na app. O AI Twin garante que você está sempre no controle.",
      badge: "Email Automático ⭐",
      highlighted: true,
    },
    {
      icon: TrendingUp,
      title: "Análises de Humor e Produtividade",
      description: "Acompanhe o seu humor, identifique padrões e descubra o que realmente impacta a sua produtividade. Dados transformados em insights acionáveis.",
      badge: "Dashboard Personalizado",
    },
    {
      icon: Target,
      title: "Rotinas e Metas Semanais",
      description: "Defina rotinas diárias e metas semanais. O AI Twin acompanha o seu progresso e celebra cada conquista consigo.",
      badge: "Tracking Automático",
    },
    {
      icon: Clock,
      title: "Timeline da Sua Vida Digital",
      description: "Veja tudo o que aconteceu num só lugar. Notas criadas, lembretes concluídos, momentos registrados. A sua linha do tempo pessoal.",
      badge: "Vista Unificada",
    },
  ];

  const problems = [
    { icon: "😓", text: "Lembretes perdidos em múltiplas apps" },
    { icon: "📝", text: "Notas desorganizadas sem contexto" },
    { icon: "📊", text: "Sem visão clara do seu progresso" },
  ];

  const benefits = [
    {
      icon: Shield,
      title: "100% Privado e Seguro",
      description: "Os seus dados são seus. Sempre.",
    },
    {
      icon: Zap,
      title: "Instantâneo e Inteligente",
      description: "IA que aprende e adapta-se a você",
    },
    {
      icon: Palette,
      title: "Bonito e Funcional",
      description: "Design que inspira produtividade",
    },
  ];

  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="mb-20 text-center animate-fade-in">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center">
            <img 
              src={resolvedTheme === "dark" ? logoDark : logoLight} 
              alt="AI Twin Logo" 
              className="h-24 w-24 object-contain drop-shadow-glow"
            />
          </div>
          <h1 className="mb-6 text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
            O seu <span className="bg-gradient-primary bg-clip-text text-transparent">gémeo digital</span>
            <br />que nunca esquece nada
          </h1>
          <p className="mx-auto mb-10 max-w-3xl text-xl md:text-2xl text-muted-foreground leading-relaxed">
            Imagine ter um assistente pessoal que conhece você, lembra-se de tudo e ajuda-o a alcançar os seus objetivos. 
            Bem-vindo ao futuro da produtividade pessoal.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button onClick={() => navigate("/login")} size="lg" className="gap-2 text-lg px-8 py-6 animate-glow">
              <Sparkles className="h-6 w-6" />
              Começar Gratuitamente
            </Button>
            <Button onClick={scrollToFeatures} variant="outline" size="lg" className="text-lg px-8 py-6">
              Ver Como Funciona
            </Button>
          </div>
        </div>

        {/* Problem → Solution Section */}
        <div className="mb-32 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Cansado de esquecer tarefas importantes?
            </h2>
            <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto mb-12">
              {problems.map((problem, index) => (
                <div
                  key={index}
                  className="p-6 rounded-2xl border border-destructive/20 bg-destructive/5"
                >
                  <div className="text-4xl mb-3">{problem.icon}</div>
                  <p className="text-foreground font-medium">{problem.text}</p>
                </div>
              ))}
            </div>
            <div className="text-3xl md:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              O AI Twin resolve tudo isto. Num só lugar. Com inteligência.
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="mb-32">
          <div className="text-center mb-16 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Funcionalidades que transformam o seu dia
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Descubra como o AI Twin se torna o seu parceiro mais confiável
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group rounded-3xl border border-border bg-card p-8 transition-all hover:shadow-elegant hover:scale-105 hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${0.4 + index * 0.1}s` }}
              >
                <div className="mb-6 flex items-start justify-between">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary shadow-md transition-transform group-hover:scale-110 group-hover:rotate-3">
                    <feature.icon className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    feature.highlighted 
                      ? 'bg-gradient-primary text-primary-foreground' 
                      : 'bg-primary/10 text-primary'
                  }`}>
                    {feature.badge}
                  </span>
                </div>
                <h3 className="mb-3 text-xl font-bold">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-32 animate-fade-in" style={{ animationDelay: "0.5s" }}>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Por que escolher AI Twin?
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            {benefits.map((benefit, index) => (
              <div
                key={benefit.title}
                className="text-center p-8 rounded-3xl border border-border bg-card/50 backdrop-blur transition-all hover:shadow-md hover:scale-105"
              >
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-primary/10">
                  <benefit.icon className="h-10 w-10 text-primary" />
                </div>
                <h3 className="mb-3 text-2xl font-bold">{benefit.title}</h3>
                <p className="text-lg text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center p-12 md:p-16 rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 animate-fade-in" style={{ animationDelay: "0.6s" }}>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Pronto para ter o seu gémeo digital?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de utilizadores que já transformaram a sua produtividade
          </p>
          <Button 
            onClick={() => navigate("/login")} 
            size="lg" 
            className="gap-2 text-xl px-12 py-8 animate-glow"
          >
            <Sparkles className="h-6 w-6" />
            Criar Conta Gratuita
          </Button>
          <p className="mt-6 text-sm text-muted-foreground">
            Sem cartão de crédito. Configure em 2 minutos.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
