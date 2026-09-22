import { redirect } from "next/navigation";

export default function LegacyNewMembershipPlanPage() {
  redirect("/app/membership-plans/new");
}
