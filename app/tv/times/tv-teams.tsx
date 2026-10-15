"use client";
import { useEffect, useState } from "react";
import { labels, tvTeamsSlide } from "../../lib/tournament";
import useTVData from "../use-tv-data";
import "../tv.css";
import "./tv-teams.css";

export default function TVTeams() {
  const { state, loading, error, updated } = useTVData("teams");
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setStep(value => value + 1), 15000);
    return () => window.clearInterval(timer);
  }, []);
  const { sport, teams, page, pages, total } = tvTeamsSlide(state, step);
  const names = new Map(state.people.map(person => [person.id, person.name]));
  const nextSport = sport === "volei" ? "futevolei" : "volei";
  return <main className="tv-screen tv-rosters">
    <header className="tv-top tv-rosters-heading"><img src="/madu.png" alt="Madu com uma coroa no troféu" width={72} height={72} /><h1>{state.title} <span>— Times de {labels[sport]}</span></h1><span className="tv-rosters-ball" aria-hidden="true">{sport === "volei" ? "🏐" : "⚽"}</span></header>
    <section key={`${sport}-${page}`} className={`tv-teams-grid${teams.length <= 2 ? " tv-teams-single-row" : ""}`} aria-label={`Times de ${labels[sport].toLowerCase()}`}>
      {teams.map(team => <article key={team.id} className={`tv-roster-card${team.name.length > 30 || team.players.some(id => (names.get(id)?.length ?? 0) > 40) ? " tv-roster-long" : ""}`} style={{ borderTopColor: team.color }}>
        <h2><i style={{ background: team.color }} />{team.name}</h2>
        <ul>{team.players.map(id => <li key={id}>{names.get(id) ?? "Participante não informado"}</li>)}</ul>
      </article>)}
      {!teams.length && <p className="tv-rosters-empty">{loading ? "Carregando os times…" : "Nenhum time cadastrado nesta modalidade"}</p>}
    </section>
    <footer className="tv-footer tv-rosters-footer"><span>{total} {total === 1 ? "time" : "times"}{pages > 1 ? ` · Página ${page + 1} de ${pages}` : ""}</span><span>Próxima: {labels[nextSport]} · troca a cada 15 segundos</span><span>{error ? "Reconectando aos dados…" : updated ? `Atualizado às ${updated}` : "Carregando…"}</span></footer>
  </main>;
}
