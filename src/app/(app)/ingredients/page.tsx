import { getIngredients } from "@/services/ingredient/actions";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import { IngredientsClient } from "./ingredients-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Raw Materials & Oil Collection — Olfacta" };

export default async function IngredientsPage() {
  const [ingredients, session] = await Promise.all([
    getIngredients(),
    getSession(),
  ]);

  const canCreate = session ? hasPermission(session.role, "ingredient:create") : false;

  return <IngredientsClient ingredients={ingredients} canCreate={canCreate} />;
}
