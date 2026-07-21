import { Suspense } from "react";
import { MedicineSearch } from "./search-client";

export default function MedicineSearchPage() {
  return <Suspense fallback={<p className="container py-12">Se încarcă…</p>}><MedicineSearch /></Suspense>;
}
