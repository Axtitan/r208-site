import { getPublishedPosts } from "@/lib/site-data";
import { renderJournalIndex } from "@/lib/render";

export const dynamic = "force-dynamic";

export async function GET() {
  let posts: Awaited<ReturnType<typeof getPublishedPosts>> = [];
  try {
    posts = await getPublishedPosts();
  } catch {
    /* DB unreachable — render an empty journal instead of a 500 */
  }
  return new Response(renderJournalIndex(posts), {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}
