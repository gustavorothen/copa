"use client";
import { useEffect, useState } from "react";
import { type Championship, emptyState } from "../lib/tournament";

export default function useTVData(view: "board" | "teams") {
  const [state, setState] = useState<Championship>(emptyState), [loading, setLoading] = useState(true), [error, setError] = useState(false), [updated, setUpdated] = useState("");
  useEffect(() => {
    let active = true, busy = false, controller: AbortController | null = null;
    async function load() {
      if (busy || document.visibilityState === "hidden") return;
      busy = true; controller = new AbortController();
      const timeout = window.setTimeout(() => controller?.abort(), 8000);
      try {
        const response = await fetch(`/api/championship?view=${view}`, { cache: "no-store", signal: controller.signal });
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
  }, [view]);
  return { state, loading, error, updated };
}
