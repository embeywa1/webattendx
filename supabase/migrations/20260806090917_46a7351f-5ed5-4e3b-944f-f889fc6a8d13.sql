CREATE TYPE public.app_role AS ENUM ('faculty', 'student');
CREATE TYPE public.session_status AS ENUM ('open', 'closed');
CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'late');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  roll_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_code TEXT NOT NULL,
  course_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classes TO authenticated;
GRANT ALL ON public.classes TO service_role;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.class_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  roll_number TEXT NOT NULL,
  full_name TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (class_id, roll_number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_students TO authenticated;
GRANT ALL ON public.class_students TO service_role;
ALTER TABLE public.class_students ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status public.session_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (class_id, session_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_sessions TO authenticated;
GRANT ALL ON public.attendance_sessions TO service_role;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  class_student_id UUID NOT NULL REFERENCES public.class_students(id) ON DELETE CASCADE,
  status public.attendance_status NOT NULL DEFAULT 'absent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, class_student_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_records TO authenticated;
GRANT ALL ON public.attendance_records TO service_role;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Helper functions (security definer, bypass RLS to avoid recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.owns_class(_class_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.classes c WHERE c.id = _class_id AND c.teacher_id = auth.uid())
$$;

CREATE OR REPLACE FUNCTION public.is_on_roster(_class_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_students cs
    WHERE cs.class_id = _class_id
      AND (cs.student_id = auth.uid()
           OR cs.roll_number = (SELECT p.roll_number FROM public.profiles p WHERE p.id = auth.uid()))
  )
$$;

CREATE OR REPLACE FUNCTION public.is_my_roster_row(_class_student_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_students cs
    WHERE cs.id = _class_student_id
      AND (cs.student_id = auth.uid()
           OR cs.roll_number = (SELECT p.roll_number FROM public.profiles p WHERE p.id = auth.uid()))
  )
$$;

CREATE OR REPLACE FUNCTION public.session_class(_session_id UUID)
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT class_id FROM public.attendance_sessions WHERE id = _session_id
$$;

CREATE OR REPLACE FUNCTION public.roster_class(_class_student_id UUID)
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT class_id FROM public.class_students WHERE id = _class_student_id
$$;

-- Policies: profiles
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Policies: user_roles (read-only from the client)
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Policies: classes
CREATE POLICY "Faculty manage own classes" ON public.classes FOR ALL TO authenticated
  USING (teacher_id = auth.uid()) WITH CHECK (teacher_id = auth.uid() AND public.has_role(auth.uid(), 'faculty'));
CREATE POLICY "Students read enrolled classes" ON public.classes FOR SELECT TO authenticated
  USING (public.is_on_roster(id));

-- Policies: class_students
CREATE POLICY "Faculty manage roster of own classes" ON public.class_students FOR ALL TO authenticated
  USING (public.owns_class(class_id)) WITH CHECK (public.owns_class(class_id));
CREATE POLICY "Students read rosters of their classes" ON public.class_students FOR SELECT TO authenticated
  USING (public.is_on_roster(class_id));

-- Policies: attendance_sessions
CREATE POLICY "Faculty manage sessions of own classes" ON public.attendance_sessions FOR ALL TO authenticated
  USING (public.owns_class(class_id)) WITH CHECK (public.owns_class(class_id));
CREATE POLICY "Students read sessions of their classes" ON public.attendance_sessions FOR SELECT TO authenticated
  USING (public.is_on_roster(class_id));

-- Policies: attendance_records
CREATE POLICY "Faculty manage records of own classes" ON public.attendance_records FOR ALL TO authenticated
  USING (public.owns_class(public.session_class(session_id)))
  WITH CHECK (public.owns_class(public.session_class(session_id)) AND public.owns_class(public.roster_class(class_student_id)));
CREATE POLICY "Students read own records" ON public.attendance_records FOR SELECT TO authenticated
  USING (public.is_my_roster_row(class_student_id));

-- New user handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _role public.app_role;
  _roll TEXT;
BEGIN
  _role := COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'role', ''), 'student')::public.app_role;
  _roll := NULLIF(NEW.raw_user_meta_data ->> 'roll_number', '');

  INSERT INTO public.profiles (id, email, full_name, roll_number)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''), _roll)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  IF _roll IS NOT NULL THEN
    UPDATE public.class_students SET student_id = NEW.id
    WHERE roll_number = _roll AND student_id IS NULL;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE INDEX idx_class_students_class ON public.class_students(class_id);
CREATE INDEX idx_class_students_roll ON public.class_students(roll_number);
CREATE INDEX idx_sessions_class ON public.attendance_sessions(class_id);
CREATE INDEX idx_records_session ON public.attendance_records(session_id);