import type { Metadata } from "next";
import Link from "next/link";
import { AnimatedProductColumns } from "@/components/animated-product-columns";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { pageMetadata, seo } from "@/lib/seo";
import { organizationJsonLd, serializeJsonLd, websiteJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata({
  title: seo.homeTitle,
  description: seo.homeDescription,
  path: "/",
  keywords: [
    "medicamente retrase",
    "produse retrase",
    "medicamente retrase din România",
    "produse retrase din România",
    "alerte ANMDMR",
    "alerte ANSVSA",
  ],
});

export default function HomePage() {
  const jsonLd = [organizationJsonLd(), websiteJsonLd()];

  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <SiteHeader />

      <main className="flex-1">
        <section className="container mx-auto px-4 py-16 text-center md:py-24">
          <h1 className="mb-4 text-3xl font-bold tracking-tight md:text-5xl">
            Medicamente și produse retrase din România
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Retrase.ro monitorizează medicamente retrase și produse retrase, folosind informații oficiale publicate de
            ANMDMR și ANSVSA. Platforma este open source, gratuită și nu necesită cont.
          </p>
          <div className="mb-12 flex flex-wrap justify-center gap-3">
            <Badge variant="secondary" className="text-sm">
              ANMDMR
            </Badge>
            <Badge variant="secondary" className="text-sm">
              ANSVSA
            </Badge>
          </div>
          <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
            <Card className="text-left">
              <CardHeader>
                <CardTitle className="text-xl">Medicamente</CardTitle>
                <CardDescription>
                  Monitorizează medicamente retrase sau medicamente întrerupte și notificări de discontinuitate
                  publicate de Agenția ANMDMR.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link className={buttonVariants({ className: "w-full" })} href="/medicamente">Vezi discontinuități</Link>
              </CardContent>
            </Card>
            <Card className="text-left">
              <CardHeader>
                <CardTitle className="text-xl">Produse Generale</CardTitle>
                <CardDescription>
                  Urmărește produse retrase sau rechemate publicate de ANSVSA: alimente, produse pentru copii, hrană
                  animale și altele.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link className={buttonVariants({ className: "w-full" })} href="/produse-generale">Vezi produse retrase</Link>
              </CardContent>
            </Card>
          </div>
        </section>

        <AnimatedProductColumns />
      </main>

      <SiteFooter />
    </div>
  );
}
