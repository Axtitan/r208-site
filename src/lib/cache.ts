/* Public pages built from the database are cached by Vercel's CDN for a minute
   (s-maxage), so traffic spikes don't hit Postgres on every view. Browsers
   always revalidate (max-age=0), so CMS edits show up within about a minute. */
export const PUBLIC_CACHE = "public, max-age=0, s-maxage=60";
