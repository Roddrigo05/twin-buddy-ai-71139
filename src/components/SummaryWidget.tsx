import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export function SummaryWidget() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateSummary = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-summary`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ userId: user.id, date: today }),
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao gerar resumo");
      }

      const data = await response.json();
      setSummary(data.summary);
      toast.success("Resumo gerado com sucesso!");
    } catch (error) {
      console.error("Error generating summary:", error);
      toast.error("Erro ao gerar resumo do dia");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Resumo do Dia
        </CardTitle>
        <CardDescription>Um resumo das suas atividades de hoje</CardDescription>
      </CardHeader>
      <CardContent>
        {summary ? (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed">{summary}</p>
            <Button onClick={generateSummary} variant="outline" size="sm" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Gerar Novo Resumo
            </Button>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Gere um resumo das suas atividades de hoje
            </p>
            <Button onClick={generateSummary} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Gerar Resumo
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
