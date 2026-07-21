import type { Metadata } from "next";

const siteUrl = "https://retrase.ro";
const siteName = "Retrase.ro";
const defaultImage = "/retrase.png";

export const seo = {
  siteUrl,
  siteName,
  defaultImage,
  medicinesImage: "/medicamente.png",
  productsImage: "/produsegenerale.png",
  homeTitle: "Retrase.ro - Medicamente și Produse retrase din România",
  medicinesTitle: "Retrase.ro - Medicamente retrase din România",
  productsTitle: "Retrase.ro - Produse Generale retrase din România",
  homeDescription:
    "Retrase.ro monitorizează medicamente retrase, produse retrase și notificări oficiale publicate de ANMDMR și ANSVSA în România.",
  medicinesDescription:
    "Lista actualizată cu medicamente retrase, medicamente întrerupte și notificări de discontinuitate publicate de ANMDMR în România.",
  productsDescription:
    "Lista actualizată cu produse generale retrase sau rechemate din România, publicate de ANSVSA: alimente, produse pentru copii, hrană animale și altele.",
};

export function pageMetadata({
  title,
  description,
  path,
  keywords,
  image = defaultImage,
}: {
  title: string;
  description: string;
  path: string;
  keywords: string[];
  image?: string;
}): Metadata {
  const url = new URL(path, siteUrl).toString();
  const imageUrl = new URL(image, siteUrl).toString();

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName,
      type: "website",
      locale: "ro_RO",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}
