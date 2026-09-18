import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";

import { CreateCurrencyForm } from "../currency-forms";

export const metadata = { title: "New currency" };

export default function NewCurrencyPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Create currency"
        description="Add an ISO 4217 currency for businesses to select in settings."
      />
      <Card>
        <CardContent className="pt-6">
          <CreateCurrencyForm />
        </CardContent>
      </Card>
    </div>
  );
}
