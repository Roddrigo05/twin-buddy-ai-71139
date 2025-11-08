-- 1. Atualizar tabela reminders com novos campos
ALTER TABLE public.reminders
ADD COLUMN IF NOT EXISTS postponed_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_checked_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS notified_at timestamp with time zone;

-- 2. Criar tabela routine_streak_tracker
CREATE TABLE IF NOT EXISTS public.routine_streak_tracker (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  routine_id uuid NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  date date NOT NULL,
  target_met boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, routine_id, date)
);

-- Enable RLS
ALTER TABLE public.routine_streak_tracker ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own routine streaks"
ON public.routine_streak_tracker FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own routine streaks"
ON public.routine_streak_tracker FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own routine streaks"
ON public.routine_streak_tracker FOR UPDATE
USING (auth.uid() = user_id);

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_reminders_completed_datetime 
ON public.reminders(completed, datetime) 
WHERE completed = false;

CREATE INDEX IF NOT EXISTS idx_routine_logs_user_date 
ON public.routine_logs(user_id, date);

CREATE INDEX IF NOT EXISTS idx_routine_streak_user_routine_date
ON public.routine_streak_tracker(user_id, routine_id, date);