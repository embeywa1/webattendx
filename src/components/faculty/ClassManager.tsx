import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState, ErrorBanner, LoadingPanel, Spinner } from "@/components/ui/state";
import { useAuth } from "@/contexts/AuthContext";
import { createClass, deleteClass, listClasses } from "@/services/classApi";

export function ClassManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");

  const classesQuery = useQuery({ queryKey: ["classes"], queryFn: listClasses });

  const create = useMutation({
    mutationFn: () =>
      createClass({ teacherId: user!.id, courseCode, courseName }),
    onSuccess: () => {
      setCourseCode("");
      setCourseName("");
      void queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteClass(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["classes"] }),
  });

  const valid = courseCode.trim().length >= 2 && courseName.trim().length >= 3;

  return (
    <div className="space-y-6">
      <form
        className="panel cyber-surface grid gap-4 p-5 sm:grid-cols-[160px_1fr_auto] sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid && !create.isPending) create.mutate();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="courseCode">Course code</Label>
          <Input
            id="courseCode"
            value={courseCode}
            onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
            placeholder="CS101"
            className="font-mono"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="courseName">Course name</Label>
          <Input
            id="courseName"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            placeholder="Introduction to Computing"
          />
        </div>
        <Button type="submit" disabled={!valid || create.isPending} className="gap-2 font-mono">
          {create.isPending ? <Spinner className="text-primary-foreground" /> : <Plus className="size-4" />}
          Create class
        </Button>
      </form>

      {create.error ? <ErrorBanner error={create.error} title="Could not create class" /> : null}
      {remove.error ? <ErrorBanner error={remove.error} title="Could not delete class" /> : null}

      {classesQuery.isPending ? <LoadingPanel label="Loading classes" /> : null}
      {classesQuery.error ? <ErrorBanner error={classesQuery.error} /> : null}

      {classesQuery.data?.length === 0 ? (
        <EmptyState title="No classes yet" hint="Create your first course above to start tracking attendance." />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {classesQuery.data?.map((klass) => (
          <div key={klass.id} className="panel group flex flex-col justify-between gap-4 p-5 transition-shadow hover:glow-primary">
            <div>
              <p className="font-mono text-xs tracking-widest text-primary uppercase">
                {klass.course_code}
              </p>
              <h3 className="mt-1 text-base font-semibold text-foreground">{klass.course_name}</h3>
            </div>
            <div className="flex items-center justify-between">
              <Link
                to="/faculty/classes/$classId"
                params={{ classId: klass.id }}
                className="font-mono text-xs tracking-widest text-primary uppercase hover:underline"
              >
                Open →
              </Link>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete ${klass.course_code}`}
                className="text-muted-foreground hover:text-destructive"
                onClick={() => remove.mutate(klass.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}