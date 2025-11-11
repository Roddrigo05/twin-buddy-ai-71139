import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Bug, Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/contexts/UserSettingsContext";
import { useAuth } from "@/contexts/AuthContext";

export default function ReportBug() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    email: user?.email || "",
    name: user?.user_metadata?.name || "",
    description: "",
  });

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.email || !formData.name || !formData.description) {
      toast.error(t("fillAllBugFields"));
      return;
    }

    if (!validateEmail(formData.email)) {
      toast.error(t("invalidEmailFormat"));
      return;
    }

    setLoading(true);

    try {
      // Enviar dados para o webhook do Make
      const response = await fetch('https://hook.eu2.make.com/wst5yc4tlfiyggg2h0lu2xutrsx874h3', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          name: formData.name,
          email: formData.email,
          description: formData.description,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao enviar relatório');
      }

      toast.success(t("bugReportSent"));
      setSubmitted(true);
      setFormData({ title: "", email: "", name: "", description: "" });
    } catch (error) {
      console.error("Error submitting bug report:", error);
      toast.error(t("errorSendingReport"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bug className="h-8 w-8 text-destructive" />
            {t("reportBug")}
          </h1>
          <p className="text-muted-foreground mt-2">{t("reportBugDescription")}</p>
        </div>

        {submitted ? (
          <Card className="animate-fade-in">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">{t("bugReportSent")}</h2>
              <p className="text-muted-foreground text-center mb-6">
                {t("thankYouForFeedback")}
              </p>
              <Button onClick={() => setSubmitted(false)}>
                {t("reportAnotherIssue")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{t("reportBug")}</CardTitle>
              <CardDescription>{t("reportBugDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">{t("reportBugTitle")}</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={t("reportBugTitlePlaceholder")}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t("reportBugName")}</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={t("reportBugNamePlaceholder")}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">{t("reportBugEmail")}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder={t("reportBugEmailPlaceholder")}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t("reportBugDescriptionLabel")}</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={t("reportBugDescriptionPlaceholder")}
                    rows={8}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Send className="h-4 w-4 mr-2 animate-pulse" />
                      {t("submittingReport")}
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      {t("submitBugReport")}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
