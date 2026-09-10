import { readFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

/* Serve the original static homepage at the site root. */
export async function GET() {
  const file = path.join(process.cwd(), "public", "index.html");
  const html = await readFile(file, "utf8");
  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
