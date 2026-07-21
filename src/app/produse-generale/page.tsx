import type { Metadata } from "next";
import { ProduseGeneraleClient } from "@/app/produse-generale/produse-generale-client";
import { pageMetadata, seo } from "@/lib/seo";
import { breadcrumbJsonLd, collectionPageJsonLd, serializeJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata({
  title: seo.productsTitle,
  description: seo.productsDescription,
  path: "/produse-generale",
  image: seo.productsImage,
  keywords: [
    "produse retrase",
    "produse retrase din România",
    "produse generale retrase",
    "produse rechemate",
    "alerte ANSVSA",
    "ANSVSA",
  ],
});

export default function ProduseGeneralePage() {
  const jsonLd = [
    breadcrumbJsonLd([
      { name: "Acasă", path: "/" },
      { name: "Produse Generale", path: "/produse-generale" },
    ]),
    collectionPageJsonLd({
      name: seo.productsTitle,
      description: seo.productsDescription,
      path: "/produse-generale",
    }),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <ProduseGeneraleClient />
    </>
  );
}
