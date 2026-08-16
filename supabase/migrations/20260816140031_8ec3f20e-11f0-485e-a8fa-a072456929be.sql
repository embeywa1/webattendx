-- Replace helper functions that leak class identifiers to any signed-in user
-- with caller-scoped boolean predicates.

CREATE OR REPLACE FUNCTION public.owns_session(_session_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.attendance_sessions s
    JOIN public.classes c ON c.id = s.class_id
    WHERE s.id = _session_id AND c.teacher_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION public.owns_roster_row(_class_student_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_students cs
    JOIN public.classes c ON c.id = cs.class_id
    WHERE cs.id = _class_student_id AND c.teacher_id = auth.uid()
  )
$$;

REVOKE ALL ON FUNCTION public.owns_session(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.owns_roster_row(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owns_session(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.owns_roster_row(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Faculty manage records of own classes" ON public.attendance_records;
CREATE POLICY "Faculty manage records of own classes"
ON public.attendance_records FOR ALL TO authenticated
USING (public.owns_session(session_id))
WITH CHECK (public.owns_session(session_id) AND public.owns_roster_row(class_student_id));

DROP FUNCTION IF EXISTS public.roster_class(uuid);
DROP FUNCTION IF EXISTS public.session_class(uuid);

-- Restrict remaining SECURITY DEFINER helpers to the roles that need them.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.owns_class(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_on_roster(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_my_roster_row(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.owns_class(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_on_roster(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_my_roster_row(uuid) TO authenticated, service_role;