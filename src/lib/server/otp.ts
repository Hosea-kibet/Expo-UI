import crypto from "node:crypto";

const OTP_LENGTH = 6;

function getOtpSecret() {
  const secret = process.env.OTP_HASH_SECRET ?? process.env.NEXTAUTH_SECRET;

  if (!secret) {
    throw new Error("OTP_HASH_SECRET or NEXTAUTH_SECRET must be configured.");
  }

  return secret;
}

export function generateOtpCode() {
  return String(crypto.randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, "0");
}

export function hashOtp(code: string, salt?: string) {
  const otpSalt = salt ?? crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .createHmac("sha256", `${getOtpSecret()}:${otpSalt}`)
    .update(code)
    .digest("hex");

  return { hash, salt: otpSalt };
}

export function verifyOtpHash(code: string, hash: string, salt: string) {
  const hashedAttempt = hashOtp(code, salt).hash;
  return crypto.timingSafeEqual(Buffer.from(hashedAttempt), Buffer.from(hash));
}
