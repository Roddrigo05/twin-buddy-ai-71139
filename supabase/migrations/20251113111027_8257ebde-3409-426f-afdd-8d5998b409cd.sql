-- Create email_notifications table
CREATE TABLE IF NOT EXISTS public.email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('reminder', 'note')),
  reference_id UUID NOT NULL,
  last_check TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own email notifications"
  ON public.email_notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email notifications"
  ON public.email_notifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email notifications"
  ON public.email_notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Add email preferences to user_settings
ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS email_reminders_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS email_notes_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS reminder_email_delay_hours INTEGER DEFAULT 24,
ADD COLUMN IF NOT EXISTS note_email_delay_days INTEGER DEFAULT 7;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_email_notifications_user_id ON public.email_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_type ON public.email_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_email_notifications_sent ON public.email_notifications(email_sent);