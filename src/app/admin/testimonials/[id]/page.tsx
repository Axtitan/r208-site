import CollectionEditor from "@/components/admin/CollectionEditor";

export const dynamic = "force-dynamic";

export default async function EditTestimonialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CollectionEditor collection="testimonials" id={id} />;
}
