import type { Metadata } from "next";
import { FarmaceuticeClient } from "@/app/medicamente/farmaceutice-client";
import { pageMetadata, seo } from "@/lib/seo";
import { breadcrumbJsonLd, collectionPageJsonLd, serializeJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata({
  title: seo.medicinesTitle,
  description: seo.medicinesDescription,
  path: "/medicamente",
  image: seo.medicinesImage,
  keywords: [
    "medicamente retrase",
    "medicamente retrase din România",
    "medicamente întrerupte",
    "discontinuități medicamente",
    "ANMDMR",
  ],
});

export default function FarmaceuticePage() {
  const jsonLd = [
    breadcrumbJsonLd([
      { name: "Acasă", path: "/" },
      { name: "Medicamente", path: "/medicamente" },
    ]),
    collectionPageJsonLd({
      name: seo.medicinesTitle,
      description: seo.medicinesDescription,
      path: "/medicamente",
    }),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <FarmaceuticeClient />
    </>
  );
}
