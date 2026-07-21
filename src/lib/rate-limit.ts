import crypto from "node:crypto";
import { prisma } from "@/lib/db";

export type RateLimitPolicy = {
  name: string;
  limit: number;
  windowSeconds: number;
};

export async function checkRateLimit(request: Request, policy: RateLimitPolicy) {
  const now = Date.now();
  const windowMs = policy.windowSeconds * 1_000;
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs);
  const ip = clientIp(request);
  const salt = process.env.RATE_LIMIT_SALT;
  if (!salt) throw new Error("RATE_LIMIT_SALT is required");
  const ipHash = crypto.createHmac("sha256", salt).update(ip).digest("hex");
  const key = `${policy.name}:${ipHash}`;

  const entry = await prisma.rateLimit.upsert({
    where: { key_windowStart: { key, windowStart } },
    create: { key, windowStart, count: 1 },
    update: { count: { increment: 1 } },
    select: { count: true },
  });

  if (Math.random() < 0.01) {
    void prisma.rateLimit.deleteMany({
      where: { createdAt: { lt: new Date(now - 2 * 24 * 60 * 60 * 1_000) } },
    }).catch(() => undefined);
  }

  return {
    allowed: entry.count <= policy.limit,
    retryAfter: Math.max(1, Math.ceil((windowStart.getTime() + windowMs - now) / 1_000)),
  };
}

export function tooManyRequests(retryAfter: number): Response {
  return Response.json(
    { error: "Prea multe cereri. Încearcă din nou mai târziu." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}

function clientIp(request: Request): string {
  if (process.env.RAILWAY_ENVIRONMENT_ID) {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();
    return request.headers.get("x-real-ip") || "unknown";
  }
  return "local";
}
