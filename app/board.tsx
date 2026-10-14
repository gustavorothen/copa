"use client";
import { useEffect, useState } from "react";
import { Championship, Division, Match, Sport, Team, emptyState, groupsDone, labels, standings, winner, podium } from "./lib/tournament";
import PublicTeams from "./public-teams";

function TeamRow({ team, score, seed, won = false }: { team?: Team; score?: number | null; seed?: string; won?: boolean }) {
  return <div className={won ? "madu-team won" : "madu-team"}>
    {seed && <small>{seed}</small>}<i style={{ background: team?.color ?? "#b6c4d4" }} />
    <span>{team?.name ?? "A definir"}</span><b>{score ?? "—"}</b>
    {won && <em title="Vencedor da partida">✓</em>}
  </div>;
}
function Game({ match, division, seeds, waitingLabel }: { match?: Match | null; division: Division; seeds?: [string, string]; waitingLabel?: string }) {
  const find = (id?: string) => division.teams.find(t => t.id === id);
  return <div className="madu-game">
    <TeamRow team={find(match?.a)} score={match?.score?.[0]} seed={seeds?.[0]} won={winner(match ?? null) === match?.a} />
    <TeamRow team={find(match?.b)} score={match?.score?.[1]} seed={seeds?.[1]} won={winner(match ?? null) === match?.b} />
    {match?.playing && <p>em quadra</p>}
    {!match && <p>{waitingLabel ?? (seeds ? "aguardando os grupos" : "vencedores das semifinais")}</p>}
  </div>;
}
function Podium({ division, sport }: { division: Division; sport: Sport }) {
  const places = podium(division);
  return <section className="madu-podium" aria-label={`Pódio de ${labels[sport].toLowerCase()}`}>
    <h3>🏆 Pódio de {labels[sport].toLowerCase()}</h3>
    <div className="madu-podium-steps">{[2, 1, 3].map(place => {
      const team = division.teams.find(t => t.id === places[place - 1]);
      return <div key={place} className={`madu-podium-place place-${place}`}>
        <span className="madu-medal" aria-hidden="true">{["🥇", "🥈", "🥉"][place - 1]}</span>
        <strong title={team?.name}>{team?.name ?? "A definir"}</strong>
        <div className="madu-podium-step" style={{ borderBottomColor: team?.color ?? "#b6c4d4" }}><b>{place}º</b></div>
      </div>;
    })}</div>
  </section>;
}
export default function Home() {
  const [state, setState] = useState<Championship>(emptyState), [sport, setSport] = useState<Sport>("volei"), [loading, setLoading] = useState(true), [error, setError] = useState("");
  const [view, setView] = useState<"bracket" | "teams">("bracket");
  const d = state.divisions[sport], rank = standings(d), champion = winner(d.final), complete = d.matches.filter(m => m.score).length;
  useEffect(() => {
    let active = true;
    setLoading(true);
    async function load() {
      try {
        const res = await fetch(`/api/championship?view=${view === "teams" ? "teams" : "board"}`, { cache: "no-store" });
        const body = await res.json() as { state: Championship; error: string };
        if (!res.ok) throw new Error(body.error);
        if (active) { setState(body.state); setError(""); }
      } catch (e) { if (active) setError(e instanceof Error ? e.message : "Não foi possível carregar o campeonato."); }
      finally { if (active) setLoading(false); }
    }
    load();
    const interval = setInterval(() => { if (document.visibilityState === "visible") load(); }, 15000);
    window.addEventListener("focus", load);
    return () => { active = false; clearInterval(interval); window.removeEventListener("focus", load); };
  }, [view]);
  const status = champion && winner(d.thirdPlace ?? null) ? "Campeonato encerrado" : champion ? "Disputa de terceiro lugar" : d.final ? "Final e terceiro lugar" : d.seeded.length ? "Semifinais" : groupsDone(d) ? "Grupos encerrados" : d.started ? "Fase de grupos" : "Aguardando os times";
  return <div className="madu-site">
    <header className="madu-top"><a className="madu-logo" href="/">copa <b>madu</b><span>♡</span></a><span className="madu-top-caption">aniversário + vôlei + futevôlei</span></header>
    <div className="madu-layout">
      <aside className="madu-profile">
        <div className="madu-photo-frame"><img src="/madu.png" alt="Madu com uma coroa, dentro de um troféu amarelo" width="640" height="640" /></div>
        <h1>{state.title} <span className="madu-sparkle">★</span></h1>
        <div className="madu-mini-stars" aria-hidden="true">♥ <span>★</span> ♥</div>
        <p className="madu-profile-note">todos contra todos<br />4 times passam<br />1 campeão por modalidade</p>
        <img className="madu-confetti" src="/confetes.svg" alt="" width="200" height="90" />
      </aside>
      <main className="madu-content"><div className="madu-community">
        <div className="madu-page-title"><h2>{view === "teams" ? "Times e participantes" : `${sport === "volei" ? "🏐" : "⚽"} Chaves de ${labels[sport].toLowerCase()}`}</h2><span>✧ parabéns, Madu! ✧</span></div>
        <nav className="madu-sport-tabs" aria-label="Modalidade"><button aria-pressed={sport === "volei"} onClick={() => setSport("volei")}>🏐 vôlei</button><button aria-pressed={sport === "futevolei"} onClick={() => setSport("futevolei")}>⚽ futevôlei</button></nav>
        <nav className="madu-view-tabs" aria-label="Conteúdo do campeonato"><button aria-pressed={view === "bracket"} onClick={() => setView("bracket")}>Chaves</button><button aria-pressed={view === "teams"} onClick={() => setView("teams")}>Times</button></nav>
        {error && <div className="madu-error" role="alert">{error}</div>}
        {view === "teams" ? <PublicTeams state={state} sport={sport} loading={loading} /> : <>
        <div className="madu-stage"><span>{loading ? "Carregando…" : status}</span>{d.started && <small>{complete} de {d.matches.length} jogos dos grupos</small>}</div>
        <section className="madu-passing"><h3>{d.seeded.length ? "Quem passou" : "Quem está passando"}</h3>
          <div className="madu-top-four">{[0, 1, 2, 3].map(i => {
            const t = rank[i];
            return <div key={i}><b>{i + 1}º</b><i style={{ background: t?.color ?? "#b6c4d4" }} /><span title={t?.name}>{t?.name ?? "A definir"}</span><small className="madu-standing-score">{t ? <><strong>{t.leaguePoints} pts</strong><span>saldo {t.balance > 0 ? "+" : ""}{t.balance}</span></> : "—"}</small></div>;
          })}</div>
        </section>
        <div className="madu-bracket-scroll"><section className="madu-bracket" aria-label="Chaveamento do campeonato">
          <div className="madu-round semi"><h3>semifinais</h3>
            <Game match={d.semis[0]} division={d} seeds={d.semis[0] ? [`${d.seeded.indexOf(d.semis[0].a) + 1}º`, `${d.seeded.indexOf(d.semis[0].b) + 1}º`] : ["1º", "4º"]} />
            <Game match={d.semis[1]} division={d} seeds={d.semis[1] ? [`${d.seeded.indexOf(d.semis[1].a) + 1}º`, `${d.seeded.indexOf(d.semis[1].b) + 1}º`] : ["2º", "3º"]} />
          </div>
          <div className="madu-connection" aria-hidden="true"><i /><i /><b /></div>
          <div className="madu-round madu-finals">
            <div><h3>final</h3><Game match={d.final} division={d} /></div>
            <div className="madu-third-place"><h3>3º lugar</h3><Game match={d.thirdPlace} division={d} waitingLabel="perdedores das semifinais" /></div>
          </div>
        </section></div>
        <Podium division={d} sport={sport} />
        </>}
      </div></main>
    </div>
  </div>;
}
