import type { MetadataRoute } from "next";
import { seo } from "@/lib/seo";

type SitemapRoute = {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  lastModified: Date;
  images?: string[];
};

const staticContentUpdatedAt = new Date("2026-06-20T00:00:00.000Z");

function absoluteUrl(path: string) {
  return new URL(path, seo.siteUrl).toString();
}

export default function sitemap(): MetadataRoute.Sitemap {
  const listingUpdatedAt = new Date();
  const routes: SitemapRoute[] = [
    {
      path: "/",
      priority: 1,
      changeFrequency: "daily",
      lastModified: listingUpdatedAt,
      images: [absoluteUrl(seo.defaultImage)],
    },
    {
      path: "/medicamente",
      priority: 0.9,
      changeFrequency: "daily",
      lastModified: listingUpdatedAt,
      images: [absoluteUrl(seo.medicinesImage)],
    },
    {
      path: "/produse-generale",
      priority: 0.9,
      changeFrequency: "daily",
      lastModified: listingUpdatedAt,
      images: [absoluteUrl(seo.productsImage)],
    },
    { path: "/medicamente/cautare", priority: 0.8, changeFrequency: "daily", lastModified: listingUpdatedAt },
    { path: "/produse-generale/cautare", priority: 0.8, changeFrequency: "daily", lastModified: listingUpdatedAt },
    { path: "/surse-date", priority: 0.6, changeFrequency: "monthly", lastModified: staticContentUpdatedAt },
    { path: "/instalare-pe-telefon", priority: 0.4, changeFrequency: "yearly", lastModified: staticContentUpdatedAt },
    { path: "/termeni", priority: 0.2, changeFrequency: "yearly", lastModified: staticContentUpdatedAt },
    { path: "/confidentialitate", priority: 0.2, changeFrequency: "yearly", lastModified: staticContentUpdatedAt },
    { path: "/disclaimer", priority: 0.2, changeFrequency: "yearly", lastModified: staticContentUpdatedAt },
  ];

  return routes.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: route.lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
    images: route.images,
  }));
}
