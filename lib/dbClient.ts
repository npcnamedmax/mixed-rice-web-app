import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const getDbClient = () =>
  postgres(process.env.POSTGRES_URL!, {
    max: 1,
    idle_timeout: 0,
    prepare: false
  });

const getDrizzleWrapper = (dbClient: ReturnType<typeof getDbClient>) =>
  drizzle(dbClient, {
    schema
  });

export type dbType = ReturnType<typeof getDrizzleWrapper>;

export const dbRunner = async <T>(
  fc: (db: dbType) => Promise<T> | T
): Promise<T> => {
  let c = getDbClient();
  let d = getDrizzleWrapper(c);
  let res = undefined;
  try {
    res = await fc(d);
  } catch (err) {
    throw err;
  } finally {
    await c.end();
  }
  return res;
};
