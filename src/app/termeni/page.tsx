import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = { title: "Termeni de utilizare | Retrase.ro", description: "Termenii de utilizare pentru platforma publică Retrase.ro." };

export default function TermsPage() {
  return <div className="flex min-h-screen flex-col"><SiteHeader/><main className="container mx-auto max-w-3xl flex-1 space-y-8 px-4 py-12"><h1 className="text-3xl font-bold">Termeni de utilizare</h1><section><h2 className="mb-3 text-xl font-semibold">Acces public și gratuit</h2><p className="text-muted-foreground">Retrase.ro poate fi folosit fără cont, abonament sau plată. Limitele tehnice rezonabile protejează disponibilitatea serviciului pentru toți vizitatorii.</p></section><section><h2 className="mb-3 text-xl font-semibold">Surse și responsabilitate</h2><p className="text-muted-foreground">Datele sunt preluate automat din surse oficiale ANMDMR și ANSVSA și pot conține întârzieri sau erori existente în documentele originale. Verifică întotdeauna sursa oficială. Platforma nu oferă consultanță medicală, juridică sau comercială.</p></section><section><h2 className="mb-3 text-xl font-semibold">Cod sursă</h2><p className="text-muted-foreground">Codul aplicației este distribuit sub licența GNU Affero General Public License, versiunea 3.</p></section></main><SiteFooter/></div>;
}
