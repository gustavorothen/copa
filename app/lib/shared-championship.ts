import { eq, ne } from "drizzle-orm";
import { getDb } from "../../db";
import { championships } from "../../db/schema";
import { emptyState, validateState } from "./tournament";
export const SHARED_CHAMPIONSHIP = "copa-madu-shared";
export async function getSharedChampionship() {
  const db = getDb();
  const existing = await db.select().from(championships).where(eq(championships.owner, SHARED_CHAMPIONSHIP)).get();
  if (existing) return existing;
  // Keep the former private record as a backup; copy it once into the shared championship.
  const previous = await db.select().from(championships).where(ne(championships.owner, SHARED_CHAMPIONSHIP)).limit(2);
  if (previous.length > 1) throw new Error("Mais de um campeonato anterior. É necessário selecionar os dados a preservar.");
  const state = previous[0] ? JSON.parse(previous[0].payload) : emptyState();
  if (state.title === "Copa Confete") state.title = "Copa Madu";
  validateState(state);
  await db.insert(championships).values({ owner: SHARED_CHAMPIONSHIP, payload: JSON.stringify(state), revision: previous[0]?.revision ?? 0 }).onConflictDoNothing();
  const row = await db.select().from(championships).where(eq(championships.owner, SHARED_CHAMPIONSHIP)).get();
  if (!row) throw new Error("Não foi possível preparar o campeonato.");
  return row;
}
