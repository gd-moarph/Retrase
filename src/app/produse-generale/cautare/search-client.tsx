"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Recall = { id: string; productName?: string | null; title?: string | null; brand?: string | null; retailer?: string | null; reason?: string | null };

export function ProductSearch() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initial = searchParams.get("q") || "";
  const [query, setQuery] = useState(initial);
  const [results, setResults] = useState<Recall[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initial.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      void fetch(`/api/cautare/produse-generale?q=${encodeURIComponent(initial)}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          const failure = await response.json().catch(() => ({}));
          throw new Error(failure.error || "Căutarea nu a putut fi efectuată");
        }
        const body = await response.json();
        setResults(body.recalls || []);
      })
      .catch((reason) => { if (reason.name !== "AbortError") setError(reason.message); })
      .finally(() => setLoading(false));
    }, 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [initial]);

  function submit(event: FormEvent) { event.preventDefault(); if (query.trim().length >= 2) router.push(`/produse-generale/cautare?q=${encodeURIComponent(query.trim())}`); }

  return <main className="container mx-auto max-w-5xl space-y-6 px-4 py-10"><div><h1 className="text-3xl font-bold">Caută produse retrase</h1><p className="mt-2 text-muted-foreground">Caută gratuit după produs, brand, retailer sau motiv.</p></div><form onSubmit={submit} className="flex gap-2"><Input aria-label="Căutare produse" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Produs, brand sau retailer"/><Button type="submit"><Search className="mr-2 h-4 w-4"/>Caută</Button></form>{loading && <p>Se caută…</p>}{error && <p className="text-destructive">{error}</p>}{!loading && initial && !error && !results.length && <Card><CardContent className="py-8 text-center text-muted-foreground">Nu s-au găsit rezultate.</CardContent></Card>}<div className="space-y-3">{results.map((recall) => <Card key={recall.id}><CardHeader><CardTitle className="text-base">{recall.productName || recall.title}</CardTitle><p className="text-sm text-muted-foreground">{[recall.brand, recall.retailer].filter(Boolean).join(" • ")}</p>{recall.reason && <p className="text-sm">{recall.reason}</p>}</CardHeader></Card>)}</div></main>;
}
