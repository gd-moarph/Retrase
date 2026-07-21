import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Retrase.ro - Disclaimer medical și legal",
  description:
    "Disclaimer medical și legal pentru informațiile publicate pe Retrase.ro despre medicamente și produse retrase.",
  path: "/disclaimer",
  keywords: ["disclaimer Retrase.ro", "disclaimer medical", "disclaimer produse retrase"],
});

export default function DisclaimerPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-bold text-primary">
            Retrase.ro
          </Link>
        </div>
      </header>
      <main className="container mx-auto max-w-3xl flex-1 px-4 py-12">
        <h1 className="mb-6 text-3xl font-bold">Disclaimer medical și legal</h1>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">Informații generale</h2>
          <p className="mb-4 text-muted-foreground">
            Retrase.ro este o platformă de informare care agregă date din surse publice oficiale. Platforma nu oferă
            recomandări medicale, diagnostice, tratamente sau alternative terapeutice.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">Medicamente - limitarea răspunderii</h2>
          <p className="mb-4 text-muted-foreground">
            Informațiile din secțiunea Medicamente sunt preluate automat din nomenclatorul ANMDMR și din notificările de
            discontinuitate publicate de ANMDMR. Retrase.ro nu garantează actualitatea, completitudinea sau corectitudinea
            datelor preluate. Verifică întotdeauna informațiile pe site-ul oficial ANMDMR. Pentru orice decizie medicală,
            consultă medicul sau farmacistul.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">Produse Generale - limitarea răspunderii</h2>
          <p className="mb-4 text-muted-foreground">
            Informațiile despre produse retrase sau rechemate sunt preluate automat de pe site-ul ANSVSA. Retrase.ro nu
            poate garanta că toate notificările sunt captate în timp real sau că datele extrase sunt complete. Verifică
            întotdeauna sursa oficială ANSVSA.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">Fără răspundere medicală</h2>
          <p className="mb-4 text-muted-foreground">
            Utilizarea acestei platforme nu substituie consultul medical profesionist. Nu utiliza informațiile de pe
            această platformă pentru a lua decizii medicale fără a consulta un medic sau farmacist.
          </p>
        </section>
      </main>
    </div>
  );
}
