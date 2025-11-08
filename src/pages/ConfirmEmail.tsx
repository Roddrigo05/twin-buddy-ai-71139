import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ConfirmEmail() {
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase automaticamente processa o token do URL
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          toast.success("Email confirmado! Bem-vindo ao AI Twin.");
          // Verificar se é primeira vez
          const hasVisited = localStorage.getItem(`welcome_seen_${session.user.id}`);
          navigate(hasVisited ? '/dashboard' : '/welcome');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent/10">
      <div className="text-center space-y-4 p-8">
        <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <h2 className="text-2xl font-bold">A confirmar email...</h2>
        <p className="text-muted-foreground">Por favor aguarde.</p>
      </div>
    </div>
  );
}
