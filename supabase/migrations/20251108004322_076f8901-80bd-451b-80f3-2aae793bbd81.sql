-- Fix search_path for security functions (with CASCADE)
DROP FUNCTION IF EXISTS public.create_timeline_event() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Recreate update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate timeline event function
CREATE OR REPLACE FUNCTION public.create_timeline_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_title TEXT;
  event_content TEXT;
  event_type_val TEXT;
  event_date_val TIMESTAMP WITH TIME ZONE;
  user_id_val UUID;
BEGIN
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

-- Recreate all triggers
CREATE TRIGGER notes_timeline_trigger
  AFTER INSERT ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.create_timeline_event();

CREATE TRIGGER reminders_timeline_trigger
  AFTER INSERT ON public.reminders
  FOR EACH ROW
  EXECUTE FUNCTION public.create_timeline_event();

CREATE TRIGGER mood_timeline_trigger
  AFTER INSERT ON public.mood_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.create_timeline_event();

CREATE TRIGGER conversations_timeline_trigger
  AFTER INSERT ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.create_timeline_event();

CREATE TRIGGER routines_timeline_trigger
  AFTER INSERT ON public.routines
  FOR EACH ROW
  EXECUTE FUNCTION public.create_timeline_event();

CREATE TRIGGER goals_timeline_trigger
  AFTER INSERT ON public.weekly_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.create_timeline_event();

-- Recreate update triggers for tables that had them
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_weekly_goals_updated_at
  BEFORE UPDATE ON public.weekly_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();