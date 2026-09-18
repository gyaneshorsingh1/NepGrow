import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";

const prisma = new PrismaClient();

const PERMISSIONS = [
  ["dashboard.view", "View Dashboard", "dashboard"],
  ["customers.view", "View Customers", "customers"],
  ["customers.create", "Create Customers", "customers"],
  ["customers.update", "Update Customers", "customers"],
  ["customers.delete", "Delete Customers", "customers"],
  ["bookings.view", "View Bookings", "bookings"],
  ["bookings.create", "Create Bookings", "bookings"],
  ["bookings.update", "Update Bookings", "bookings"],
  ["bookings.cancel", "Cancel Bookings", "bookings"],
  ["bookings.delete", "Delete Bookings", "bookings"],
  ["facilities.view", "View Facilities", "facilities"],
  ["facilities.create", "Create Facilities", "facilities"],
  ["facilities.update", "Update Facilities", "facilities"],
  ["facilities.delete", "Delete Facilities", "facilities"],
  ["courts.view", "View Courts", "courts"],
  ["courts.create", "Create Courts", "courts"],
  ["courts.update", "Update Courts", "courts"],
  ["courts.delete", "Delete Courts", "courts"],
  ["memberships.view", "View Memberships", "memberships"],
  ["memberships.create", "Create Memberships", "memberships"],
  ["memberships.update", "Update Memberships", "memberships"],
  ["memberships.delete", "Delete Memberships", "memberships"],
  ["payments.view", "View Payments", "payments"],
  ["payments.create", "Create Payments", "payments"],
  ["payments.update", "Update Payments", "payments"],
  ["payments.refund", "Refund Payments", "payments"],
  ["staff.view", "View Staff", "staff"],
  ["staff.create", "Create Staff", "staff"],
  ["staff.update", "Update Staff", "staff"],
  ["staff.delete", "Delete Staff", "staff"],
  ["reports.view", "View Reports", "reports"],
  ["settings.view", "View Settings", "settings"],
  ["settings.update", "Update Settings", "settings"],
  ["users.view", "View Users", "users"],
  ["users.create", "Create Users", "users"],
  ["users.update", "Update Users", "users"],
  ["roles.view", "View Roles", "roles"],
  ["roles.create", "Create Roles", "roles"],
  ["roles.update", "Update Roles", "roles"],
  ["roles.delete", "Delete Roles", "roles"],
] as const;

async function main() {
  for (const [key, name, moduleKey] of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key },
      update: { name, moduleKey },
      create: { key, name, moduleKey },
    });
  }

  const sports = await prisma.businessCategory.upsert({
    where: { slug: "sports-center" },
    update: {},
    create: {
      name: "Sports Center",
      slug: "sports-center",
      domainSlug: "sports",
      description: "Sports centers, courts, and facility booking",
    },
  });

  const coreModules = [
    { key: "dashboard", name: "Dashboard", isCore: true, href: "/app", sortOrder: 0, icon: "LayoutDashboard" },
    { key: "customers", name: "Customers", isCore: true, href: "/app/customers", sortOrder: 10, icon: "Users" },
    { key: "staff", name: "Staff", isCore: true, href: "/app/staff", sortOrder: 20, icon: "UserCog" },
    { key: "payments", name: "Payments", isCore: true, href: "/app/payments", sortOrder: 30, icon: "Wallet" },
    { key: "reports", name: "Reports", isCore: true, href: "/app/reports", sortOrder: 40, icon: "BarChart3" },
    { key: "settings", name: "Settings", isCore: true, href: "/app/settings", sortOrder: 100, icon: "Settings" },
  ];

  const sportsModules = [
    { key: "facilities", name: "Facilities", href: "/app/facilities", sortOrder: 11, icon: "Building2" },
    { key: "courts", name: "Courts", href: "/app/courts", sortOrder: 12, icon: "Grid3x3" },
    { key: "bookings", name: "Bookings", href: "/app/bookings", sortOrder: 13, icon: "Calendar" },
    { key: "memberships", name: "Memberships", href: "/app/memberships", sortOrder: 14, icon: "BadgeCheck" },
  ];

  for (const m of coreModules) {
    await prisma.module.upsert({
      where: { key: m.key },
      update: m,
      create: m,
    });
  }

  for (const m of sportsModules) {
    await prisma.module.upsert({
      where: { key: m.key },
      update: { ...m, categoryId: sports.id },
      create: { ...m, categoryId: sports.id },
    });
  }

  const allModules = await prisma.module.findMany();
  const byKey = Object.fromEntries(allModules.map((m) => [m.key, m]));

  const starterKeys = ["dashboard", "customers", "facilities", "courts", "bookings", "payments", "settings"];
  const proKeys = [...starterKeys, "memberships", "staff", "reports"];

  const starter = await prisma.plan.upsert({
    where: { categoryId_key: { categoryId: sports.id, key: "sports-starter" } },
    update: {},
    create: {
      name: "Sports Starter",
      key: "sports-starter",
      categoryId: sports.id,
      description: "Essential booking tools",
      priceCents: 499900,
      limits: { maxCustomers: 500, maxFacilities: 3, maxStaff: 5 },
      sortOrder: 1,
    },
  });

  const pro = await prisma.plan.upsert({
    where: { categoryId_key: { categoryId: sports.id, key: "sports-pro" } },
    update: {},
    create: {
      name: "Sports Pro",
      key: "sports-pro",
      categoryId: sports.id,
      description: "Full sports center suite",
      priceCents: 999900,
      limits: { maxCustomers: 5000, maxFacilities: 20, maxStaff: 50 },
      sortOrder: 2,
    },
  });

  await prisma.planModule.deleteMany({ where: { planId: starter.id } });
  await prisma.planModule.createMany({
    data: starterKeys
      .filter((k) => byKey[k])
      .map((k) => ({ planId: starter.id, moduleId: byKey[k].id })),
  });

  await prisma.planModule.deleteMany({ where: { planId: pro.id } });
  await prisma.planModule.createMany({
    data: proKeys
      .filter((k) => byKey[k])
      .map((k) => ({ planId: pro.id, moduleId: byKey[k].id })),
  });

  const allPermissions = await prisma.permission.findMany();
  const ownerPerms = allPermissions.map((p) => p.id);
  const receptionistKeys = [
    "dashboard.view",
    "customers.view",
    "customers.create",
    "customers.update",
    "bookings.view",
    "bookings.create",
    "bookings.update",
    "facilities.view",
    "courts.view",
    "payments.view",
  ];

  await prisma.role.deleteMany({ where: { isTemplate: true, businessId: null } });

  await prisma.role.create({
    data: {
      name: "Owner",
      key: "owner",
      isTemplate: true,
      isSystem: true,
      description: "Full business access",
      permissions: {
        create: ownerPerms.map((permissionId) => ({ permissionId })),
      },
    },
  });

  await prisma.role.create({
    data: {
      name: "Receptionist",
      key: "receptionist",
      isTemplate: true,
      isSystem: true,
      description: "Front desk operations",
      permissions: {
        create: allPermissions
          .filter((p) => receptionistKeys.includes(p.key))
          .map((p) => ({ permissionId: p.id })),
      },
    },
  });

  await prisma.websiteTemplate.upsert({
    where: { key: "sports-default" },
    update: {},
    create: {
      key: "sports-default",
      name: "Sports Default",
      categoryId: sports.id,
      description: "Default sports center website",
    },
  });

  await prisma.websiteTheme.upsert({
    where: { key: "green-field" },
    update: {},
    create: {
      key: "green-field",
      name: "Green Field",
      tokens: {
        primary: "#1f7a4d",
        accent: "#0f766e",
        background: "#f8fafc",
      },
    },
  });

  const adminEmail = "admin@nepgrow.com";
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const hashed = await hashPassword("Admin123!");
    await prisma.user.create({
      data: {
        name: "NepGrow Admin",
        email: adminEmail,
        emailVerified: true,
        isPlatformAdmin: true,
        status: "ACTIVE",
        accounts: {
          create: {
            accountId: adminEmail,
            providerId: "credential",
            password: hashed,
          },
        },
      },
    });
  } else if (!existingAdmin.isPlatformAdmin) {
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: { isPlatformAdmin: true },
    });
  }

  console.log("Seed complete.");
  console.log("Super Admin: admin@nepgrow.com / Admin123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
