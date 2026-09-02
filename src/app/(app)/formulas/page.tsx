import { getFormulas } from "@/services/formula/actions";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import { FormulasClient } from "./formulas-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Formulas — Olfacta" };

export default async function FormulasPage() {
  const [formulas, session] = await Promise.all([
    getFormulas(),
    getSession(),
  ]);

  const canDelete = session ? hasPermission(session.role, "formula:delete") : false;

  return <FormulasClient formulas={formulas} canDelete={canDelete} />;
}
