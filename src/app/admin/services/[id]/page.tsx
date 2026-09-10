import CollectionEditor from "@/components/admin/CollectionEditor";

export const dynamic = "force-dynamic";

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CollectionEditor collection="services" id={id} />;
}
