import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = { title: "Confidențialitate | Retrase.ro", description: "Cum protejează Retrase.ro datele vizitatorilor." };

export default function PrivacyPage() {
  return <div className="flex min-h-screen flex-col"><SiteHeader/><main className="container mx-auto max-w-3xl flex-1 space-y-8 px-4 py-12"><h1 className="text-3xl font-bold">Confidențialitate</h1><section><h2 className="mb-3 text-xl font-semibold">Fără conturi sau profilare</h2><p className="text-muted-foreground">Retrase.ro nu oferă conturi și nu colectează nume, adrese de e-mail, parole, preferințe sau date de plată. Nu folosim publicitate, Google Analytics sau cookie-uri de urmărire.</p></section><section><h2 className="mb-3 text-xl font-semibold">Protecția serviciului</h2><p className="text-muted-foreground">Pentru limitarea abuzului, adresa IP transmisă de infrastructura Railway este transformată într-un identificator criptografic temporar. Nu stocăm adresa IP în clar, iar înregistrările de limitare sunt șterse automat.</p></section><section><h2 className="mb-3 text-xl font-semibold">Date publice</h2><p className="text-muted-foreground">Conținutul aplicației provine din surse publice ANMDMR și ANSVSA. Jurnalele tehnice Railway pot conține date operaționale conform politicilor Railway.</p></section></main><SiteFooter/></div>;
}
