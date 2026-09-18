import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";

import { CreateCategoryForm } from "../category-forms";

export const metadata = { title: "New category" };

export default async function NewCategoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Create category"
        description="A business vertical with its own domain slug."
      />
      <Card>
        <CardContent className="pt-6">
          <CreateCategoryForm />
        </CardContent>
      </Card>
    </div>
  );
}