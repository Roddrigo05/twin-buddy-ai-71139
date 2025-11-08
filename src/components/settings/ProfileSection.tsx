import { useState, FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserSettings } from "@/contexts/UserSettingsContext";
import { toast } from "sonner";

export function ProfileSection() {
  const { profile, updateProfile } = useUserSettings();
  const [loading, setLoading] = useState(false);
  const [localName, setLocalName] = useState(profile?.name || "");

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!localName.trim()) {
      toast.error("O nome não pode estar vazio");
      return;
    }

    setLoading(true);

    try {
      await updateProfile({ name: localName });
      toast.success("✅ Perfil atualizado! Nome visível no topo.");
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil</CardTitle>
        <CardDescription>Atualize suas informações pessoais</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              placeholder="Seu nome"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={profile?.email || ""}
              disabled
              className="bg-muted"
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Salvar Perfil"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
