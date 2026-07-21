import { Suspense } from "react";
import { ProductSearch } from "./search-client";

export default function ProductSearchPage() {
  return <Suspense fallback={<p className="container py-12">Se încarcă…</p>}><ProductSearch /></Suspense>;
}
