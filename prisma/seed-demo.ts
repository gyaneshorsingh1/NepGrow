/**
 * Demo seed: creates a sample sports center client after platform seed.
 * Run: npx tsx prisma/seed-demo.ts
 */
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";

const prisma = new PrismaClient();

async function ensureCredentialPassword(
  userId: string,
  password: string,
) {
  const hashed = await hashPassword(password);
  const account = await prisma.account.findFirst({
    where: { userId, providerId: "credential" },
  });
  // Better Auth requires credential accountId === user.id (not email)
  if (account) {
    await prisma.account.update({
      where: { id: account.id },
      data: { password: hashed, accountId: userId },
    });
  } else {
    await prisma.account.create({
      data: {
        userId,
        accountId: userId,
        providerId: "credential",
        password: hashed,
      },
    });
  }
}

async function ensureReceptionistForBusiness(businessId: string) {
  const receptionistTemplate = await prisma.role.findFirst({
    where: { isTemplate: true, key: "receptionist", businessId: null },
    include: { permissions: true },
  });
  if (!receptionistTemplate) return null;

  let role = await prisma.role.findFirst({
    where: { businessId, key: "receptionist" },
  });
  if (!role) {
    role = await prisma.role.create({
      data: {
        businessId,
        name: "Receptionist",
        key: "receptionist",
        isSystem: false,
        description: receptionistTemplate.description,
        permissions: {
          create: receptionistTemplate.permissions.map((p) => ({
            permissionId: p.permissionId,
          })),
        },
      },
    });
  }

  const email = "receptionist@abc-sports.local";
  const seedPassword = "password";
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: "ABC Receptionist",
        email,
        emailVerified: true,
      },
    });
  }
  await ensureCredentialPassword(user.id, seedPassword);

  const existingMembership = await prisma.businessMembership.findUnique({
    where: {
      userId_businessId: { userId: user.id, businessId },
    },
  });
  if (!existingMembership) {
    await prisma.businessMembership.create({
      data: {
        userId: user.id,
        businessId,
        status: "ACTIVE",
        roles: { create: [{ roleId: role.id }] },
      },
    });
  }

  return { email, seedPassword };
}

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

  const email = "owner@gmail.com";
  const seedPassword = "password";
  const legacyEmail = "owner@abc-sports.local";

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const legacy = await prisma.user.findUnique({ where: { email: legacyEmail } });
    if (legacy) {
      user = await prisma.user.update({
        where: { id: legacy.id },
        data: { email },
      });
    } else {
      user = await prisma.user.create({
        data: {
          name: "ABC Owner",
          email,
          emailVerified: true,
        },
      });
    }
  }
  await ensureCredentialPassword(user.id, seedPassword);

  const existing = await prisma.business.findFirst({
    where: { slug: "abc-sports-center" },
  });
  if (existing) {
    const receptionist = await ensureReceptionistForBusiness(existing.id);
    console.log("Demo business already exists:", existing.slug);
    console.log(`Owner login: ${email} / ${seedPassword}`);
    if (receptionist) {
      console.log(
        `Receptionist login: ${receptionist.email} / ${receptionist.seedPassword}`,
      );
    }
    return;
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
            hourlyRateCents: 1500,
          },
          {
            businessId: business.id,
            name: "Court 2",
            hourlyRateCents: 1500,
          },
        ],
      },
    },
  });

  const receptionist = await ensureReceptionistForBusiness(business.id);

  console.log("Demo client ready.");
  console.log("Business slug: abc-sports-center");
  console.log(`Owner login: ${email} / ${seedPassword}`);
  if (receptionist) {
    console.log(
      `Receptionist login: ${receptionist.email} / ${receptionist.seedPassword}`,
    );
  }
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
