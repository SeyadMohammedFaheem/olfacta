import { getBatch } from "@/services/batch/actions";
import { getSession } from "@/lib/auth/session";
import { BatchDetailClient } from "./batch-client";
import { redirect } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const batch = await getBatch(id);
    return { title: `Batch ${batch.batchNumber} — Olfacta` };
  } catch {
    return { title: "Batch Detail — Olfacta" };
  }
}

export default async function BatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSession();
  if (!user) redirect("/login");

  let batch;
  try {
    batch = await getBatch(id);
  } catch {
    redirect("/batches");
  }

  return <BatchDetailClient batch={batch} user={user} />;
}
