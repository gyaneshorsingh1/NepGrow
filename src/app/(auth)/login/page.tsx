import { redirect } from "next/navigation";

/** Shared login entry — prefer surface-specific routes. */
export default function SharedLoginPage() {
  redirect("/app/login");
}
