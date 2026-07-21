import { seo } from "@/lib/seo";

type BreadcrumbItem = {
  name: string;
  path: string;
};

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/[<>&]/g, (character) => {
    if (character === "<") return "\\u003c";
    if (character === ">") return "\\u003e";
    return "\\u0026";
  });
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: seo.siteName,
    url: seo.siteUrl,
    logo: new URL("/retrase-logo.svg", seo.siteUrl).toString(),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: seo.siteName,
    url: seo.siteUrl,
    description: seo.homeDescription,
    inLanguage: "ro-RO",
    potentialAction: {
      "@type": "SearchAction",
      target: `${seo.siteUrl}/produse-generale?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: new URL(item.path, seo.siteUrl).toString(),
    })),
  };
}

export function collectionPageJsonLd({
  name,
  description,
  path,
}: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: new URL(path, seo.siteUrl).toString(),
    inLanguage: "ro-RO",
    isPartOf: {
      "@type": "WebSite",
      name: seo.siteName,
      url: seo.siteUrl,
    },
  };
}
