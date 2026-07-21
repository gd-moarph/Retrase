import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SourceStatus } from "./source-status";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Surse și stare | Retrase.ro", description: "Sursele oficiale și starea importurilor Retrase.ro." };

const sources = [
  { title: "ANMDMR — Nomenclator medicamente", description: "Catalogul medicamentelor autorizate în România.", url: "https://nomenclator.anm.ro/medicamente" },
  { title: "ANMDMR — Discontinuități", description: "Notificările de întrerupere temporară sau permanentă.", url: "https://www.anm.ro/medicamente-de-uz-uman/autorizare-medicamente/notificari-discontinuitate-medicamente/" },
  { title: "ANSVSA — Produse retrase", description: "Notificări despre retragerea și rechemarea produselor.", url: "https://www.ansvsa.ro/informatii-pentru-public/produse-rechemateretrase/" },
];

export default function SourcesPage() {
  return <div className="flex min-h-screen flex-col"><SiteHeader/><main className="container mx-auto max-w-4xl flex-1 space-y-8 px-4 py-12"><div><h1 className="text-3xl font-bold">Surse oficiale și stare</h1><p className="mt-2 text-muted-foreground">Importurile sunt automate, verificabile și păstrează fiecare versiune distinctă a documentelor oficiale.</p></div><SourceStatus/><div className="grid gap-4 md:grid-cols-3">{sources.map((source) => <Card key={source.url}><CardHeader><CardTitle className="text-base">{source.title}</CardTitle><CardDescription>{source.description}</CardDescription></CardHeader><CardContent><a href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center text-sm text-primary hover:underline">Deschide sursa <ExternalLink className="ml-1 h-3 w-3"/></a></CardContent></Card>)}</div></main><SiteFooter/></div>;
}
