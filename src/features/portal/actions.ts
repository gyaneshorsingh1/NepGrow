"use server";

import { cookies } from "next/headers";
import { prisma } from "@/server/db/prisma";
import { SignJWT, jwtVerify } from "jose";

// Super simple MVP auth just for the portal scaffold
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret-for-mvp-portal");

export async function loginPortalCustomerAction(businessSlug: string, email: string) {
  const business = await prisma.business.findFirst({
    where: { slug: businessSlug },
  });

  if (!business) return { ok: false, error: "Business not found" };

  const customer = await prisma.customer.findFirst({
    where: { businessId: business.id, email },
  });

  if (!customer) {
    return { ok: false, error: "No customer found with that email. Please contact the business." };
  }

  // Create token
  const token = await new SignJWT({ customerId: customer.id, businessId: business.id })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set("portal_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  return { ok: true };
}

export async function logoutPortalCustomerAction() {
  const cookieStore = await cookies();
  cookieStore.delete("portal_token");
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

    if (!customer || customer.businessId !== payload.businessId) return null;

    return { customer, business: customer.business };
  } catch {
    return null;
  }
}
