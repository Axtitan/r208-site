import { getPostBySlug } from "@/lib/site-data";
import { renderJournalPost } from "@/lib/render";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const post = await getPostBySlug(slug).catch(() => null);
  if (!post) {
    return new Response(
      `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=/journal"></head><body></body></html>`,
      { status: 404, headers: { "content-type": "text/html; charset=utf-8" } }
    );
  }
  return new Response(renderJournalPost(post), {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}
