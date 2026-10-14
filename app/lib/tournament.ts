export type Sport = "volei" | "futevolei";
export type Person = { id: string; name: string };
export type Team = { id: string; name: string; color: string; players: string[] };
export type Match = { id: string; a: string; b: string; round: number; score: [number, number] | null; playing?: boolean; lineups?: { a: string[]; b: string[] } };
export type Division = { teams: Team[]; matches: Match[]; started: boolean; seeded: string[]; semis: Match[]; final: Match | null; tieOrder: string[] };
export type Championship = { version: 2; title: string; people: Person[]; divisions: Record<Sport, Division> };
export const sports: Sport[] = ["volei", "futevolei"];
export const labels = { volei: "Vôlei", futevolei: "Futevôlei" };
export const rosterSize = { volei: 6, futevolei: 2 };
export const personKey = (name: string) => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, " ").toLocaleLowerCase();
export const emptyDivision = (): Division => ({ teams: [], matches: [], started: false, seeded: [], semis: [], final: null, tieOrder: [] });
export const emptyState = (): Championship => ({ version: 2, title: "Copa Madu", people: [], divisions: { volei: emptyDivision(), futevolei: emptyDivision() } });
export const allMatches = (d: Division): Match[] => [...d.matches, ...d.semis, ...(d.final ? [d.final] : [])];
export function lineups(d: Division, m: Match) { return m.lineups ?? { a: d.teams.find(t => t.id === m.a)?.players ?? [], b: d.teams.find(t => t.id === m.b)?.players ?? [] }; }
export function sharedPlayers(d: Division, m: Match) { const p = lineups(d, m); return p.a.filter(id => p.b.includes(id)); }
export function teamOverlap(a: Team, b: Team) { return a.players.filter(id => b.players.includes(id)); }
export function normalizeState(value: unknown): Championship {
  const s = structuredClone(value) as Championship;
  if (s.version === 2 && Array.isArray(s.people)) return s;
  s.version = 2; s.people = [];
  const byName = new Map<string, string>();
  for (const sport of sports) {
    const d = s.divisions[sport];
    for (const t of d.teams) t.players = t.players.map(name => {
      const key = personKey(name); const found = byName.get(key); if (found) return found;
      const id = `person-legacy-${s.people.length + 1}`; byName.set(key, id); s.people.push({ id, name: name.trim() }); return id;
    });
    if (d.started) { const prior = new Map(d.matches.map(m => [m.id, m])); d.matches = schedule(d.teams).map(m => ({ ...m, score: prior.get(m.id)?.score ?? null })); }
  }
  return s;
}
export function schedule(teams: Team[]): Match[] {
  const wheel: (string | null)[] = teams.map(t => t.id);
  if (wheel.length % 2) wheel.push(null);
  const result: Match[] = [];
  const rounds: { teams: Set<string>; people: Set<string> }[] = [];
  for (let originalRound = 1; originalRound < wheel.length; originalRound++) {
    for (let i = 0; i < wheel.length / 2; i++) {
      const a = wheel[i], b = wheel[wheel.length - 1 - i];
      if (!a || !b) continue;
      const participants = [...teams.find(t => t.id === a)!.players, ...teams.find(t => t.id === b)!.players];
      let round = rounds.findIndex(r => !r.teams.has(a) && !r.teams.has(b) && !participants.some(id => r.people.has(id)));
      if (round < 0) { round = rounds.length; rounds.push({ teams: new Set(), people: new Set() }); }
      rounds[round].teams.add(a); rounds[round].teams.add(b); participants.forEach(id => rounds[round].people.add(id));
      result.push({ id: `group-${originalRound}-${i}`, a, b, round: round + 1, score: null });
    }
    wheel.splice(1, 0, wheel.pop()!);
  }
  return result;
}
export function standings(d: Division) {
  const rows = d.teams.map(t => ({ ...t, played: 0, wins: 0, losses: 0, leaguePoints: 0, pointsFor: 0, pointsAgainst: 0, balance: 0 }));
  for (const m of d.matches) {
    if (!m.score) continue;
    const a = rows.find(t => t.id === m.a)!, b = rows.find(t => t.id === m.b)!;
    a.played++; b.played++; a.pointsFor += m.score[0]; a.pointsAgainst += m.score[1]; b.pointsFor += m.score[1]; b.pointsAgainst += m.score[0];
    if (m.score[0] > m.score[1]) { a.wins++; b.losses++; } else { b.wins++; a.losses++; }
  }
  rows.forEach(t => { t.balance = t.pointsFor - t.pointsAgainst; t.leaguePoints = t.wins * 3; });
  return rows.sort((a, b) => b.leaguePoints - a.leaguePoints || b.balance - a.balance || b.pointsFor - a.pointsFor || ((d.tieOrder.indexOf(a.id) < 0 ? 999 : d.tieOrder.indexOf(a.id)) - (d.tieOrder.indexOf(b.id) < 0 ? 999 : d.tieOrder.indexOf(b.id))));
}
export const sameRank = (a: ReturnType<typeof standings>[number], b: ReturnType<typeof standings>[number]) => a.wins === b.wins && a.balance === b.balance && a.pointsFor === b.pointsFor;
export function needsDraw(d: Division) { const r = standings(d); return r.some((t, i) => i > 0 && i <= 4 && sameRank(t, r[i - 1])) && d.tieOrder.length !== d.teams.length; }
export const groupsDone = (d: Division) => d.started && d.matches.length > 0 && d.matches.every(m => m.score !== null);
export const winner = (m: Match | null) => m?.score ? (m.score[0] > m.score[1] ? m.a : m.b) : null;
export function semifinalPairs(d: Division) {
  const ranked = standings(d).slice(0, 4);
  const candidates = [[[0, 3], [1, 2]], [[0, 2], [1, 3]], [[0, 1], [2, 3]]];
  let best = candidates[0], cost = Infinity;
  for (const pairs of candidates) {
    const overlaps = pairs.map(([a, b]) => teamOverlap(ranked[a], ranked[b]).length);
    const value = overlaps.filter(n => n > 0).length * 100 + overlaps.reduce((sum, n) => sum + n, 0);
    if (value < cost) { best = pairs; cost = value; }
  }
  return best.map(([a, b]) => [ranked[a].id, ranked[b].id]);
}
export function qualify(d: Division) {
  if (!groupsDone(d) || needsDraw(d)) throw new Error("Conclua os grupos e resolva os desempates primeiro.");
  d.seeded = standings(d).slice(0, 4).map(t => t.id);
  d.semis = semifinalPairs(d).map(([a, b], i) => ({ id: `semi-${i + 1}`, a, b, round: i + 1, score: null })); d.final = null;
}
export function setLineups(d: Division, id: string, chosen: { a: string[]; b: string[] }) {
  const m = allMatches(d).find(m => m.id === id);
  if (!m) throw new Error("Partida não encontrada.");
  if (m.playing || m.score) throw new Error("A escalação só pode mudar antes da partida começar.");
  if (chosen.a.some(id => chosen.b.includes(id))) throw new Error("Uma pessoa não pode jogar pelos dois lados. Selecione um substituto.");
  m.lineups = structuredClone(chosen);
}
export function startMatch(s: Championship, sport: Sport, id: string) {
  const d = s.divisions[sport], m = allMatches(d).find(m => m.id === id);
  if (!m || m.score || m.playing) throw new Error("Esta partida não pode ser iniciada.");
  const shared = sharedPlayers(d, m);
  if (shared.length) throw new Error(`Selecione um substituto para: ${shared.map(id => s.people.find(p => p.id === id)?.name ?? id).join(", ")}.`);
  const selected = lineups(d, m), ids = new Set([...selected.a, ...selected.b]);
  for (const otherSport of sports) for (const other of allMatches(s.divisions[otherSport])) {
    if (!other.playing) continue;
    const otherLineups = lineups(s.divisions[otherSport], other);
    const busy = [...otherLineups.a, ...otherLineups.b].filter(id => ids.has(id));
    if (busy.length) throw new Error(`Já estão em partida de ${labels[otherSport].toLowerCase()}: ${busy.map(id => s.people.find(p => p.id === id)?.name ?? id).join(", ")}. Aguarde a conclusão.`);
  }
  m.playing = true;
}
export function stopMatch(d: Division, id: string) { const m = allMatches(d).find(m => m.id === id); if (m) m.playing = false; }
export function recordScore(d: Division, id: string, score: [number, number] | null) {
  if (score && (!score.every(n => Number.isInteger(n) && n >= 0 && n <= 999) || score[0] === score[1])) throw new Error("Use pontos inteiros de 0 a 999, sem empate.");
  const m = allMatches(d).find(m => m.id === id); if (!m) throw new Error("Partida não encontrada.");
  if (score && sharedPlayers(d, m).length) throw new Error("Há uma pessoa nos dois times. Defina um substituto na escalação antes de lançar o placar.");
  const group = d.matches.find(m => m.id === id);
  if (group) {
    if (d.semis.some(m => m.playing) || d.final?.playing) throw new Error("Encerre as partidas do mata-mata antes de corrigir os grupos.");
    group.score = score; group.playing = false; d.seeded = []; d.semis = []; d.final = null; d.tieOrder = []; return;
  }
  const semi = d.semis.find(m => m.id === id);
  if (semi) {
    if (d.final?.playing) throw new Error("Encerre a final antes de corrigir uma semifinal.");
    semi.score = score; semi.playing = false; const a = winner(d.semis[0]), b = winner(d.semis[1]); d.final = a && b ? { id: "final", a, b, round: 3, score: null } : null; return;
  }
  m.score = score; m.playing = false;
}
export function validateState(value: unknown, previous?: Championship): asserts value is Championship {
  const s = value as Championship;
  if (s && s.version !== 2) throw new Error("Recarregue a página para usar o novo cadastro de pessoas.");
  if (!s || typeof s.title !== "string" || !s.title.trim() || s.title.length > 60 || !s.divisions || !Array.isArray(s.people) || s.people.length > 512) throw new Error("Cadastro do campeonato inválido.");
  const personIds = new Set<string>(), personNames = new Set<string>();
  for (const p of s.people) {
    if (!p || typeof p.id !== "string" || !p.id || p.id.length > 80 || personIds.has(p.id) || typeof p.name !== "string" || !p.name.trim() || p.name.length > 60 || personNames.has(personKey(p.name))) throw new Error("Confira os nomes: cada pessoa deve ser cadastrada uma vez. Use o nome completo para diferenciar pessoas.");
    personIds.add(p.id); personNames.add(personKey(p.name));
  }
  const occupied = new Set<string>();
  for (const sport of sports) {
    const d = s.divisions[sport];
    if (!d || !Array.isArray(d.teams) || d.teams.length > 32 || typeof d.started !== "boolean" || !Array.isArray(d.matches) || !Array.isArray(d.semis) || !Array.isArray(d.seeded) || !Array.isArray(d.tieOrder)) throw new Error("Modalidade inválida.");
    const ids = new Set<string>(), names = new Set<string>();
    for (const t of d.teams) {
      if (!t || typeof t.id !== "string" || !t.id || t.id.length > 80 || ids.has(t.id) || typeof t.name !== "string" || !t.name.trim() || t.name.length > 40 || names.has(t.name.trim().toLocaleLowerCase()) || !/^#[0-9a-f]{6}$/i.test(t.color) || !Array.isArray(t.players) || (t.players.length < 1 || t.players.length > rosterSize[sport]) || t.players.some(p => !personIds.has(p)) || new Set(t.players).size !== t.players.length) throw new Error("Informe o nome do time e selecione pelo menos uma das pessoas cadastradas, sem repetir alguém dentro do mesmo time.");
      ids.add(t.id); names.add(t.name.trim().toLocaleLowerCase());
    }
    if (d.started && d.teams.length < 4) throw new Error("Cadastre pelo menos 4 times.");
    const expected = d.started ? schedule(d.teams) : [];
    if (expected.length !== d.matches.length || expected.some((m, i) => m.id !== d.matches[i].id || m.a !== d.matches[i].a || m.b !== d.matches[i].b || m.round !== d.matches[i].round)) throw new Error("Tabela de jogos inválida.");
    if (d.tieOrder.length && (d.tieOrder.length !== ids.size || new Set(d.tieOrder).size !== ids.size || d.tieOrder.some(id => !ids.has(id)))) throw new Error("Desempate inválido.");
    if (d.seeded.length) {
      const seeds = standings(d).slice(0, 4).map(t => t.id);
      const semiTeams = d.semis.flatMap(m => [m.a, m.b]);
      if (!groupsDone(d) || needsDraw(d) || d.seeded.length !== 4 || seeds.some((id, i) => id !== d.seeded[i]) || d.semis.length !== 2 || d.semis[0].id !== "semi-1" || d.semis[1].id !== "semi-2" || new Set(semiTeams).size !== 4 || semiTeams.some(id => !seeds.includes(id))) throw new Error("Chaveamento inválido.");
    } else if (d.semis.length || d.final) throw new Error("Chaveamento ainda não liberado.");
    if (d.final && (d.final.id !== "final" || d.final.a !== winner(d.semis[0]) || d.final.b !== winner(d.semis[1]))) throw new Error("Final inválida.");
    const matchIds = new Set<string>();
    for (const m of allMatches(d)) {
      if (!m || matchIds.has(m.id) || !ids.has(m.a) || !ids.has(m.b) || m.a === m.b || (m.playing !== undefined && typeof m.playing !== "boolean") || (m.playing && m.score) || (m.score !== null && (!Array.isArray(m.score) || m.score.length !== 2 || !m.score.every(n => Number.isInteger(n) && n >= 0 && n <= 999) || m.score[0] === m.score[1]))) throw new Error("Partida ou placar inválido.");
      matchIds.add(m.id);
      if (m.lineups && (!Array.isArray(m.lineups.a) || !Array.isArray(m.lineups.b))) throw new Error("Escalação inválida.");
      const chosen = lineups(d, m);
      if ((["a", "b"] as const).some(side => { const players = chosen[side], expectedSize = d.teams.find(t => t.id === m[side])!.players.length; return players.length !== expectedSize || new Set(players).size !== players.length || players.some(id => !personIds.has(id)); })) throw new Error("A escalação deve manter a quantidade de pessoas cadastradas em cada time.");
      const conflict = sharedPlayers(d, m);
      if (conflict.length && (m.playing || m.score)) {
        const oldDivision = previous?.divisions[sport], old = oldDivision && allMatches(oldDivision).find(old => old.id === m.id);
        const historical = !m.playing && old?.score && JSON.stringify(old.score) === JSON.stringify(m.score) && JSON.stringify(lineups(oldDivision!, old)) === JSON.stringify(chosen);
        if (!historical) throw new Error("Uma pessoa não pode jogar pelos dois times na mesma partida. Selecione um substituto.");
      }
      if (m.playing) for (const id of [...chosen.a, ...chosen.b]) { if (occupied.has(id)) throw new Error("Uma pessoa não pode estar em duas partidas ao mesmo tempo, mesmo em modalidades diferentes."); occupied.add(id); }
    }
  }
}
export function demoState(): Championship {
  const s = emptyState();
  for (const sport of sports) {
    const d = s.divisions[sport];
    d.teams = [["Os Confeiteiros", "#ee795d"], ["Bonde do Parabéns", "#a193d6"], ["Só Mais um Set", "#74b7a2"], ["Os Sem Vela", "#dfac44"], ["Saideira FC", "#7ca5d8"], ["Bolo de Campeões", "#d98faf"]].map(([name, color], i) => ({ id: `${sport}-${i}`, name, color, players: Array.from({ length: rosterSize[sport] }, (_, j) => {
      const id = `demo-person-${i * 6 + j + 1}`; if (!s.people.some(p => p.id === id)) s.people.push({ id, name: `Jogador ${i * 6 + j + 1}` }); return id;
    }) }));
    d.started = true; d.matches = schedule(d.teams); d.matches.slice(0, 5).forEach((m, i) => m.score = [21, 12 + i]);
  }
  return s;
}

