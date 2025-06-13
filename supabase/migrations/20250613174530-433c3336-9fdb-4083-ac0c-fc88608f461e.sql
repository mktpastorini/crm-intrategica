
-- Enable Row Level Security on all public tables
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get current user role (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- RLS Policies for leads table
CREATE POLICY "Users can view their own leads or all if admin/supervisor" 
  ON public.leads 
  FOR SELECT 
  USING (
    responsible_id = auth.uid() OR 
    public.get_current_user_role() IN ('admin', 'supervisor')
  );

CREATE POLICY "Users can create leads" 
  ON public.leads 
  FOR INSERT 
  WITH CHECK (responsible_id = auth.uid());

CREATE POLICY "Users can update their own leads or all if admin/supervisor" 
  ON public.leads 
  FOR UPDATE 
  USING (
    responsible_id = auth.uid() OR 
    public.get_current_user_role() IN ('admin', 'supervisor')
  );

CREATE POLICY "Only admins and supervisors can delete leads" 
  ON public.leads 
  FOR DELETE 
  USING (public.get_current_user_role() IN ('admin', 'supervisor'));

-- RLS Policies for events table
CREATE POLICY "Users can view their own events or all if admin/supervisor" 
  ON public.events 
  FOR SELECT 
  USING (
    responsible_id = auth.uid() OR 
    public.get_current_user_role() IN ('admin', 'supervisor')
  );

CREATE POLICY "Users can create events" 
  ON public.events 
  FOR INSERT 
  WITH CHECK (responsible_id = auth.uid());

CREATE POLICY "Users can update their own events or all if admin/supervisor" 
  ON public.events 
  FOR UPDATE 
  USING (
    responsible_id = auth.uid() OR 
    public.get_current_user_role() IN ('admin', 'supervisor')
  );

CREATE POLICY "Only admins and supervisors can delete events" 
  ON public.events 
  FOR DELETE 
  USING (public.get_current_user_role() IN ('admin', 'supervisor'));

-- RLS Policies for profiles table
CREATE POLICY "Users can view their own profile or all if admin" 
  ON public.profiles 
  FOR SELECT 
  USING (
    id = auth.uid() OR 
    public.get_current_user_role() = 'admin'
  );

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (id = auth.uid());

CREATE POLICY "Only admins can create profiles" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (public.get_current_user_role() = 'admin');

CREATE POLICY "Only admins can delete profiles" 
  ON public.profiles 
  FOR DELETE 
  USING (public.get_current_user_role() = 'admin');

-- RLS Policies for daily_activities table
CREATE POLICY "Only admins and supervisors can access daily activities" 
  ON public.daily_activities 
  FOR ALL 
  USING (public.get_current_user_role() IN ('admin', 'supervisor'));

-- RLS Policies for system_settings table
CREATE POLICY "Only admins can access system settings" 
  ON public.system_settings 
  FOR ALL 
  USING (public.get_current_user_role() = 'admin');

-- Add constraints for data integrity
ALTER TABLE public.leads 
  ALTER COLUMN responsible_id SET NOT NULL;

ALTER TABLE public.events 
  ALTER COLUMN responsible_id SET NOT NULL;

-- Add foreign key constraints with proper user isolation
ALTER TABLE public.leads 
  ADD CONSTRAINT fk_leads_responsible 
  FOREIGN KEY (responsible_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.events 
  ADD CONSTRAINT fk_events_responsible 
  FOREIGN KEY (responsible_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.events 
  ADD CONSTRAINT fk_events_lead 
  FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;
