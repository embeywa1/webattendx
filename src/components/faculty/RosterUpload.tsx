import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Users, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, ErrorBanner, LoadingPanel, Spinner } from "@/components/ui/state";
import { addRosterEntries, listRoster, parseRosterText, removeRosterEntry } from "@/services/classApi";

export function RosterUpload({ classId }: { classId: string }) {
  const queryClient = useQueryClient();
  const [rollNumber, setRollNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [bulk, setBulk] = useState("");

  const rosterQuery = useQuery({
    queryKey: ["roster", classId],
    queryFn: () => listRoster(classId),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["roster", classId] });

  const addOne = useMutation({
    mutationFn: () => addRosterEntries(classId, [{ rollNumber, fullName }]),
    onSuccess: () => {
      setRollNumber("");
      setFullName("");
      void invalidate();
    },
  });

  const addBulk = useMutation({
    mutationFn: () => addRosterEntries(classId, parseRosterText(bulk)),
    onSuccess: () => {
      setBulk("");
      void invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => removeRosterEntry(id),
    onSuccess: () => void invalidate(),
  });

  const parsedCount = parseRosterText(bulk).length;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <form
          className="panel space-y-4 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (rollNumber.trim() && !addOne.isPending) addOne.mutate();
          }}
        >
          <p className="terminal-label">Add single student</p>
          <div className="space-y-2">
            <Label htmlFor="roll">Roll number</Label>
            <Input
              id="roll"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
              placeholder="CS21-0042"
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Full name (optional)</Label>
            <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ada Lovelace" />
          </div>
          <Button type="submit" disabled={!rollNumber.trim() || addOne.isPending} className="gap-2 font-mono">
            {addOne.isPending ? <Spinner className="text-primary-foreground" /> : <UserPlus className="size-4" />}
            Add to roster
          </Button>
          {addOne.error ? <ErrorBanner error={addOne.error} title="Could not add student" /> : null}
        </form>

        <form
          className="panel space-y-4 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (parsedCount > 0 && !addBulk.isPending) addBulk.mutate();
          }}
        >
          <p className="terminal-label">Bulk import · CSV</p>
          <Textarea
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
            rows={7}
            placeholder={"CS21-0001, Ada Lovelace\nCS21-0002, Alan Turing"}
            className="font-mono text-xs"
          />
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-muted-foreground">{parsedCount} row(s) detected</span>
            <Button type="submit" variant="secondary" disabled={parsedCount === 0 || addBulk.isPending} className="font-mono">
              {addBulk.isPending ? <Spinner /> : null}
              Import
            </Button>
          </div>
          {addBulk.error ? <ErrorBanner error={addBulk.error} title="Import failed" /> : null}
        </form>
      </div>

      <div className="panel p-5">
        <div className="flex items-center gap-2 pb-4">
          <Users className="size-4 text-primary" />
          <p className="terminal-label">Roster · {rosterQuery.data?.length ?? 0}</p>
        </div>
        {rosterQuery.isPending ? <LoadingPanel label="Loading roster" /> : null}
        {rosterQuery.error ? <ErrorBanner error={rosterQuery.error} /> : null}
        {rosterQuery.data?.length === 0 ? <EmptyState title="Roster is empty" hint="Add roll numbers to begin." /> : null}
        <ul className="divide-y divide-border">
          {rosterQuery.data?.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="font-mono text-sm text-primary">{row.roll_number}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {row.full_name || "Unnamed"}
                  {row.student_id ? " · linked" : " · not linked"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remove ${row.roll_number}`}
                className="text-muted-foreground hover:text-destructive"
                onClick={() => remove.mutate(row.id)}
              >
                <X className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
        {remove.error ? <ErrorBanner error={remove.error} title="Could not remove student" /> : null}
      </div>
    </div>
  );
}