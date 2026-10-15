import { getPublishedPosts } from "@/lib/site-data";
import { renderJournalIndex } from "@/lib/render";
import { PUBLIC_CACHE } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  let posts: Awaited<ReturnType<typeof getPublishedPosts>> = [];
  let ok = true;
  try {
    posts = await getPublishedPosts();
  } catch {
    /* DB unreachable — render an empty journal instead of a 500 (uncached) */
    ok = false;
  }
  return new Response(renderJournalIndex(posts), {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": ok ? PUBLIC_CACHE : "no-store",
    },
  });
}
