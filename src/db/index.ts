import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const globalForDb = globalThis as typeof globalThis & {
  __r208Pool?: Pool;
  __r208Db?: ReturnType<typeof drizzle>;
};

/* The pool is created lazily on FIRST QUERY, not at import time.
   `next build` imports every route module while collecting page data —
   throwing here at import time makes the whole build fail, which is what
   happened on Vercel. With lazy init the build passes, and any actual
   query without DATABASE_URL still fails with a clear error at runtime. */
function getPool(): Pool {
  if (!globalForDb.__r208Pool) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error(
        "DATABASE_URL is required — set it in .env locally, or in Vercel → Settings → Environment Variables for production."
      );
    }
    globalForDb.__r208Pool = new Pool({ connectionString: databaseUrl });
  }
  return globalForDb.__r208Pool;
}

function getDb(): ReturnType<typeof drizzle> {
  if (!globalForDb.__r208Db) {
    globalForDb.__r208Db = drizzle(getPool());
  }
  return globalForDb.__r208Db;
}

function lazy<T extends object>(get: () => T): T {
  return new Proxy({} as T, {
    get(_t, prop) {
      const real = get() as Record<PropertyKey, unknown>;
      const value = real[prop];
      return typeof value === "function" ? value.bind(real) : value;
    },
  });
}

export const pool = lazy(getPool);
export const db = lazy(getDb);
