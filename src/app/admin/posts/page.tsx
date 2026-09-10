import CollectionList from "@/components/admin/CollectionList";

export const dynamic = "force-dynamic";

export default function PostsAdminPage() {
  return <CollectionList collection="posts" />;
}
