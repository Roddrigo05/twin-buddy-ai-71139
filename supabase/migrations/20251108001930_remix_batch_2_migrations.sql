
-- Migration: 20251030205318

-- Migration: 20251030202709

-- Migration: 20251030194108

-- Migration: 20251029231354
-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Nova Conversa',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can view their own conversations"
  ON public.conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON public.conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
  ON public.conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'ai')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Messages policies
CREATE POLICY "Users can view messages from their conversations"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their conversations"
  ON public.messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages from their conversations"
  ON public.messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- Create notes table
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notes
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Notes policies
CREATE POLICY "Users can view their own notes"
  ON public.notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notes"
  ON public.notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
  ON public.notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
  ON public.notes FOR DELETE
  USING (auth.uid() = user_id);

-- Create reminders table
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on reminders
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- Reminders policies
CREATE POLICY "Users can view their own reminders"
  ON public.reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reminders"
  ON public.reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders"
  ON public.reminders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders"
  ON public.reminders FOR DELETE
  USING (auth.uid() = user_id);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  language TEXT NOT NULL DEFAULT 'pt' CHECK (language IN ('pt', 'en', 'es')),
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- User settings policies
CREATE POLICY "Users can view their own settings"
  ON public.user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON public.user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON public.user_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
  
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Migration: 20251030084913
-- Add AI personality fields to user_settings
ALTER TABLE public.user_settings
ADD COLUMN about_me TEXT,
ADD COLUMN ai_personality TEXT NOT NULL DEFAULT 'amigável',
ADD COLUMN ai_response_detail TEXT NOT NULL DEFAULT 'moderado';

-- Add organization fields to notes
ALTER TABLE public.notes
ADD COLUMN tags TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN color TEXT DEFAULT '#10B981',
ADD COLUMN is_favorite BOOLEAN NOT NULL DEFAULT false;

-- Create daily_summaries table
CREATE TABLE public.daily_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  summary_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own summaries"
ON public.daily_summaries
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own summaries"
ON public.daily_summaries
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own summaries"
ON public.daily_summaries
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own summaries"
ON public.daily_summaries
FOR DELETE
USING (auth.uid() = user_id);


-- Migration: 20251030194351
-- Adicionar novas colunas à tabela user_settings para preferências de interação
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS typing_speed TEXT DEFAULT 'normal' CHECK (typing_speed IN ('slow', 'normal', 'fast')),
ADD COLUMN IF NOT EXISTS daily_summary_enabled BOOLEAN DEFAULT true;


-- Migration: 20251030204511
-- FASE 1: Estrutura de Base de Dados

-- 1.1 Mood Journal (Diário Emocional)
CREATE TABLE public.mood_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mood TEXT NOT NULL CHECK (mood IN ('feliz', 'triste', 'ansioso', 'calmo', 'energizado', 'cansado', 'motivado', 'estressado')),
  intensity INTEGER NOT NULL CHECK (intensity >= 1 AND intensity <= 5),
  notes TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for mood_entries
ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own mood entries"
ON public.mood_entries FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own mood entries"
ON public.mood_entries FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mood entries"
ON public.mood_entries FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mood entries"
ON public.mood_entries FOR DELETE
USING (auth.uid() = user_id);

-- 1.2 Rotina Inteligente
CREATE TABLE public.routines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_hours NUMERIC NOT NULL CHECK (target_hours > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for routines
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own routines"
ON public.routines FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own routines"
ON public.routines FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own routines"
ON public.routines FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own routines"
ON public.routines FOR DELETE
USING (auth.uid() = user_id);

-- Routine logs
CREATE TABLE public.routine_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  routine_id UUID NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hours_completed NUMERIC NOT NULL CHECK (hours_completed >= 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for routine_logs
ALTER TABLE public.routine_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own routine logs"
ON public.routine_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own routine logs"
ON public.routine_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own routine logs"
ON public.routine_logs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own routine logs"
ON public.routine_logs FOR DELETE
USING (auth.uid() = user_id);

-- 1.3 Objetivos Semanais
CREATE TABLE public.weekly_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_value NUMERIC NOT NULL CHECK (target_value > 0),
  current_value NUMERIC NOT NULL DEFAULT 0 CHECK (current_value >= 0),
  unit TEXT NOT NULL,
  week_start_date DATE NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  category TEXT NOT NULL DEFAULT 'pessoal',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for weekly_goals
ALTER TABLE public.weekly_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own weekly goals"
ON public.weekly_goals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own weekly goals"
ON public.weekly_goals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weekly goals"
ON public.weekly_goals FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weekly goals"
ON public.weekly_goals FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at on weekly_goals
CREATE TRIGGER update_weekly_goals_updated_at
BEFORE UPDATE ON public.weekly_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 1.4 Linha do Tempo (Timeline)
CREATE TABLE public.timeline_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('note', 'reminder', 'message', 'mood', 'routine', 'goal')),
  reference_id UUID,
  title TEXT NOT NULL,
  content TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for timeline_events
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own timeline events"
ON public.timeline_events FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own timeline events"
ON public.timeline_events FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own timeline events"
ON public.timeline_events FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own timeline events"
ON public.timeline_events FOR DELETE
USING (auth.uid() = user_id);

-- Create index for better performance on timeline queries
CREATE INDEX idx_timeline_events_user_date ON public.timeline_events(user_id, event_date DESC);

-- 1.5 Atualização de Tabelas Existentes - Reminders
ALTER TABLE public.reminders ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::text[];
ALTER TABLE public.reminders ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'outros';


-- Migration: 20251102074710
-- Create function to add timeline event
CREATE OR REPLACE FUNCTION public.create_timeline_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  event_title TEXT;
  event_content TEXT;
  event_type_val TEXT;
  event_date_val TIMESTAMP WITH TIME ZONE;
  user_id_val UUID;
BEGIN
  -- Determine event type and extract data based on table
  CASE TG_TABLE_NAME
    WHEN 'notes' THEN
      event_type_val := 'note';
      event_title := NEW.title;
      event_content := LEFT(NEW.content, 200);
      event_date_val := NEW.created_at;
      user_id_val := NEW.user_id;
      
    WHEN 'reminders' THEN
      event_type_val := 'reminder';
      event_title := NEW.title;
      event_content := NULL;
      event_date_val := NEW.created_at;
      user_id_val := NEW.user_id;
      
    WHEN 'mood_entries' THEN
      event_type_val := 'mood';
      event_title := 'Registo de Humor: ' || NEW.mood;
      event_content := NEW.notes;
      event_date_val := NEW.created_at;
      user_id_val := NEW.user_id;
      
    WHEN 'conversations' THEN
      event_type_val := 'message';
      event_title := NEW.title;
      event_content := NULL;
      event_date_val := NEW.created_at;
      user_id_val := NEW.user_id;
      
    WHEN 'routines' THEN
      event_type_val := 'routine';
      event_title := 'Rotina: ' || NEW.name;
      event_content := 'Meta: ' || NEW.target_hours || ' horas';
      event_date_val := NEW.created_at;
      user_id_val := NEW.user_id;
      
    WHEN 'weekly_goals' THEN
      event_type_val := 'goal';
      event_title := NEW.title;
      event_content := NEW.description;
      event_date_val := NEW.created_at;
      user_id_val := NEW.user_id;
      
    ELSE
      RETURN NEW;
  END CASE;

  -- Insert into timeline_events
  INSERT INTO public.timeline_events (
    user_id,
    event_type,
    title,
    content,
    event_date,
    reference_id
  ) VALUES (
    user_id_val,
    event_type_val,
    event_title,
    event_content,
    event_date_val,
    NEW.id
  );

  RETURN NEW;
END;
$$;

-- Create triggers for each table
DROP TRIGGER IF EXISTS notes_timeline_trigger ON public.notes;
CREATE TRIGGER notes_timeline_trigger
  AFTER INSERT ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.create_timeline_event();

DROP TRIGGER IF EXISTS reminders_timeline_trigger ON public.reminders;
CREATE TRIGGER reminders_timeline_trigger
  AFTER INSERT ON public.reminders
  FOR EACH ROW
  EXECUTE FUNCTION public.create_timeline_event();

DROP TRIGGER IF EXISTS mood_timeline_trigger ON public.mood_entries;
CREATE TRIGGER mood_timeline_trigger
  AFTER INSERT ON public.mood_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.create_timeline_event();

DROP TRIGGER IF EXISTS conversations_timeline_trigger ON public.conversations;
CREATE TRIGGER conversations_timeline_trigger
  AFTER INSERT ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.create_timeline_event();

DROP TRIGGER IF EXISTS routines_timeline_trigger ON public.routines;
CREATE TRIGGER routines_timeline_trigger
  AFTER INSERT ON public.routines
  FOR EACH ROW
  EXECUTE FUNCTION public.create_timeline_event();

DROP TRIGGER IF EXISTS goals_timeline_trigger ON public.weekly_goals;
CREATE TRIGGER goals_timeline_trigger
  AFTER INSERT ON public.weekly_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.create_timeline_event();
