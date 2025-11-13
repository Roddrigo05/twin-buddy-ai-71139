import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.77.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log("Starting email reminder check...");

    // Get all users with email notifications enabled
    const { data: users, error: usersError } = await supabase
      .from("user_settings")
      .select("user_id, email_reminders_enabled, email_notes_enabled, reminder_email_delay_hours, note_email_delay_days");

    if (usersError) {
      console.error("Error fetching users:", usersError);
      throw usersError;
    }

    console.log(`Found ${users?.length || 0} users to check`);
    let emailsSent = 0;

    for (const userSettings of users || []) {
      const userId = userSettings.user_id;

      // Get user profile for email
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, name")
        .eq("id", userId)
        .single();

      if (!profile?.email) {
        console.log(`No email found for user ${userId}`);
        continue;
      }

      const userName = profile.name || "Utilizador";

      // Check reminders if enabled
      if (userSettings.email_reminders_enabled) {
        const delayHours = userSettings.reminder_email_delay_hours || 24;
        const cutoffTime = new Date(Date.now() - delayHours * 60 * 60 * 1000).toISOString();

        const { data: reminders } = await supabase
          .from("reminders")
          .select("id, title, datetime, category")
          .eq("user_id", userId)
          .eq("completed", false)
          .lt("datetime", cutoffTime);

        if (reminders && reminders.length > 0) {
          for (const reminder of reminders) {
            // Check if email already sent
            const { data: existingNotification } = await supabase
              .from("email_notifications")
              .select("id")
              .eq("user_id", userId)
              .eq("notification_type", "reminder")
              .eq("reference_id", reminder.id)
              .eq("email_sent", true)
              .single();

            if (existingNotification) {
              console.log(`Email already sent for reminder ${reminder.id}`);
              continue;
            }

            // Send email
            const formattedDate = new Date(reminder.datetime).toLocaleString("pt-PT", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            const htmlContent = `
              <!DOCTYPE html>
              <html>
                <head>
                  <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
                    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                    .reminder-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
                    .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
                    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1>🔔 Lembrete Pendente</h1>
                    </div>
                    <div class="content">
                      <p>Olá <strong>${userName}</strong>,</p>
                      <p>O seu assistente AI Twin está aqui para te lembrar:</p>
                      
                      <div class="reminder-box">
                        <h2 style="margin-top: 0;">📌 ${reminder.title}</h2>
                        <p><strong>📅 Esperado para:</strong> ${formattedDate}</p>
                        <p><strong>🏷️ Categoria:</strong> ${reminder.category || "Outros"}</p>
                      </div>
                      
                      <p>Ainda não concluiu esta tarefa. Que tal dar um check agora?</p>
                      
                      <a href="${supabaseUrl.replace('.supabase.co', '.lovable.app')}/reminders" class="button">
                        Ver no AI Twin
                      </a>
                      
                      <div class="footer">
                        <p>Recebeu este email porque tem lembretes ativos no AI Twin.</p>
                      </div>
                    </div>
                  </div>
                </body>
              </html>
            `;

            try {
              await resend.emails.send({
                from: "AI Twin <onboarding@resend.dev>",
                to: [profile.email],
                subject: `🔔 Lembrete Pendente: ${reminder.title}`,
                html: htmlContent,
              });

              // Mark as sent
              await supabase.from("email_notifications").insert({
                user_id: userId,
                notification_type: "reminder",
                reference_id: reminder.id,
                email_sent: true,
                email_sent_at: new Date().toISOString(),
              });

              emailsSent++;
              console.log(`Email sent for reminder ${reminder.id} to ${profile.email}`);
            } catch (emailError) {
              console.error(`Failed to send email for reminder ${reminder.id}:`, emailError);
            }
          }
        }
      }

      // Check notes if enabled
      if (userSettings.email_notes_enabled) {
        const delayDays = userSettings.note_email_delay_days || 7;
        const cutoffTime = new Date(Date.now() - delayDays * 24 * 60 * 60 * 1000).toISOString();

        const { data: notes } = await supabase
          .from("notes")
          .select("id, title, content, tags, created_at")
          .eq("user_id", userId)
          .lt("updated_at", cutoffTime);

        if (notes && notes.length > 0) {
          for (const note of notes) {
            // Check if email already sent
            const { data: existingNotification } = await supabase
              .from("email_notifications")
              .select("id")
              .eq("user_id", userId)
              .eq("notification_type", "note")
              .eq("reference_id", note.id)
              .eq("email_sent", true)
              .single();

            if (existingNotification) {
              console.log(`Email already sent for note ${note.id}`);
              continue;
            }

            // Send email
            const daysSince = Math.floor((Date.now() - new Date(note.created_at).getTime()) / (1000 * 60 * 60 * 24));
            const preview = note.content ? note.content.substring(0, 200) + "..." : "Sem conteúdo";

            const htmlContent = `
              <!DOCTYPE html>
              <html>
                <head>
                  <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
                    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                    .note-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981; }
                    .tags { margin-top: 10px; }
                    .tag { display: inline-block; background: #e5e7eb; padding: 4px 12px; border-radius: 12px; font-size: 12px; margin-right: 5px; }
                    .button { display: inline-block; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
                    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1>📝 Nota Pendente</h1>
                    </div>
                    <div class="content">
                      <p>Olá <strong>${userName}</strong>,</p>
                      <p>Encontramos uma nota que pode precisar de atenção:</p>
                      
                      <div class="note-box">
                        <h2 style="margin-top: 0;">📝 ${note.title}</h2>
                        <p><strong>📅 Criada há:</strong> ${daysSince} dias</p>
                        ${note.tags && note.tags.length > 0 ? `
                          <div class="tags">
                            <strong>🏷️ Tags:</strong> ${note.tags.map((tag: string) => `<span class="tag">${tag}</span>`).join("")}
                          </div>
                        ` : ""}
                        <p style="margin-top: 15px;"><strong>Conteúdo:</strong></p>
                        <p style="color: #666;">${preview}</p>
                      </div>
                      
                      <p>Quer rever ou atualizar esta nota?</p>
                      
                      <a href="${supabaseUrl.replace('.supabase.co', '.lovable.app')}/notes" class="button">
                        Abrir Nota
                      </a>
                      
                      <div class="footer">
                        <p>Recebeu este email porque tem notas ativas no AI Twin.</p>
                      </div>
                    </div>
                  </div>
                </body>
              </html>
            `;

            try {
              await resend.emails.send({
                from: "AI Twin <onboarding@resend.dev>",
                to: [profile.email],
                subject: `📝 Nota Pendente: ${note.title}`,
                html: htmlContent,
              });

              // Mark as sent
              await supabase.from("email_notifications").insert({
                user_id: userId,
                notification_type: "note",
                reference_id: note.id,
                email_sent: true,
                email_sent_at: new Date().toISOString(),
              });

              emailsSent++;
              console.log(`Email sent for note ${note.id} to ${profile.email}`);
            } catch (emailError) {
              console.error(`Failed to send email for note ${note.id}:`, emailError);
            }
          }
        }
      }
    }

    console.log(`Email reminder check completed. Sent ${emailsSent} emails.`);

    return new Response(
      JSON.stringify({ success: true, emailsSent }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in send-reminder-email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
