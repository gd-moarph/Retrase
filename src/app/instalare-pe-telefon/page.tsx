import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Retrase.ro - Instalare pe telefon",
  description: "Instrucțiuni pentru adăugarea Retrase.ro pe ecranul principal al telefonului.",
  path: "/instalare-pe-telefon",
  keywords: ["instalare Retrase.ro", "Retrase.ro pe telefon"],
});

export default function InstalarePeTelefonPage() {
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
        <h1 className="mb-6 text-3xl font-bold">Instalare pe telefon</h1>
        <p className="mb-8 text-muted-foreground">
          Adaugă Retrase.ro pe ecranul telefonului pentru acces rapid la informațiile publice.
        </p>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>iPhone (Safari)</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
                <li>Deschide Retrase.ro în Safari</li>
                <li>Apasă butonul de share, iconița cu săgeată din partea de jos a ecranului</li>
                <li>Derulează în jos și selectează “Adaugă la ecranul principal”</li>
                <li>Apasă “Adaugă” în dreapta sus</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Android (Chrome)</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
                <li>Deschide Retrase.ro în Chrome</li>
                <li>Apasă butonul de meniu, cele trei puncte din dreapta sus</li>
                <li>Selectează “Adaugă la ecranul principal”</li>
                <li>Apasă “Adaugă”</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
