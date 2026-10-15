"use client";
import { useEffect, useState, type CSSProperties } from "react";
import { labels, type Sport, type Team } from "./lib/tournament";

const colors = ["#e8b734", "#df8bb3", "#7ca5d8", "#74b7a2", "#a193d6", "#ee795d"];
export default function ChampionCelebration({ team, sport }: { team: Team; sport: Sport }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 6000);
    return () => window.clearTimeout(timer);
  }, []);
  if (!visible) return null;
  return <div className="madu-celebration">
    <div className="madu-falling-confetti" aria-hidden="true">{Array.from({ length: 48 }, (_, i) => <i key={i} style={{
      left: `${(i * 37 + 11) % 100}%`, background: colors[i % colors.length],
      animationDelay: `${(i % 8) * .13}s`, animationDuration: `${3.1 + (i % 5) * .3}s`,
      "--confetti-drift": `${(i % 2 ? 1 : -1) * (30 + i % 7 * 12)}px`,
    } as CSSProperties} />)}</div>
    <section className="madu-celebration-card" role="status" aria-label={`Campeão de ${labels[sport].toLowerCase()}`} style={{ borderBottomColor: team.color }}>
      <span className="madu-celebration-trophy" aria-hidden="true">🏆</span>
      <p>{sport === "volei" ? "🏐" : "⚽"} Campeão de {labels[sport].toLowerCase()}</p>
      <strong>{team.name}</strong>
      <span className="madu-celebration-cheer">é campeão! ♡</span>
    </section>
  </div>;
}
