import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, FileText, Bell, TrendingUp, Brain, Sparkles, Shield, Zap } from "lucide-react";
import landingBg from "@/assets/landing-bg.jpeg";
import logoLanding from "@/assets/logo-landing.png";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: MessageSquare,
      title: "Chat Inteligente com Samantha",
      subtitle: "Converse. Descubra. Cresça.",
      description: "A Samantha não é apenas uma IA — ela é a sua parceira digital. Converse naturalmente, tire dúvidas, organize pensamentos e receba insights personalizados que se adaptam ao seu estilo de vida.",
    },
    {
      icon: FileText,
      title: "Organização Sem Esforço",
      subtitle: "Suas Ideias, Sempre ao Alcance",
      description: "Capture cada momento de genialidade. O sistema de notas inteligente mantém tudo organizado automaticamente, para que nunca perca uma ideia importante.",
    },
    {
      icon: Bell,
      title: "Lembretes Inteligentes",
      subtitle: "Nunca Mais Esqueça o Que Importa",
      description: "A Samantha cuida do que importa enquanto você vive o momento. Receba lembretes proativos e contextuais que realmente fazem a diferença no seu dia.",
    },
    {
      icon: TrendingUp,
      title: "Análises e Crescimento",
      subtitle: "Veja Seu Progresso Acontecer",
      description: "Dados que contam a história do seu crescimento. Acompanhe padrões, descubra insights e transforme informação em ação concreta.",
    },
  ];

  const benefits = [
    {
      icon: Brain,
      title: "IA Que Te Entende",
      description: "Não é apenas um assistente, é o seu gémeo digital que aprende e evolui consigo.",
    },
    {
      icon: Zap,
      title: "Proatividade Real",
      description: "A Samantha antecipa suas necessidades e age antes mesmo de você pedir.",
    },
    {
      icon: TrendingUp,
      title: "Insights que Transformam",
      description: "Veja padrões e conexões que você nunca percebeu. Decisões mais inteligentes, resultados melhores.",
    },
    {
      icon: Shield,
      title: "Privacidade Total",
      description: "Seus dados são exclusivamente seus. Segurança e privacidade em primeiro lugar, sempre.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Background */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${landingBg})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/90 to-primary/20" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 py-24 text-center">
          <div className="mb-8 flex justify-center animate-fade-in">
            <img 
              src={logoLanding} 
              alt="AI Twin" 
              className="h-24 w-auto md:h-32 drop-shadow-2xl hover:scale-110 transition-transform duration-300"
            />
          </div>
          
          <h1 className="mb-6 text-5xl md:text-7xl font-bold tracking-tight animate-fade-in">
            O Futuro da Produtividade <br />
            <span className="bg-gradient-primary bg-clip-text text-transparent animate-shimmer">
              Pessoal Está Aqui
            </span>
          </h1>
          
          <p className="mx-auto mb-4 max-w-3xl text-xl md:text-2xl text-foreground/90 animate-fade-in font-light">
            Conheça o <span className="font-semibold text-primary">AI Twin</span> — Seu gémeo digital que organiza, lembra e cresce consigo
          </p>
          
          <p className="mx-auto mb-12 max-w-2xl text-lg text-muted-foreground animate-fade-in italic">
            "Transforme o Caos em Clareza. Seu Gémeo Digital, Sempre ao Seu Lado."
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in">
            <Button 
              onClick={() => navigate("/login")} 
              size="lg" 
              className="gap-2 text-lg px-8 py-6 shadow-glow animate-glow"
            >
              <Sparkles className="h-6 w-6" />
              Começar Minha Jornada
            </Button>
            <Button 
              onClick={() => navigate("/login")} 
              variant="outline" 
              size="lg"
              className="text-lg px-8 py-6 border-2 hover:shadow-md"
            >
              Já Tenho Conta
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Funcionalidades que <span className="text-primary">Transformam</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Descubra como o AI Twin revoluciona a sua produtividade diária
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:gap-12 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card 
                key={feature.title}
                className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 animate-lift border-2"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader>
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow transition-transform group-hover:scale-110 group-hover:rotate-3">
                    <feature.icon className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-2xl">{feature.title}</CardTitle>
                  <CardDescription className="text-lg font-semibold text-primary">
                    {feature.subtitle}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Porque o <span className="bg-gradient-primary bg-clip-text text-transparent">AI Twin</span>?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Mais que uma ferramenta. Uma revolução na forma como você trabalha e vive.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto">
            {benefits.map((benefit, index) => (
              <div
                key={benefit.title}
                className="group p-8 rounded-2xl border border-border bg-card hover:bg-accent/50 transition-all duration-300 hover:shadow-md hover:-translate-y-1 text-center"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="mb-4 flex justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-primary shadow-md transition-transform group-hover:scale-110">
                    <benefit.icon className="h-7 w-7 text-primary-foreground" />
                  </div>
                </div>
                <h3 className="mb-3 text-xl font-semibold">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary/10 via-background to-primary/5">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Pronto para Descobrir o <br />
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Seu Potencial?
              </span>
            </h2>
            <p className="text-xl text-muted-foreground mb-12 leading-relaxed">
              Junte-se a milhares de pessoas que já transformaram a sua produtividade com o AI Twin. 
              O futuro da organização pessoal começa agora.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                onClick={() => navigate("/login")} 
                size="lg" 
                className="gap-2 text-lg px-10 py-7 shadow-glow animate-glow"
              >
                <Sparkles className="h-6 w-6" />
                Começar Agora Gratuitamente
              </Button>
              <Button 
                onClick={() => navigate("/login")} 
                variant="secondary" 
                size="lg"
                className="text-lg px-10 py-7"
              >
                Explorar Funcionalidades
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
