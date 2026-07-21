import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "newest";

  const where: Prisma.MedicineDiscontinuityWhereInput = { isPresentInLatest: true };
  if (search) {
    where.OR = [
      { commercialName: { contains: search, mode: "insensitive" } },
      { dci: { contains: search, mode: "insensitive" } },
      { authorizationHolder: { contains: search, mode: "insensitive" } },
    ];
  }

  const orderBy: Prisma.MedicineDiscontinuityOrderByWithRelationInput = sort === "oldest"
    ? { firstSeenAt: "asc" }
    : { firstSeenAt: "desc" };

  const [items, total] = await Promise.all([
    prisma.medicineDiscontinuity.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        commercialName: true,
        dci: true,
        authorizationHolder: true,
        notificationType: true,
        addressDate: true,
        pharmaceuticalForm: true,
        concentration: true,
        holderCountry: true,
        estimatedResumeDateText: true,
        firstSeenAt: true,
      },
    }),
    prisma.medicineDiscontinuity.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
}
