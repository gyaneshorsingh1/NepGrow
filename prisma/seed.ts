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
  ["memberships.assign", "Assign Memberships", "memberships"],
  ["memberships.cancel", "Cancel Memberships", "memberships"],
  ["payments.view", "View Payments", "payments"],
  ["payments.create", "Create Payments", "payments"],
  ["payments.update", "Update Payments", "payments"],
  ["payments.refund", "Refund Payments", "payments"],
  ["accounting.view", "View Accounting", "accounting"],
  ["accounting.create", "Create Accounting Entries", "accounting"],
  ["accounting.update", "Update Accounting Entries", "accounting"],
  ["accounting.delete", "Delete Accounting Entries", "accounting"],
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
  ["users.disable", "Disable Users", "users"],
  ["roles.view", "View Roles", "roles"],
  ["roles.create", "Create Roles", "roles"],
  ["roles.update", "Update Roles", "roles"],
  ["roles.delete", "Delete Roles", "roles"],
  ["permissions.view", "View Permissions", "permissions"],
  ["permissions.manage", "Manage Permissions", "permissions"],
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
    update: {
      name: "Sports Facility & Recreation",
      description: "Sports facilities, courts, turfs, and recreation centers",
    },
    create: {
      name: "Sports Facility & Recreation",
      slug: "sports-center",
      domainSlug: "sports",
      description: "Sports facilities, courts, turfs, and recreation centers",
    },
  });

  const categorySeeds = [
    {
      slug: "wellness-spa",
      name: "Wellness & Spa",
      domainSlug: "spa",
      description: "Spas, saunas, therapy centers, and wellness retreats",
    },
    {
      slug: "fitness-gym",
      name: "Fitness Gym",
      domainSlug: "fitness",
      description: "Gyms, personal training studios, and crossfit boxes",
    },
    {
      slug: "restaurant-cafe",
      name: "Restaurant & Cafe",
      domainSlug: "restaurant",
      description: "Restaurants, cafes, bakeries, and food outlets",
    },
    {
      slug: "education-training",
      name: "Education & Training",
      domainSlug: "education",
      description: "Coaching centers, academies, and training institutes",
    },
    {
      slug: "beauty-salon",
      name: "Beauty Salon",
      domainSlug: "beauty",
      description: "Salons, barbershops, and nail studios",
    },
  ];

  for (const cat of categorySeeds) {
    await prisma.businessCategory.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        domainSlug: cat.domainSlug,
        description: cat.description,
        status: "ACTIVE",
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        domainSlug: cat.domainSlug,
        description: cat.description,
        status: "ACTIVE",
      },
    });
  }

  const sportsSubcategories = [
    { name: "Football Turf", slug: "football-turf" },
    { name: "Futsal", slug: "futsal" },
    { name: "Tennis", slug: "tennis" },
    { name: "Badminton", slug: "badminton" },
    { name: "Gym / Fitness", slug: "gym-fitness" },
    { name: "Multi-sport", slug: "multi-sport" },
  ];

  for (const sub of sportsSubcategories) {
    await prisma.businessSubcategory.upsert({
      where: {
        categoryId_slug: { categoryId: sports.id, slug: sub.slug },
      },
      update: { name: sub.name, status: "ACTIVE" },
      create: {
        categoryId: sports.id,
        name: sub.name,
        slug: sub.slug,
        status: "ACTIVE",
      },
    });
  }

  const coreModules = [
    { key: "dashboard", name: "Dashboard", isCore: true, href: "/app", sortOrder: 0, icon: "LayoutDashboard" },
    { key: "customers", name: "Customers", isCore: true, href: "/app/customers", sortOrder: 10, icon: "Users" },
    { key: "staff", name: "Staff", isCore: true, href: "/app/staff", sortOrder: 20, icon: "UserCog" },
    { key: "payments", name: "Payments", isCore: true, href: "/app/payments", sortOrder: 30, icon: "Wallet" },
    { key: "accounting", name: "Accounting", isCore: true, href: "/app/accounting", sortOrder: 35, icon: "BookOpen" },
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

  const starterKeys = ["dashboard", "customers", "facilities", "courts", "bookings", "payments", "accounting", "settings"];
  const proKeys = [...starterKeys, "memberships", "staff", "reports"];

  const starter = await prisma.plan.upsert({
    where: { categoryId_key: { categoryId: sports.id, key: "sports-starter" } },
    update: {},
    create: {
      name: "Sports Starter",
      key: "sports-starter",
      categoryId: sports.id,
      description: "Essential booking tools",
      priceCents: 4999,
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
      priceCents: 9999,
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

  // Sync PLAN business modules for existing tenants so new catalog modules appear
  const subscriptions = await prisma.subscription.findMany({
    select: {
      businessId: true,
      plan: { select: { planModules: { select: { moduleId: true } } } },
    },
  });
  for (const sub of subscriptions) {
    const planModuleIds = sub.plan.planModules.map((pm) => pm.moduleId);
    const existing = await prisma.businessModule.findMany({
      where: { businessId: sub.businessId },
    });
    const overrideIds = new Set(
      existing.filter((m) => m.source === "OVERRIDE").map((m) => m.moduleId),
    );
    await prisma.businessModule.deleteMany({
      where: { businessId: sub.businessId, source: "PLAN" },
    });
    await prisma.businessModule.createMany({
      data: planModuleIds
        .filter((id) => !overrideIds.has(id))
        .map((moduleId) => ({
          businessId: sub.businessId,
          moduleId,
          enabled: true,
          source: "PLAN" as const,
        })),
    });
  }

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

  // Keep existing business Owner roles in sync with the full permission catalog
  const businessOwnerRoles = await prisma.role.findMany({
    where: { key: "owner", isSystem: true, businessId: { not: null } },
    select: { id: true },
  });
  for (const role of businessOwnerRoles) {
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: ownerPerms.map((permissionId) => ({
        roleId: role.id,
        permissionId,
      })),
    });
  }

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

  const currencies = [
    { code: "NPR", name: "Nepalese Rupee", symbol: "Rs.", decimals: 2, sortOrder: 0 },
    { code: "INR", name: "Indian Rupee", symbol: "₹", decimals: 2, sortOrder: 1 },
    { code: "USD", name: "US Dollar", symbol: "$", decimals: 2, sortOrder: 2 },
    { code: "EUR", name: "Euro", symbol: "€", decimals: 2, sortOrder: 3 },
    { code: "GBP", name: "British Pound", symbol: "£", decimals: 2, sortOrder: 4 },
    { code: "AED", name: "UAE Dirham", symbol: "د.إ", decimals: 2, sortOrder: 5 },
    { code: "AUD", name: "Australian Dollar", symbol: "A$", decimals: 2, sortOrder: 6 },
    { code: "CAD", name: "Canadian Dollar", symbol: "C$", decimals: 2, sortOrder: 7 },
    { code: "JPY", name: "Japanese Yen", symbol: "¥", decimals: 0, sortOrder: 8 },
    { code: "CNY", name: "Chinese Yuan", symbol: "¥", decimals: 2, sortOrder: 9 },
  ] as const;

  for (const c of currencies) {
    await prisma.currency.upsert({
      where: { code: c.code },
      update: {
        name: c.name,
        symbol: c.symbol,
        decimals: c.decimals,
        sortOrder: c.sortOrder,
        status: "ACTIVE",
      },
      create: {
        code: c.code,
        name: c.name,
        symbol: c.symbol,
        decimals: c.decimals,
        sortOrder: c.sortOrder,
        status: "ACTIVE",
      },
    });
  }

  const adminEmail = "admin@nepgrow.com";
  const seedPassword = "password";
  const hashed = await hashPassword(seedPassword);
  let existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
    include: { accounts: true },
  });

  if (!existingAdmin) {
    existingAdmin = await prisma.user.create({
      data: {
        name: "NepGrow Admin",
        email: adminEmail,
        emailVerified: true,
        isPlatformAdmin: true,
        status: "ACTIVE",
      },
      include: { accounts: true },
    });
  } else {
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: { isPlatformAdmin: true, status: "ACTIVE" },
    });
  }

  // Better Auth requires credential accountId === user.id (not email)
  const adminAccount = await prisma.account.findFirst({
    where: { userId: existingAdmin.id, providerId: "credential" },
  });
  if (adminAccount) {
    await prisma.account.update({
      where: { id: adminAccount.id },
      data: { password: hashed, accountId: existingAdmin.id },
    });
  } else {
    await prisma.account.create({
      data: {
        userId: existingAdmin.id,
        accountId: existingAdmin.id,
        providerId: "credential",
        password: hashed,
      },
    });
  }

  console.log("Seed complete.");
  console.log(`Super Admin: ${adminEmail} / ${seedPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
