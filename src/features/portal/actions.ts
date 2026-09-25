"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";

import { hashPassword, verifyPassword } from "@/lib/crypto/password";
import { sendAppEmail } from "@/lib/email/send";
import { prisma } from "@/server/db/prisma";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-for-mvp-portal",
);

const RESET_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-for-mvp-portal-reset",
);

async function issuePortalSession(customerId: string, businessId: string) {
  const token = await new SignJWT({ customerId, businessId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set("portal_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
}

export async function loginPortalCustomerAction(
  businessSlug: string,
  email: string,
  password: string,
) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !password) {
    return { ok: false as const, error: "Email and password are required" };
  }

  const business = await prisma.business.findFirst({
    where: { slug: businessSlug, status: "ACTIVE" },
  });
  if (!business) return { ok: false as const, error: "Business not found" };

  const customer = await prisma.customer.findFirst({
    where: {
      businessId: business.id,
      email: normalizedEmail,
      status: "ACTIVE",
    },
  });

  if (!customer?.passwordHash) {
    return {
      ok: false as const,
      error: "Invalid email or password",
    };
  }

  const valid = verifyPassword(password, customer.passwordHash);
  if (!valid) {
    return { ok: false as const, error: "Invalid email or password" };
  }

  await issuePortalSession(customer.id, business.id);
  return { ok: true as const };
}

export async function logoutPortalCustomerAction(businessSlug: string) {
  const cookieStore = await cookies();
  cookieStore.delete("portal_token");
  redirect(`/portal/${businessSlug}`);
}

export async function getPortalSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("portal_token")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!payload.customerId || !payload.businessId) return null;

    const customer = await prisma.customer.findUnique({
      where: { id: payload.customerId as string },
      include: { business: true },
    });

    if (
      !customer ||
      customer.businessId !== payload.businessId ||
      customer.status !== "ACTIVE"
    ) {
      return null;
    }

    return { customer, business: customer.business };
  } catch {
    return null;
  }
}

export async function requestPortalPasswordResetAction(
  businessSlug: string,
  email: string,
) {
  const normalizedEmail = email.trim().toLowerCase();
  const business = await prisma.business.findFirst({
    where: { slug: businessSlug, status: "ACTIVE" },
  });
  // Always succeed from the client to avoid email enumeration
  if (!business || !normalizedEmail) {
    return { ok: true as const };
  }

  const customer = await prisma.customer.findFirst({
    where: {
      businessId: business.id,
      email: normalizedEmail,
      status: "ACTIVE",
    },
  });

  if (customer) {
    const resetToken = await new SignJWT({
      customerId: customer.id,
      businessId: business.id,
      purpose: "portal-reset",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(RESET_SECRET);

    const base =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
      process.env.BETTER_AUTH_URL?.replace(/\/$/, "") ||
      "http://localhost:3000";
    const url = `${base}/portal/${businessSlug}/reset-password?token=${encodeURIComponent(resetToken)}`;

    await sendAppEmail({
      to: normalizedEmail,
      subject: `Reset your ${business.name} portal password`,
      html: `<p>Hello ${customer.name},</p>
<p>Reset your customer portal password:</p>
<p><a href="${url}">${url}</a></p>
<p>This link expires in 1 hour. If you did not request this, ignore this email.</p>`,
      text: `Reset your portal password: ${url}`,
    });
  }

  return { ok: true as const };
}

export async function resetPortalPasswordAction(
  businessSlug: string,
  token: string,
  password: string,
) {
  if (!password || password.length < 8) {
    return {
      ok: false as const,
      error: "Password must be at least 8 characters",
    };
  }

  try {
    const { payload } = await jwtVerify(token, RESET_SECRET);
    if (
      payload.purpose !== "portal-reset" ||
      !payload.customerId ||
      !payload.businessId
    ) {
      return { ok: false as const, error: "Invalid or expired reset link" };
    }

    const business = await prisma.business.findFirst({
      where: { slug: businessSlug, id: payload.businessId as string },
    });
    if (!business) {
      return { ok: false as const, error: "Invalid or expired reset link" };
    }

    const customer = await prisma.customer.findFirst({
      where: {
        id: payload.customerId as string,
        businessId: business.id,
        status: "ACTIVE",
      },
    });
    if (!customer) {
      return { ok: false as const, error: "Invalid or expired reset link" };
    }

    await prisma.customer.update({
      where: { id: customer.id },
      data: { passwordHash: hashPassword(password) },
    });

    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Invalid or expired reset link" };
  }
}

/** Helpers used by portal nav gating */
export async function getPortalAccessFlags(customerId: string, businessId: string) {
  const [bookingsModule, activeMembership] = await Promise.all([
    prisma.businessModule.findFirst({
      where: {
        businessId,
        enabled: true,
        module: { key: "bookings" },
      },
      select: { id: true },
    }),
    prisma.membership.findFirst({
      where: { customerId, businessId, status: "ACTIVE" },
      select: { id: true },
    }),
  ]);

  return {
    canBookCourt: Boolean(bookingsModule && activeMembership),
    canBookPt: true,
  };
}
