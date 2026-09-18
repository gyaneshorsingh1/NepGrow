import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/db";
import { sendAppEmail } from "@/lib/email/send";

const dbProvider =
  process.env.DATABASE_URL?.startsWith("postgres") ||
  process.env.DATABASE_URL?.startsWith("postgresql")
    ? "postgresql"
    : "sqlite";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: dbProvider,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      await sendAppEmail({
        to: user.email,
        subject: "Reset your NepGrow password",
        html: `<p>Hello ${user.name || "there"},</p>
<p>Reset your password using this link (expires soon):</p>
<p><a href="${url}">${url}</a></p>
<p>If you did not request this, ignore this email.</p>`,
        text: `Reset your NepGrow password: ${url}`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendAppEmail({
        to: user.email,
        subject: "Verify your NepGrow email",
        html: `<p>Hello ${user.name || "there"},</p>
<p>Verify your email:</p>
<p><a href="${url}">${url}</a></p>`,
        text: `Verify your NepGrow email: ${url}`,
      });
    },
  },
  user: {
    additionalFields: {
      isPlatformAdmin: {
        type: "boolean",
        defaultValue: false,
        input: false,
        returned: true,
      },
      status: {
        type: "string",
        defaultValue: "ACTIVE",
        input: false,
        returned: true,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    additionalFields: {
      activeBusinessId: {
        type: "string",
        required: false,
      },
    },
  },
  trustedOrigins: [
    process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3000",
  ],
});

export type Session = typeof auth.$Infer.Session;
