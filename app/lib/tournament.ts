export type Sport = "volei" | "futevolei";
export type Team = { id: string; name: string; color: string; players: string[] };
export type Match = { id: string; a: string; b: string; round: number; score: [number, number] | null };
export type Division = { teams: Team[]; matches: Match[]; started: boolean; seeded: string[]; semis: Match[]; final: Match | null; tieOrder: string[] };
export type Championship = { title: string; divisions: Record<Sport, Division> };
export const sports: Sport[] = ["volei", "futevolei"];
export const labels = { volei: "Vôlei", futevolei: "Futevôlei" };
export const rosterSize = { volei: 6, futevolei: 2 };
export const emptyDivision = (): Division => ({ teams: [], matches: [], started: false, seeded: [], semis: [], final: null, tieOrder: [] });
export const emptyState = (): Championship => ({ title: "Copa Madu", divisions: { volei: emptyDivision(), futevolei: emptyDivision() } });
export function schedule(teams: Team[]): Match[] {
  const wheel: (string | null)[] = teams.map(t => t.id);
  if (wheel.length % 2) wheel.push(null);
  const result: Match[] = [];
  for (let round = 1; round < wheel.length; round++) {
    for (let i = 0; i < wheel.length / 2; i++) {
      const a = wheel[i], b = wheel[wheel.length - 1 - i];
      if (a && b) result.push({ id: `group-${round}-${i}`, a, b, round, score: null });
    }
    wheel.splice(1, 0, wheel.pop()!);
  }
  return result;
}
export function standings(d: Division) {
  const rows = d.teams.map(t => ({ ...t, played: 0, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, balance: 0 }));
  for (const m of d.matches) {
    if (!m.score) continue;
    const a = rows.find(t => t.id === m.a)!, b = rows.find(t => t.id === m.b)!;
    a.played++; b.played++; a.pointsFor += m.score[0]; a.pointsAgainst += m.score[1]; b.pointsFor += m.score[1]; b.pointsAgainst += m.score[0];
    if (m.score[0] > m.score[1]) { a.wins++; b.losses++; } else { b.wins++; a.losses++; }
  }
  rows.forEach(t => t.balance = t.pointsFor - t.pointsAgainst);
  return rows.sort((a,b) => b.wins-a.wins || b.balance-a.balance || b.pointsFor-a.pointsFor || ((d.tieOrder.indexOf(a.id)<0 ? 999 : d.tieOrder.indexOf(a.id)) - (d.tieOrder.indexOf(b.id)<0 ? 999 : d.tieOrder.indexOf(b.id))));
}
export const sameRank = (a: ReturnType<typeof standings>[number], b: ReturnType<typeof standings>[number]) => a.wins===b.wins && a.balance===b.balance && a.pointsFor===b.pointsFor;
export function needsDraw(d: Division) {
  const r = standings(d);
  return r.some((t,i) => i>0 && i<=4 && sameRank(t,r[i-1])) && d.tieOrder.length!==d.teams.length;
}
export const groupsDone = (d: Division) => d.started && d.matches.length>0 && d.matches.every(m => m.score!==null);
export const winner = (m: Match | null) => m?.score ? (m.score[0] > m.score[1] ? m.a : m.b) : null;
export function qualify(d: Division) {
  if (!groupsDone(d) || needsDraw(d)) throw new Error("Conclua os grupos e resolva os desempates primeiro.");
  d.seeded = standings(d).slice(0,4).map(t=>t.id);
  d.semis = [{id:"semi-1",a:d.seeded[0],b:d.seeded[3],round:1,score:null},{id:"semi-2",a:d.seeded[1],b:d.seeded[2],round:1,score:null}]; d.final=null;
}
export function recordScore(d: Division, id: string, score: [number,number] | null) {
  if (score && (!score.every(n=>Number.isInteger(n)&&n>=0&&n<=999) || score[0]===score[1])) throw new Error("Use pontos inteiros de 0 a 999, sem empate.");
  const group = d.matches.find(m=>m.id===id);
  if (group) { group.score=score; d.seeded=[]; d.semis=[]; d.final=null; d.tieOrder=[]; return; }
  const semi = d.semis.find(m=>m.id===id);
  if (semi) { semi.score=score; const a=winner(d.semis[0]), b=winner(d.semis[1]); d.final = a&&b ? {id:"final",a,b,round:2,score:null}:null; return; }
  if (d.final?.id===id) { d.final.score=score; return; }
  throw new Error("Partida não encontrada.");
}
export function validateState(value: unknown): asserts value is Championship {
  const s=value as Championship;
  if (!s || typeof s.title!=="string" || !s.title.trim() || s.title.length>60 || !s.divisions) throw new Error("Nome do campeonato inválido.");
  for (const sport of sports) {
    const d=s.divisions[sport];
    if (!d || !Array.isArray(d.teams) || d.teams.length>32 || typeof d.started!=="boolean" || !Array.isArray(d.matches) || !Array.isArray(d.semis) || !Array.isArray(d.seeded) || !Array.isArray(d.tieOrder)) throw new Error("Modalidade inválida.");
    const ids = new Set<string>(), names=new Set<string>();
    for (const t of d.teams) {
      if (!t || typeof t.id!=="string" || t.id.length>80 || ids.has(t.id) || typeof t.name!=="string" || !t.name.trim() || t.name.length>40 || names.has(t.name.trim().toLocaleLowerCase()) || !/^#[0-9a-f]{6}$/i.test(t.color) || !Array.isArray(t.players) || t.players.length!==rosterSize[sport] || t.players.some(p=>typeof p!=="string" || !p.trim() || p.length>60) || new Set(t.players.map(p=>p.trim().toLowerCase())).size!==t.players.length) throw new Error("Confira nome, cor e participantes dos times.");
      ids.add(t.id); names.add(t.name.trim().toLocaleLowerCase());
    }
    if (d.started && d.teams.length<4) throw new Error("Cadastre pelo menos 4 times.");
    const expected=d.started?schedule(d.teams):[];
    if (expected.length!==d.matches.length || expected.some((m,i)=>m.id!==d.matches[i].id || m.a!==d.matches[i].a || m.b!==d.matches[i].b || m.round!==d.matches[i].round)) throw new Error("Tabela de jogos inválida.");
    if (d.tieOrder.length && (d.tieOrder.length!==ids.size || new Set(d.tieOrder).size!==ids.size || d.tieOrder.some(id=>!ids.has(id)))) throw new Error("Desempate inválido.");
    if (d.seeded.length) {
      const seeds=standings(d).slice(0,4).map(t=>t.id);
      if (!groupsDone(d) || needsDraw(d) || d.seeded.length!==4 || seeds.some((id,i)=>id!==d.seeded[i]) || d.semis.length!==2 || d.semis[0].id!=="semi-1" || d.semis[1].id!=="semi-2" || d.semis[0].a!==seeds[0] || d.semis[0].b!==seeds[3] || d.semis[1].a!==seeds[1] || d.semis[1].b!==seeds[2]) throw new Error("Chaveamento inválido.");
    } else if (d.semis.length || d.final) throw new Error("Chaveamento ainda não liberado.");
    if (d.final && (d.final.id!=="final" || d.final.a!==winner(d.semis[0]) || d.final.b!==winner(d.semis[1]))) throw new Error("Final inválida.");
    const matchIds=new Set<string>();
    for (const m of [...d.matches,...d.semis,...(d.final?[d.final]:[])]) {
      if (!m || matchIds.has(m.id) || !ids.has(m.a) || !ids.has(m.b) || m.a===m.b || (m.score!==null && (!Array.isArray(m.score) || m.score.length!==2 || !m.score.every(n=>Number.isInteger(n)&&n>=0&&n<=999) || m.score[0]===m.score[1]))) throw new Error("Placar inválido.");
      matchIds.add(m.id);
    }
  }
}
export function demoState(): Championship {
  const s=emptyState();
  sports.forEach(sport=>{
    const d=s.divisions[sport];
    d.teams=[['Os Confeiteiros','#ee795d'],['Bonde do Parabéns','#a193d6'],['Só Mais um Set','#74b7a2'],['Os Sem Vela','#dfac44'],['Saideira FC','#7ca5d8'],['Bolo de Campeões','#d98faf']].map(([name,color],i)=>({id:`${sport}-${i}`,name,color,players:Array.from({length:rosterSize[sport]},(_,j)=>`Jogador ${i*6+j+1}`)}));
    d.started=true; d.matches=schedule(d.teams);
    d.matches.slice(0,5).forEach((m,i)=>m.score=[21,12+i]);
  });
  return s;
}

