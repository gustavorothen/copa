"use client";
import { useEffect, useState, type CSSProperties } from "react";
import { Division, Match, Sport, tvGroupRounds, divisionFinished, groupsDone, labels, podium, sports, standings, winner } from "../lib/tournament";
import useTVData from "./use-tv-data";
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
  const rank = standings(division), size = 6;
  const pages = Math.max(1, Math.ceil(rank.length / size)), page = tick % pages;
  const { lastFinishedRound, results, nextRound, upcoming } = tvGroupRounds(division);
  const matchSize = compact ? 2 : 3, resultPages = Math.max(1, Math.ceil(results.length / matchSize)), resultPage = tick % resultPages;
  const upcomingPages = Math.max(1, Math.ceil(upcoming.length / matchSize)), upcomingPage = tick % upcomingPages;
  const team = (id: string) => division.teams.find(t => t.id === id);
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
    <section className="tv-last-round" aria-label="Última rodada finalizada">
      <div className="tv-section-title"><h3>Última rodada finalizada{lastFinishedRound !== null ? ` · ${lastFinishedRound}` : ""}</h3>{resultPages > 1 && <span>{resultPage + 1} / {resultPages}</span>}</div>
      <div className="tv-results">{results.slice(resultPage * matchSize, (resultPage + 1) * matchSize).map(match => <div key={match.id} className="tv-result-line">
        <span className={winner(match) === match.a ? "tv-line-winner" : ""}><i style={{ background: team(match.a)?.color }} />{team(match.a)?.name}</span>
        <strong>{match.score?.[0]} <small>×</small> {match.score?.[1]}</strong>
        <span className={winner(match) === match.b ? "tv-line-winner" : ""}>{team(match.b)?.name}<i style={{ background: team(match.b)?.color }} /></span>
      </div>)}</div>
      {!results.length && <p className="tv-round-empty">Nenhuma rodada finalizada ainda</p>}
    </section>
    <section className="tv-next-round" aria-label="Próximas partidas">
      <div className="tv-section-title"><h3>Próximas partidas</h3><span>{nextRound !== null ? `Rodada ${nextRound}` : ""}{upcomingPages > 1 ? ` · ${upcomingPage + 1} / ${upcomingPages}` : ""}</span></div>
      <div className="tv-upcoming">{upcoming.slice(upcomingPage * matchSize, (upcomingPage + 1) * matchSize).map(match => <div key={match.id} className={`tv-upcoming-line${match.playing ? " tv-upcoming-live" : ""}`}>
        <span><i style={{ background: team(match.a)?.color }} />{team(match.a)?.name}</span><b>×</b><span>{team(match.b)?.name}<i style={{ background: team(match.b)?.color }} /></span>{match.playing && <small>em quadra</small>}
      </div>)}</div>
      {!upcoming.length && <p className="tv-round-empty">{groupsDone(division) ? "Todos os jogos dos grupos concluídos" : "Aguardando a geração das rodadas"}</p>}
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
    <div className="tv-champion-heading"><img className="tv-champion-photo" src="/madu-trofeu.png" alt="Madu com coroa no troféu da Copa Madu" width={2170} height={3059} /><p>É campeão!</p><h3>{champion?.name}</h3></div>
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
  const { state, loading, error, updated } = useTVData("board");
  const [tick, setTick] = useState(0), [compact, setCompact] = useState(false);
  useEffect(() => {
    const resize = () => setCompact(window.innerHeight < 1000);
    resize();
    const timer = window.setInterval(() => setTick(value => value + 1), 10000);
    window.addEventListener("resize", resize);
    return () => { window.clearInterval(timer); window.removeEventListener("resize", resize); };
  }, []);
  return <main className="tv-screen">
    <header className="tv-top"><div className="tv-brand"><img src="/madu.png" alt="Madu com uma coroa no troféu" width={60} height={60} /><div><h1>{state.title}<span>♡</span></h1><p>aniversário + vôlei + futevôlei</p></div></div></header>
    <div className="tv-split">{sports.map(sport => <TVDivision key={sport} sport={sport} division={state.divisions[sport]} loading={loading} tick={tick} compact={compact} />)}</div>
    <footer className="tv-footer"><span>✧ parabéns, Madu! ✧</span><span>{error ? updated ? `Últimos dados recebidos às ${updated} · tentando reconectar` : "Tentando carregar o campeonato…" : updated ? `Atualizado às ${updated}` : "Carregando o campeonato…"}</span></footer>
  </main>;
}
