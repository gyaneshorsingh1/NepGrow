/**
 * Demo seed: creates a sample sports center client after platform seed.
 * Run: npx tsx prisma/seed-demo.ts
 */
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";

const prisma = new PrismaClient();

async function main() {
  const category = await prisma.businessCategory.findUnique({
    where: { slug: "sports-center" },
  });
  const plan = await prisma.plan.findFirst({
    where: { key: "sports-pro" },
    include: { planModules: true },
  });
  const template = await prisma.websiteTemplate.findUnique({
    where: { key: "sports-default" },
  });
  const theme = await prisma.websiteTheme.findFirst();
  const ownerTemplate = await prisma.role.findFirst({
    where: { isTemplate: true, key: "owner", businessId: null },
    include: { permissions: true },
  });

  if (!category || !plan || !template || !ownerTemplate) {
    throw new Error("Run npm run db:seed first");
  }

  const email = "owner@abc-sports.local";
  const existing = await prisma.business.findFirst({
    where: { slug: "abc-sports-center" },
  });
  if (existing) {
    console.log("Demo business already exists:", existing.slug);
    return;
  }

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const password = await hashPassword("Owner123!");
    user = await prisma.user.create({
      data: {
        name: "ABC Owner",
        email,
        emailVerified: true,
        accounts: {
          create: {
            accountId: email,
            providerId: "credential",
            password,
          },
        },
      },
    });
  }

  const business = await prisma.business.create({
    data: {
      name: "ABC Sports Center",
      slug: "abc-sports-center",
      email: "hello@abc-sports.local",
      phone: "+977-9800000000",
      address: "Kathmandu, Nepal",
      description: "Premier multi-sport facility",
      categoryId: category.id,
      status: "ACTIVE",
    },
  });

  const ownerRole = await prisma.role.create({
    data: {
      businessId: business.id,
      name: "Owner",
      key: "owner",
      isSystem: true,
      permissions: {
        create: ownerTemplate.permissions.map((p) => ({
          permissionId: p.permissionId,
        })),
      },
    },
  });

  await prisma.businessMembership.create({
    data: {
      userId: user.id,
      businessId: business.id,
      roles: { create: [{ roleId: ownerRole.id }] },
    },
  });

  await prisma.subscription.create({
    data: {
      businessId: business.id,
      planId: plan.id,
      status: "ACTIVE",
    },
  });

  await prisma.businessModule.createMany({
    data: plan.planModules.map((pm) => ({
      businessId: business.id,
      moduleId: pm.moduleId,
      enabled: true,
      source: "PLAN",
    })),
  });

  await prisma.website.create({
    data: {
      businessId: business.id,
      templateId: template.id,
      themeId: theme?.id,
      seoTitle: "ABC Sports Center",
      seoDescription: "Book courts and memberships at ABC Sports Center",
      content: {
        heroHeadline: "ABC Sports Center",
        heroSubheadline: "Courts, coaching, and community in one place.",
        about: "ABC Sports Center is a multi-sport facility in Kathmandu.",
        contactEmail: "hello@abc-sports.local",
        contactPhone: "+977-9800000000",
        address: "Kathmandu, Nepal",
      },
    },
  });

  const facility = await prisma.facility.create({
    data: {
      businessId: business.id,
      name: "Main Complex",
      sport: "Tennis",
      description: "Outdoor and indoor courts",
      courts: {
        create: [
          {
            businessId: business.id,
            name: "Court 1",
            hourlyRateCents: 150000,
          },
          {
            businessId: business.id,
            name: "Court 2",
            hourlyRateCents: 150000,
          },
        ],
      },
    },
  });

  console.log("Demo client ready.");
  console.log("Business slug: abc-sports-center");
  console.log("Owner login: owner@abc-sports.local / Owner123!");
  console.log("Public site: /sites/sports/abc-sports-center");
  console.log("Facility:", facility.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
