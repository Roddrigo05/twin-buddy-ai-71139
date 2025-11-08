// Edge function for AI chat

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Fetch user settings for personalized AI
    let systemPrompt = "You are AI Twin, an intelligent, helpful, and friendly personal assistant.";
    let language = "pt";
    
    if (userId && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const settingsResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/user_settings?user_id=eq.${userId}&select=*`,
          {
            headers: {
              'apikey': SUPABASE_SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            },
          }
        );
        
        if (settingsResponse.ok) {
          const settings = await settingsResponse.json();
          if (settings && settings.length > 0) {
            const userSettings = settings[0];
            language = userSettings.language || 'pt';
            
            // Enhanced personality map
            const personalityMap = {
              'formal': {
                tone: 'formal, técnico e estruturado. Use vocabulário preciso, evite contrações e não use emojis',
                style: 'Organize respostas em tópicos numerados quando apropriado.'
              },
              'amigável': {
                tone: 'casual, caloroso e acessível. Use linguagem simples e emojis ocasionais (😊 👍 ✨)',
                style: 'Seja conversacional e empático. Faça perguntas de follow-up.'
              },
              'motivacional': {
                tone: 'inspirador, otimista e encorajador. Use frases positivas e emojis felizes (🌟 💪 🎉 ❤️)',
                style: 'Celebre conquistas, reforce pontos fortes e ofereça encorajamento.'
              },
              'calma': {
                tone: 'sereno, paciente e empático. Valide emoções e use linguagem gentil',
                style: 'Ofereça apoio emocional. Use emojis suaves (🌸 🌿 💙)'
              },
              'criativa': {
                tone: 'espontâneo, imaginativo e expansivo. Use metáforas e analogias',
                style: 'Pense fora da caixa, ofereça múltiplas perspectivas. Use emojis criativos (🎨 🚀 💡 🌈)'
              }
            };
            
            const detailMap = {
              'conciso': 'Seja EXTREMAMENTE breve (1-2 frases). Vá direto ao ponto.',
              'moderado': 'Forneça respostas equilibradas (2-4 frases).',
              'detalhado': 'Seja ABRANGENTE (5+ frases). Forneça explicações detalhadas.'
            };
            
            const personality = personalityMap[userSettings.ai_personality as keyof typeof personalityMap] || personalityMap['amigável'];
            const detail = detailMap[userSettings.ai_response_detail as keyof typeof detailMap] || detailMap['moderado'];
            
            const languageInstruction = language === 'en' 
              ? 'IMPORTANT: Respond ONLY in English (UK/US).' 
              : 'IMPORTANTE: Responda APENAS em Português Europeu (PT-PT), NÃO Português do Brasil. Use vocabulário e expressões de Portugal (ex: "telemóvel" em vez de "celular", "ecrã" em vez de "tela", "autocarro" em vez de "ônibus", etc.).';
            
    systemPrompt = `You are Samantha, the AI Twin - an intelligent, empathetic personal assistant.

${languageInstruction}

PERSONALITY: ${personality.tone}
STYLE: ${personality.style}
DETAIL LEVEL: ${detail}

FORMATTING: Use Markdown for formatting:
- **bold** for emphasis
- *italic* for subtleties
- Lists when appropriate
- Line breaks for readability

${userSettings.about_me ? `USER CONTEXT: "${userSettings.about_me}"` : ''}

IMPORTANT: Radically adapt your tone and style based on the chosen personality.

TOOLS AVAILABLE:
You can help users manage their reminders and routines. When users ask to:
- Postpone/reschedule a reminder: Use the postpone_reminder tool
- Complete a reminder: Use the complete_reminder tool
- Delete a reminder: Use the delete_reminder tool
- Adjust a routine target: Use the adjust_routine_target tool

Always confirm actions with users before executing them.`;
          }
        }
      } catch (error) {
        console.error("Error fetching user settings:", error);
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
        tools: [
          {
            type: "function",
            function: {
              name: "postpone_reminder",
              description: "Adia um lembrete para uma nova data/hora",
              parameters: {
                type: "object",
                properties: {
                  reminder_id: { type: "string", description: "ID do lembrete" },
                  new_datetime: { type: "string", description: "Nova data/hora (ISO 8601)" }
                },
                required: ["reminder_id", "new_datetime"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "complete_reminder",
              description: "Marca um lembrete como concluído",
              parameters: {
                type: "object",
                properties: {
                  reminder_id: { type: "string", description: "ID do lembrete" }
                },
                required: ["reminder_id"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "delete_reminder",
              description: "Remove um lembrete",
              parameters: {
                type: "object",
                properties: {
                  reminder_id: { type: "string", description: "ID do lembrete" }
                },
                required: ["reminder_id"]
              }
            }
          },
          {
            type: "function",
            function: {
              name: "adjust_routine_target",
              description: "Ajusta a meta de uma rotina",
              parameters: {
                type: "object",
                properties: {
                  routine_id: { type: "string", description: "ID da rotina" },
                  new_target: { type: "number", description: "Nova meta em horas" }
                },
                required: ["routine_id", "new_target"]
              }
            }
          }
        ]
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Credits exhausted. Add credits to workspace." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
