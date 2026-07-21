"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Medicine = {
  id: string;
  commercialName: string;
  dci?: string | null;
  concentration?: string | null;
  pharmaceuticalForm?: string | null;
  atcCode?: string | null;
  cimCode: string;
};

export function MedicineSearch() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initial = searchParams.get("q") || "";
  const [query, setQuery] = useState(initial);
  const [results, setResults] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initial.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      setError("");
      void fetch(`/api/cautare/medicamente?q=${encodeURIComponent(initial)}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          const failure = await response.json().catch(() => ({}));
          throw new Error(failure.error || "Căutarea nu a putut fi efectuată");
        }
        const body = await response.json();
        setResults(body.medicines || []);
      })
      .catch((reason) => { if (reason.name !== "AbortError") setError(reason.message); })
      .finally(() => setLoading(false));
    }, 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [initial]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (query.trim().length >= 2) router.push(`/medicamente/cautare?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <main className="container mx-auto max-w-5xl space-y-6 px-4 py-10">
      <div><h1 className="text-3xl font-bold">Caută în nomenclatorul medicamentelor</h1><p className="mt-2 text-muted-foreground">Acces public și gratuit la datele ANMDMR.</p></div>
      <form onSubmit={submit} className="flex gap-2"><Input aria-label="Căutare medicamente" placeholder="Denumire, DCI, CIM sau ATC" value={query} onChange={(event) => setQuery(event.target.value)} /><Button type="submit"><Search className="mr-2 h-4 w-4" />Caută</Button></form>
      {loading && <p>Se caută…</p>}{error && <p className="text-destructive">{error}</p>}
      {!loading && initial && !error && results.length === 0 && <Card><CardContent className="py-8 text-center text-muted-foreground">Nu s-au găsit rezultate.</CardContent></Card>}
      <div className="space-y-3">{results.map((medicine) => <Card key={medicine.id}><CardHeader><div className="flex justify-between gap-3"><div><CardTitle className="text-base">{medicine.commercialName}</CardTitle><p className="text-sm text-muted-foreground">{[medicine.dci, medicine.concentration, medicine.pharmaceuticalForm].filter(Boolean).join(" • ")}</p><p className="mt-1 text-xs text-muted-foreground">Cod CIM: {medicine.cimCode}</p></div><Badge variant="outline">{medicine.atcCode || "Fără ATC"}</Badge></div></CardHeader></Card>)}</div>
    </main>
  );
}
