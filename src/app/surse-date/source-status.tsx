"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Run = { id: string; sourceType: string; status: string; startedAt: string; finishedAt?: string | null; itemsFound: number; itemsInserted: number; itemsUpdated: number; error?: string | null };

export function SourceStatus() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/surse-date/stare", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Starea importurilor nu este disponibilă");
        const body = await response.json();
        setRuns(body.runs || []);
      })
      .catch((reason) => { if (reason.name !== "AbortError") setError(reason.message); });
    return () => controller.abort();
  }, []);
  if (error) return <Card><CardContent className="py-6 text-destructive">Starea importurilor nu poate fi încărcată: {error}</CardContent></Card>;
  return <div className="grid gap-4 md:grid-cols-3">{["ANM_NOMENCLATURE", "ANM_DISCONTINUITY", "ANSVSA"].map((source) => { const run = runs.find((item) => item.sourceType === source); return <Card key={source}><CardHeader><CardTitle className="text-base">{source.replaceAll("_", " ")}</CardTitle></CardHeader><CardContent className="space-y-1 text-sm">{run ? <><p><strong>{run.status}</strong></p><p>{new Date(run.startedAt).toLocaleString("ro-RO", { timeZone: "Europe/Bucharest" })}</p><p className="text-muted-foreground">{run.itemsFound} găsite · {run.itemsInserted} noi · {run.itemsUpdated} actualizate</p>{run.error && <p className="text-destructive">{run.error}</p>}</> : <p className="text-muted-foreground">Se încarcă…</p>}</CardContent></Card>; })}</div>;
}
