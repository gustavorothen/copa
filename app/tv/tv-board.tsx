"use client";
import { useEffect, useState, type CSSProperties } from "react";
import { Championship, Division, Match, Sport, currentGroupRound, divisionFinished, emptyState, groupsDone, labels, podium, sports, standings, winner } from "../lib/tournament";
import "./tv.css";

function TVMatch({ match, division, label }: { match?: Match | null; division: Division; label?: string }) {
  const won = winner(match ?? null);
  return <article className={`tv-match${match?.playing ? " tv-match-live" : ""}`}>
    <div className="tv-match-meta"><span>{label}</span><b>{match?.playing ? "● Em quadra" : match?.score ? "Finalizado" : "A jogar"}</b></div>
    {(["a", "b"] as const).map((side, index) => {
      const team = division.teams.find(t => t.id === match?.[side]);
      return <div className={`tv-match-team${team && team.id === won ? " tv-match-winner" : ""}`} key={side}>
        <i style={{ background: team?.color ?? "#b6c4d4" }} /><span>{team?.name ?? "A definir"}</span><strong>{match?.score?.[index] ?? "—"}</strong>
      </div>;
    })}
  </article>;
}

function TVGroups({ division, tick, compact }: { division: Division; tick: number; compact: boolean }) {
  const rank = standings(division), size = compact ? 6 : 8;
  const pages = Math.max(1, Math.ceil(rank.length / size)), page = tick % pages;
  const round = currentGroupRound(division), matches = division.matches.filter(m => m.round === round);
  const matchSize = compact ? 2 : 4, matchPages = Math.max(1, Math.ceil(matches.length / matchSize)), matchPage = tick % matchPages;
  return <div className="tv-groups">
    <section className="tv-ranking" aria-label="Classificação atual">
      <div className="tv-section-title"><h3>Quem está passando</h3>{pages > 1 && <span>{page + 1} / {pages}</span>}</div>
      {rank.length ? <table><colgroup><col className="tv-col-position" /><col /><col className="tv-col-stat" /><col className="tv-col-stat" /><col className="tv-col-stat" /><col className="tv-col-stat" /></colgroup><thead><tr><th colSpan={2}>Time</th><th>J</th><th>V</th><th>Saldo</th><th>Pts</th></tr></thead>
        <tbody>{rank.slice(page * size, (page + 1) * size).map((team, i) => <tr key={team.id} className={page * size + i < 4 ? "tv-qualified" : ""}>
          <td className="tv-position">{page * size + i + 1}º</td><th scope="row"><i style={{ background: team.color }} /><span>{team.name}</span></th>
          <td>{team.played}</td><td>{team.wins}</td><td>{team.balance > 0 ? "+" : ""}{team.balance}</td><td className="tv-points">{team.leaguePoints}</td>
        </tr>)}</tbody></table> : <p className="tv-empty">Aguardando os times</p>}
      {rank.length > 0 && <small className="tv-ranking-note"><i /> Os 4 primeiros avançam</small>}
    </section>
    <section className="tv-current-round" aria-label="Jogos da rodada atual">
      <div className="tv-section-title"><h3>{round === null ? "Próximos jogos" : `Rodada ${round}`}</h3><span>{matchPages > 1 ? `${matchPage + 1} / ${matchPages}` : groupsDone(division) ? "Grupos encerrados" : "Jogos da rodada"}</span></div>
      <div className="tv-round-games">{matches.slice(matchPage * matchSize, (matchPage + 1) * matchSize).map(match => <TVMatch key={match.id} match={match} division={division} />)}</div>
      {!matches.length && <p className="tv-empty">Aguardando a geração das rodadas</p>}
    </section>
  </div>;
}

function TVKnockout({ division }: { division: Division }) {
  return <section className="tv-knockout" aria-label="Chaveamento do mata-mata">
    <div className="tv-section-title"><h3>Rumo ao troféu ♡</h3></div>
    <div className="tv-bracket-grid">
      <div className="tv-semis"><h4>Semifinais</h4>{division.semis.map((match, i) => <TVMatch key={match.id} match={match} division={division} label={`Semifinal ${i + 1}`} />)}</div>
      <div className="tv-bracket-connector" aria-hidden="true" />
      <div className="tv-finals"><h4>Final</h4><TVMatch match={division.final} division={division} label="Vale o ouro" /><h4 className="tv-bronze-title">3º lugar</h4><TVMatch match={division.thirdPlace} division={division} label="Vale o bronze" /></div>
    </div>
  </section>;
}

function TVPodium({ division, sport }: { division: Division; sport: Sport }) {
  const places = podium(division), champion = division.teams.find(t => t.id === places[0]);
  return <section className="tv-podium" aria-label={`Pódio final de ${labels[sport].toLowerCase()}`}>
    <div className="tv-podium-confetti" aria-hidden="true">{Array.from({ length: 32 }, (_, i) => <i key={i} style={{ left: `${(i * 37 + 7) % 100}%`, background: ["#e8b734", "#df8bb3", "#7ca5d8", "#74b7a2", "#a193d6"][i % 5], animationDelay: `${-(i % 9)}s`, animationDuration: `${6 + i % 4}s`, "--drift": `${i % 2 ? 50 : -50}px` } as CSSProperties} />)}</div>
    <div className="tv-champion-heading"><span aria-hidden="true">🏆</span><p>É campeão!</p><h3>{champion?.name}</h3></div>
    <div className="tv-podium-places">{[2, 1, 3].map(place => {
      const team = division.teams.find(t => t.id === places[place - 1]);
      return <div key={place} className={`tv-podium-place tv-place-${place}`}><span aria-hidden="true">{["🥇", "🥈", "🥉"][place - 1]}</span><strong>{team?.name}</strong><div style={{ borderBottomColor: team?.color }}><b>{place}º</b></div></div>;
    })}</div>
  </section>;
}

function TVDivision({ sport, division, loading, tick, compact }: { sport: Sport; division: Division; loading: boolean; tick: number; compact: boolean }) {
  const finished = divisionFinished(division), knockout = division.semis.length > 0;
  const stage = finished ? "Pódio final" : knockout ? division.final ? "Final e terceiro lugar" : "Semifinais" : groupsDone(division) ? "Grupos encerrados" : division.started ? "Fase de grupos" : "Aguardando times";
  return <section className={`tv-division tv-${sport}${finished ? " tv-finished" : ""}`} aria-label={labels[sport]}>
    <header className="tv-division-heading"><h2><span aria-hidden="true">{sport === "volei" ? "🏐" : "⚽"}</span> {labels[sport]}</h2><span>{loading ? "Carregando…" : stage}</span></header>
    {finished ? <TVPodium division={division} sport={sport} /> : knockout ? <TVKnockout division={division} /> : <TVGroups division={division} tick={tick} compact={compact} />}
  </section>;
}

export default function TVBoard() {
  const [state, setState] = useState<Championship>(emptyState), [loading, setLoading] = useState(true), [error, setError] = useState(false);
  const [updated, setUpdated] = useState(""), [tick, setTick] = useState(0), [compact, setCompact] = useState(false), [fullscreen, setFullscreen] = useState(false);
  useEffect(() => {
    let active = true, busy = false, controller: AbortController | null = null;
    async function load() {
      if (busy || document.visibilityState === "hidden") return;
      busy = true; controller = new AbortController();
      const timeout = window.setTimeout(() => controller?.abort(), 8000);
      try {
        const response = await fetch("/api/championship?view=board", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Falha ao carregar");
        const body = await response.json() as { state: Championship };
        if (active) { setState(body.state); setError(false); setUpdated(new Date().toLocaleTimeString("pt-BR")); }
      } catch { if (active) setError(true); }
      finally { window.clearTimeout(timeout); busy = false; if (active) setLoading(false); }
    }
    load();
    const interval = window.setInterval(load, 3000);
    document.addEventListener("visibilitychange", load); window.addEventListener("focus", load);
    return () => { active = false; window.clearInterval(interval); controller?.abort(); document.removeEventListener("visibilitychange", load); window.removeEventListener("focus", load); };
  }, []);
  useEffect(() => {
    const resize = () => setCompact(window.innerHeight < 1000);
    const full = () => setFullscreen(Boolean(document.fullscreenElement));
    resize(); full();
    const timer = window.setInterval(() => setTick(value => value + 1), 10000);
    window.addEventListener("resize", resize); document.addEventListener("fullscreenchange", full);
    return () => { window.clearInterval(timer); window.removeEventListener("resize", resize); document.removeEventListener("fullscreenchange", full); };
  }, []);
  async function toggleFullscreen() {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); } catch { /* The TV can also use its browser's fullscreen control. */ }
  }
  return <main className="tv-screen">
    <header className="tv-top"><div className="tv-brand"><img src="/madu.png" alt="Madu com uma coroa no troféu" width={60} height={60} /><div><h1>{state.title}<span>♡</span></h1><p>aniversário + vôlei + futevôlei</p></div></div><div className="tv-top-right"><span className={`tv-connection${error ? " tv-offline" : ""}`} role="status">{error ? "Reconectando…" : loading ? "Conectando…" : "● Ao vivo"}</span><button type="button" onClick={toggleFullscreen}>{fullscreen ? "Sair da tela cheia" : "Tela cheia"}</button></div></header>
    <div className="tv-split">{sports.map(sport => <TVDivision key={sport} sport={sport} division={state.divisions[sport]} loading={loading} tick={tick} compact={compact} />)}</div>
    <footer className="tv-footer"><span>✧ parabéns, Madu! ✧</span><span>{error ? updated ? `Últimos dados recebidos às ${updated} · tentando reconectar` : "Tentando carregar o campeonato…" : updated ? `Atualizado às ${updated}` : "Carregando o campeonato…"}</span></footer>
  </main>;
}
