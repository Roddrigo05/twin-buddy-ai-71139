import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('🔍 Verificando lembretes e rotinas...');

    // 1. VERIFICAR LEMBRETES PENDENTES
    const { data: overdueReminders } = await supabase
      .from('reminders')
      .select('*, user_settings!inner(ai_personality, language)')
      .eq('completed', false)
      .lt('datetime', new Date().toISOString())
      .or('notified_at.is.null,notified_at.lt.' + new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    console.log(`📋 Encontrados ${overdueReminders?.length || 0} lembretes atrasados`);

    for (const reminder of overdueReminders || []) {
      const newCount = reminder.postponed_count + 1;
      
      // Atualizar contador
      await supabase
        .from('reminders')
        .update({ 
          postponed_count: newCount,
          last_checked_at: new Date().toISOString()
        })
        .eq('id', reminder.id);

      // Se adiado 2+ vezes, enviar mensagem
      if (newCount >= 2) {
        const personality = reminder.user_settings?.ai_personality || 'amigável';
        const language = reminder.user_settings?.language || 'pt';
        
        const message = await generatePersonalizedMessage(
          'postponed_reminder',
          { title: reminder.title, days: Math.ceil((Date.now() - new Date(reminder.datetime).getTime()) / (1000 * 60 * 60 * 24)) },
          personality,
          language,
          LOVABLE_API_KEY
        );

        await sendChatMessage(supabase, reminder.user_id, message, {
          type: 'automated_reminder',
          reminder_id: reminder.id,
          action_type: 'postponed_check',
          quick_actions: [
            { label: language === 'pt' ? 'Adiar para amanhã' : 'Postpone to tomorrow', action: 'postpone_1d' },
            { label: language === 'pt' ? 'Ajustar hora' : 'Adjust time', action: 'adjust_time' },
            { label: language === 'pt' ? 'Marcar como concluído' : 'Mark as completed', action: 'complete' }
          ]
        });

        // Marcar como notificado
        await supabase
          .from('reminders')
          .update({ notified_at: new Date().toISOString() })
          .eq('id', reminder.id);

        console.log(`✉️ Mensagem enviada para lembrete: ${reminder.title}`);
      }
    }

    // 2. VERIFICAR ROTINAS NÃO CUMPRIDAS
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data: users } = await supabase
      .from('profiles')
      .select('id');

    for (const user of users || []) {
      const { data: routines } = await supabase
        .from('routines')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      for (const routine of routines || []) {
        // Verificar se falhou hoje e ontem
        const { data: todayLog } = await supabase
          .from('routine_logs')
          .select('hours_completed')
          .eq('routine_id', routine.id)
          .eq('date', today)
          .single();

        const { data: yesterdayLog } = await supabase
          .from('routine_logs')
          .select('hours_completed')
          .eq('routine_id', routine.id)
          .eq('date', yesterday)
          .single();

        const todayMet = todayLog && Number(todayLog.hours_completed) >= Number(routine.target_hours);
        const yesterdayMet = yesterdayLog && Number(yesterdayLog.hours_completed) >= Number(routine.target_hours);

        // Registar streak
        await supabase
          .from('routine_streak_tracker')
          .upsert({
            user_id: user.id,
            routine_id: routine.id,
            date: today,
            target_met: todayMet || false
          }, {
            onConflict: 'user_id,routine_id,date'
          });

        // Se falhou 2 dias consecutivos, enviar mensagem
        if (!todayMet && !yesterdayMet) {
          const { data: userSettings } = await supabase
            .from('user_settings')
            .select('ai_personality, language')
            .eq('user_id', user.id)
            .single();

          const personality = userSettings?.ai_personality || 'amigável';
          const language = userSettings?.language || 'pt';

          const message = await generatePersonalizedMessage(
            'failed_routine',
            { name: routine.name, target: routine.target_hours },
            personality,
            language,
            LOVABLE_API_KEY
          );

          await sendChatMessage(supabase, user.id, message, {
            type: 'automated_routine',
            routine_id: routine.id,
            action_type: 'failed_check'
          });

          console.log(`✉️ Mensagem enviada para rotina: ${routine.name}`);
        }
      }
    }

    // 3. RECONHECER CONQUISTAS (lembretes concluídos nas últimas 24h)
    const { data: recentCompleted } = await supabase
      .from('reminders')
      .select('*, user_settings!inner(ai_personality, language)')
      .eq('completed', true)
      .gte('datetime', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .is('notified_at', null);

    for (const reminder of recentCompleted || []) {
      const personality = reminder.user_settings?.ai_personality || 'amigável';
      const language = reminder.user_settings?.language || 'pt';

      const message = await generatePersonalizedMessage(
        'completed_reminder',
        { title: reminder.title },
        personality,
        language,
        LOVABLE_API_KEY
      );

      await sendChatMessage(supabase, reminder.user_id, message, {
        type: 'automated_celebration',
        reminder_id: reminder.id,
        action_type: 'celebration'
      });

      // Marcar como notificado
      await supabase
        .from('reminders')
        .update({ notified_at: new Date().toISOString() })
        .eq('id', reminder.id);

      console.log(`🎉 Parabéns enviado para: ${reminder.title}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Verificação concluída' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function generatePersonalizedMessage(
  type: string,
  data: any,
  personality: string,
  language: string,
  apiKey: string
): Promise<string> {
  const personalityMap: Record<string, any> = {
    'formal': {
      pt: {
        postponed: `Verifico que o lembrete "${data.title}" está pendente há ${data.days} dias. Pretende reagendá-lo ou ajustar a sua prioridade?`,
        failed: `Constato que a rotina "${data.name}" (meta: ${data.target}h) não foi cumprida nos últimos dois dias. Necessita de assistência para reorganizar?`,
        completed: `Lembrete "${data.title}" concluído com sucesso. Excelente gestão de tarefas.`
      },
      en: {
        postponed: `I note that the reminder "${data.title}" has been pending for ${data.days} days. Would you like to reschedule it?`,
        failed: `I observe that routine "${data.name}" (target: ${data.target}h) has not been met for two consecutive days. Do you require assistance?`,
        completed: `Reminder "${data.title}" completed successfully. Excellent task management.`
      }
    },
    'amigável': {
      pt: {
        postponed: `Olá! 😊 Reparei que o lembrete "${data.title}" ainda não foi concluído há ${data.days} dias. Quer que o adie para amanhã? Estou aqui para ajudar! 👍`,
        failed: `Ei! 🌟 A rotina "${data.name}" (${data.target}h/dia) tem ficado para trás. Está tudo bem? Posso ajudar a reorganizar? 💙`,
        completed: `Boa! 🎉 Concluíste "${data.title}"! Continua assim! 👏✨`
      },
      en: {
        postponed: `Hey! 😊 I noticed the reminder "${data.title}" hasn't been completed for ${data.days} days. Want me to postpone it? 👍`,
        failed: `Hi! 🌟 The routine "${data.name}" (${data.target}h/day) has been falling behind. Everything okay? 💙`,
        completed: `Great! 🎉 You completed "${data.title}"! Keep it up! 👏✨`
      }
    },
    'motivacional': {
      pt: {
        postponed: `Ei, campeão! 💪 O lembrete "${data.title}" está à espera há ${data.days} dias! Vamos reagendar e conquistar? 🎯🔥`,
        failed: `Hey! 🌟 A rotina "${data.name}" (${data.target}h) precisa de ti! Juntos vamos recuperar o ritmo! 💪✨`,
        completed: `INCRÍVEL! 🎉🔥 Concluíste "${data.title}"! És FANTÁSTICO! Continue neste ritmo campeão! 🏆💪`
      },
      en: {
        postponed: `Hey champion! 💪 The reminder "${data.title}" has been waiting ${data.days} days! Let's reschedule and conquer? 🎯🔥`,
        failed: `Hey! 🌟 Routine "${data.name}" (${data.target}h) needs you! Let's get back on track together! 💪✨`,
        completed: `AMAZING! 🎉🔥 You completed "${data.title}"! You're FANTASTIC! 🏆💪`
      }
    },
    'calma': {
      pt: {
        postponed: `Sem pressa 🌿 Percebi que "${data.title}" está pendente há ${data.days} dias. Quer ajustar quando tiver tempo? Faça no seu ritmo 💙`,
        failed: `Está tudo bem 🌸 A rotina "${data.name}" não foi cumprida, mas isso é normal. Quer reorganizar suavemente? 🌿`,
        completed: `Muito bem 🌸 Concluíste "${data.title}". Um passo de cada vez. Continue assim 💙`
      },
      en: {
        postponed: `No rush 🌿 I noticed "${data.title}" has been pending for ${data.days} days. Want to adjust when you have time? 💙`,
        failed: `It's okay 🌸 Routine "${data.name}" wasn't met, but that's normal. Want to reorganize gently? 🌿`,
        completed: `Well done 🌸 You completed "${data.title}". One step at a time 💙`
      }
    },
    'criativa': {
      pt: {
        postponed: `🎨 Criatividade alerta! O lembrete "${data.title}" está há ${data.days} dias à espera. Que tal transformá-lo numa aventura para amanhã? 🚀`,
        failed: `💡 A rotina "${data.name}" (${data.target}h) está a pedir uma reinvenção! Vamos pensar fora da caixa? 🌈✨`,
        completed: `🎉 BOOM! "${data.title}" concluído! És uma máquina de produtividade! 🚀🌟`
      },
      en: {
        postponed: `🎨 Creativity alert! Reminder "${data.title}" has been waiting ${data.days} days. How about turning it into tomorrow's adventure? 🚀`,
        failed: `💡 Routine "${data.name}" (${data.target}h) needs a reinvention! Let's think outside the box? 🌈✨`,
        completed: `🎉 BOOM! "${data.title}" completed! You're a productivity machine! 🚀🌟`
      }
    }
  };

  const lang = language === 'en' ? 'en' : 'pt';
  const messageType = type === 'postponed_reminder' ? 'postponed' : 
                      type === 'failed_routine' ? 'failed' : 'completed';
  
  return personalityMap[personality]?.[lang]?.[messageType] || 
         personalityMap['amigável'][lang][messageType];
}

async function sendChatMessage(
  supabase: any,
  userId: string,
  message: string,
  metadata: any
) {
  // Criar ou obter conversa "Samantha Assistant"
  let { data: conversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('user_id', userId)
    .eq('title', 'Samantha - Assistente')
    .single();

  if (!conversation) {
    const { data: newConv } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        title: 'Samantha - Assistente'
      })
      .select()
      .single();
    
    conversation = newConv;
  }

  // Inserir mensagem
  await supabase
    .from('messages')
    .insert({
      conversation_id: conversation.id,
      sender: 'ai',
      content: message,
      metadata: metadata
    });
}
