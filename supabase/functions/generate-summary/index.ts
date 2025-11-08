const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, date } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    // Fetch activities from the specified date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch messages count
    const messagesResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/messages?user_id=eq.${userId}&created_at=gte.${startOfDay.toISOString()}&created_at=lte.${endOfDay.toISOString()}&select=id`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );
    const messages = await messagesResponse.json();

    // Fetch notes created
    const notesResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/notes?user_id=eq.${userId}&created_at=gte.${startOfDay.toISOString()}&created_at=lte.${endOfDay.toISOString()}&select=title`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );
    const notes = await notesResponse.json();

    // Fetch reminders completed
    const remindersResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/reminders?user_id=eq.${userId}&datetime=gte.${startOfDay.toISOString()}&datetime=lte.${endOfDay.toISOString()}&select=title,completed`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );
    const reminders = await remindersResponse.json();

    // Fetch mood entries
    const moodResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/mood_entries?user_id=eq.${userId}&date=eq.${date}&select=mood,intensity,notes`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );
    const moods = await moodResponse.json();

    // Fetch routine logs
    const routineLogsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/routine_logs?user_id=eq.${userId}&date=eq.${date}&select=hours_completed,routine_id`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );
    const routineLogs = await routineLogsResponse.json();

    // Fetch weekly goals progress
    const goalsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/weekly_goals?user_id=eq.${userId}&select=title,current_value,target_value,is_completed`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );
    const goals = await goalsResponse.json();

    // Fetch user settings for personalization
    const settingsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/user_settings?user_id=eq.${userId}&select=about_me,ai_personality`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );
    const settings = await settingsResponse.json();
    const userSettings = settings[0] || {};

    // Build activity summary for AI
    const moodSummary = moods.length > 0 ? `Humor predominante: ${moods[0].mood} (intensidade ${moods[0].intensity}/5)` : 'Nenhum humor registado';
    const routineSummary = routineLogs.length > 0 ? `${routineLogs.length} atividades de rotina completadas` : 'Nenhuma rotina registada';
    const goalsSummary = goals.length > 0 ? `${goals.filter((g: any) => g.is_completed).length} de ${goals.length} objetivos concluídos` : 'Nenhum objetivo ativo';
    
    const noteTags = notes.flatMap((n: any) => n.tags || []);
    const reminderTags = reminders.flatMap((r: any) => r.tags || []);
    const allTags = [...new Set([...noteTags, ...reminderTags])];
    const tagsSummary = allTags.length > 0 ? `Temas predominantes: ${allTags.slice(0, 5).join(', ')}` : '';

    const activitySummary = `
Atividades do dia ${date}:
- ${messages.length} mensagens trocadas no chat
- ${notes.length} notas criadas${notes.length > 0 ? ' (' + notes.map((n: any) => n.title).slice(0, 3).join(', ') + ')' : ''}
- ${reminders.filter((r: any) => r.completed).length} de ${reminders.length} lembretes concluídos
- ${moodSummary}
- ${routineSummary}
- ${goalsSummary}
${tagsSummary ? '- ' + tagsSummary : ''}

Contexto do utilizador: ${userSettings.about_me || 'Não fornecido'}
    `.trim();

    // Generate summary using AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: `Você é o AI Twin, um assistente pessoal empático e motivador. Sua personalidade é ${userSettings.ai_personality || 'amigável'}.

Crie um resumo diário narrativo (2-4 frases) que:
1. Reconheça o estado emocional do utilizador
2. Celebre conquistas específicas
3. Identifique padrões nas atividades (tags, temas)
4. Ofereça insights personalizados
5. Sugira 1-2 ações gentis para amanhã
6. Seja caloroso, natural e empático

Use um tom de conversa próxima, como se estivesse falando com um amigo.`
          },
          { 
            role: "user", 
            content: activitySummary 
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      throw new Error("Failed to generate summary with AI");
    }

    const aiData = await aiResponse.json();
    const summaryText = aiData.choices[0].message.content;

    // Save summary to database
    const saveResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/daily_summaries`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          user_id: userId,
          date: date,
          summary_text: summaryText,
        }),
      }
    );

    const savedSummary = await saveResponse.json();

    return new Response(JSON.stringify({ summary: summaryText, saved: savedSummary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error("generate-summary error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
