import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.EMAIL_FROM ?? "NepGrow <onboarding@resend.dev>";

export async function sendAppEmail(input: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  if (!resendApiKey) {
    console.info("[email:dev]", {
      to: input.to,
      subject: input.subject,
      text: input.text ?? input.html,
    });
    return { id: "dev-console", mode: "console" as const };
  }

  const resend = new Resend(resendApiKey);
  const result = await resend.emails.send({
    from: fromEmail,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return { id: result.data?.id ?? "sent", mode: "resend" as const };
}
