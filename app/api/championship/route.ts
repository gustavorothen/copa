import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { getDb } from "../../../db";
import { championships } from "../../../db/schema";
import { Championship, validateState, normalizeState, publicState } from "../../lib/tournament";
import { getSharedChampionship, SHARED_CHAMPIONSHIP } from "../../lib/shared-championship";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    const row = await getSharedChampionship();
    let state: Championship = normalizeState(JSON.parse(row.payload));
    const view = new URL(request.url).searchParams.get("view");
    if (view === "board" || view === "teams") state = publicState(state, view === "teams");
    return NextResponse.json({ state, revision: row.revision }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Não foi possível carregar os dados. Tente novamente." }, { status: 503 }); }
}
export async function PUT(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return NextResponse.json({ error: "Envie os dados em JSON." }, { status: 415 });
  if (Number(request.headers.get("content-length")) > 1000000) return NextResponse.json({ error: "Campeonato muito grande." }, { status: 413 });
  const raw = await request.text();
  if (raw.length > 1000000) return NextResponse.json({ error: "Campeonato muito grande." }, { status: 413 });
  let body;
  try { body = JSON.parse(raw); if (!Number.isSafeInteger(body.revision) || body.revision < 0) throw new Error("Versão inválida."); }
  catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Dados inválidos." }, { status: 400 }); }
  try {
    const previous = await getSharedChampionship();
    if (body.revision !== previous.revision) return NextResponse.json({ error: "Há uma versão mais recente. Recarregue os dados antes de continuar." }, { status: 409 });
    try { validateState(body.state, normalizeState(JSON.parse(previous.payload))); } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Dados inválidos." }, { status: 400 }); }
    const updated = await getDb().update(championships).set({ payload: JSON.stringify(body.state), revision: body.revision + 1 }).where(and(eq(championships.owner, SHARED_CHAMPIONSHIP), eq(championships.revision, body.revision))).returning().get();
    if (!updated) return NextResponse.json({ error: "Há uma versão mais recente. Recarregue os dados antes de continuar." }, { status: 409 });
    return NextResponse.json({ revision: updated.revision });
  } catch { return NextResponse.json({ error: "Não foi possível salvar. Seus dados anteriores continuam guardados." }, { status: 503 }); }
}
