import { useEffect, useRef, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ConversationSidebar } from "@/components/ConversationSidebar";
import { useTranslation } from "@/contexts/UserSettingsContext";
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';

interface Message {
  id: string;
  sender: "user" | "ai";
  content: string;
  timestamp: string;
  metadata?: {
    type?: string;
    reminder_id?: string;
    action_type?: string;
    quick_actions?: Array<{ label: string; action: string }>;
  };
}

export default function Chat() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    fetchConversations();
  }, [user]);

  useEffect(() => {
    if (conversationId) {
      loadConversationMessages(conversationId);
    }
  }, [conversationId]);

  const fetchConversations = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching conversations:", error);
      return;
    }

    setConversations(data || []);
  };

  const loadConversationMessages = async (convId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at");

    if (error) {
      console.error("Error loading messages:", error);
      return;
    }

    const formattedMessages = (data || []).map((msg: any) => ({
      id: msg.id,
      sender: msg.sender as "user" | "ai",
      content: msg.content,
      timestamp: msg.created_at,
      metadata: msg.metadata,
    }));
    setMessages(formattedMessages);
  };

  const createNewConversation = async () => {
    if (!user) return null;

    const { data, error } = await supabase
      .from("conversations")
      .insert([{ user_id: user.id, title: t("newConversation") }])
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar conversa:", error);
      toast.error("Erro ao criar nova conversa");
      return null;
    }

    setConversationId(data.id);
    setMessages([]);
    fetchConversations();
    return data.id;
  };

  const handleRenameConversation = async (id: string, newTitle: string) => {
    const { error } = await supabase
      .from("conversations")
      .update({ title: newTitle })
      .eq("id", id);

    if (error) {
      toast.error(t("error"));
      return;
    }

    fetchConversations();
    toast.success(t("conversationRenamed"));
  };

  const handleDeleteConversation = async (id: string) => {
    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error(t("error"));
      return;
    }

    if (conversationId === id) {
      setConversationId(null);
      setMessages([]);
    }

    fetchConversations();
    toast.success(t("conversationDeleted"));
  };

  const handleExportConversation = async (id: string, format: 'txt' | 'pdf') => {
    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at");

    if (!msgs) return;

    const conversation = conversations.find(c => c.id === id);
    const title = conversation?.title || "Conversa";
    
    let content = `${title}\n${"=".repeat(title.length)}\n\n`;
    msgs.forEach(msg => {
      content += `${msg.sender === "user" ? "Você" : "AI Twin"}: ${msg.content}\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success(t("conversationExported"));
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    let activeConvId = conversationId;
    if (!activeConvId) {
      activeConvId = await createNewConversation();
      if (!activeConvId) return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      sender: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    await supabase.from("messages").insert({
      conversation_id: activeConvId,
      sender: "user",
      content: userMessage.content,
    });

    try {
      const messagesToSend = [...messages, userMessage].map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.content,
      }));

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: messagesToSend, userId: user?.id }),
      });

      if (response.status === 429) {
        toast.error(t("rateLimitExceeded"));
        setLoading(false);
        return;
      }

      if (response.status === 402) {
        toast.error(t("creditsExhausted"));
        setLoading(false);
        return;
      }

      if (!response.ok || !response.body) {
        throw new Error(t("error"));
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiMessageContent = "";
      const aiMessageId = crypto.randomUUID();

      const tempAiMessage: Message = {
        id: aiMessageId,
        sender: "ai",
        content: "",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, tempAiMessage]);

      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              aiMessageContent += content;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMessageId ? { ...m, content: aiMessageContent } : m
                )
              );
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      await supabase.from("messages").insert({
        conversation_id: activeConvId,
        sender: "ai",
        content: aiMessageContent,
      });

      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", activeConvId);

      fetchConversations();
    } catch (error) {
      console.error("Erro no chat:", error);
      toast.error(t("error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-12rem)] gap-4">
        <ConversationSidebar
          conversations={conversations}
          currentConversationId={conversationId}
          onSelectConversation={setConversationId}
          onNewConversation={createNewConversation}
          onRenameConversation={handleRenameConversation}
          onDeleteConversation={handleDeleteConversation}
          onExportConversation={handleExportConversation}
        />

        <div className="flex-1 flex flex-col">
          {!conversationId ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-semibold">{t("welcomeToAITwin")}</h2>
                <p className="text-muted-foreground">
                  {t("createNewConversation")}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <h2 className="text-2xl font-bold">
                  {conversations.find(c => c.id === conversationId)?.title}
                </h2>
              </div>

              <Card className="flex-1 flex flex-col overflow-hidden">
                <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                  <div className="space-y-4">
                    {messages.length === 0 && (
                      <div className="flex h-full items-center justify-center text-center">
                        <div>
                          <p className="text-lg font-medium mb-2">{t("welcomeMessage")}</p>
                          <p className="text-sm text-muted-foreground">
                            {t("howCanIHelp")}
                          </p>
                        </div>
                      </div>
                    )}
                    {messages.map((message) => (
                      <div key={message.id} className="space-y-2">
                        <div
                          className={`flex animate-fade-in ${
                            message.sender === "user" ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2 transition-all ${
                              message.sender === "user"
                                ? "bg-gradient-primary text-primary-foreground shadow-glow"
                                : "bg-muted hover:bg-muted/80"
                            }`}
                          >
                            {message.sender === "ai" && message.metadata?.type?.startsWith('automated_') && (
                              <div className="mb-2">
                                <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                                  {t("samanthaAssistant")}
                                </span>
                              </div>
                            )}
                            {message.sender === "ai" ? (
                              <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown
                                  rehypePlugins={[rehypeSanitize]}
                                  components={{
                                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                    strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                                    em: ({ children }) => <em className="italic">{children}</em>,
                                    ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                                    ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                                    code: ({ children }) => <code className="bg-muted px-1 rounded text-xs">{children}</code>,
                                  }}
                                >
                                  {message.content}
                                </ReactMarkdown>
                              </div>
                            ) : (
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {message.sender === "ai" && message.metadata?.quick_actions && (
                          <div className="flex gap-2 ml-4 flex-wrap">
                            {message.metadata.quick_actions.map((action: any, idx: number) => (
                              <Button
                                key={idx}
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setInput(action.label);
                                  sendMessage();
                                }}
                                className="text-xs"
                              >
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {loading && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-2xl px-4 py-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                <div className="border-t p-4">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendMessage();
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={t("typeMessage")}
                      disabled={loading}
                      className="flex-1 focus:shadow-glow transition-all"
                    />
                    <Button 
                      type="submit" 
                      disabled={loading || !input.trim()} 
                      size="icon"
                      className={input.trim() ? "animate-glow" : ""}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </form>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
