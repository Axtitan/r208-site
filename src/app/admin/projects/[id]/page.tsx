import ProjectEditor from "@/components/admin/ProjectEditor";

export const dynamic = "force-dynamic";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProjectEditor id={id} />;
}
