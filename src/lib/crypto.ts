import crypto from "crypto";

export function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function sha256Buffer(input: Uint8Array): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}
