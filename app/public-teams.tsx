"use client";
import { useState } from "react";
import { Championship, Sport, labels, personKey, sports } from "./lib/tournament";

export default function PublicTeams({ state, sport, loading }: { state: Championship; sport: Sport; loading: boolean }) {
  const [search, setSearch] = useState("");
  const names = new Map(state.people.map(person => [person.id, person.name]));
  const query = personKey(search);
  const groups = (query ? sports : [sport]).map(modality => ({
    sport: modality,
    teams: state.divisions[modality].teams.filter(team =>
      personKey(team.name).includes(query) || team.players.some(id => personKey(names.get(id) ?? "").includes(query))
    ),
  }));
  const found = groups.some(group => group.teams.length > 0);
  return <section className="madu-public-teams" aria-label="Times e participantes">
    <label className="madu-team-search">Encontre sua equipe
      <input type="search" aria-label="Buscar pessoa ou time" placeholder="Digite seu nome ou o nome do time" value={search} onChange={event => setSearch(event.target.value)} />
    </label>
    <p className="madu-search-hint">Busque seu nome para ver seus times nas duas modalidades.</p>
    {loading ? <p className="madu-teams-empty">Carregando os times…</p> : <>
      {groups.filter(group => group.teams.length > 0).map(group => <section key={group.sport} className="madu-public-team-group">
        <h3>{group.sport === "volei" ? "🏐" : "⚽"} {labels[group.sport]}</h3>
        <div className="madu-public-team-grid">{group.teams.map(team => <article key={team.id} className="madu-public-team" style={{ borderTopColor: team.color }}>
        <h4><i style={{ background: team.color }} />{team.name}</h4>
        <small>{team.players.length} {team.players.length === 1 ? "participante" : "participantes"}</small>
        <ul>{team.players.map(id => <li key={id}>{names.get(id) ?? "Participante não informado"}</li>)}</ul>
      </article>)}</div></section>)}
      {!found && <p className="madu-teams-empty">{query ? "Nenhum time encontrado para essa busca." : "Nenhum time cadastrado nesta modalidade."}</p>}
    </>}
  </section>;
}
