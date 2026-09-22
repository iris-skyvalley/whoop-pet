import { useState, useEffect, useCallback } from "react";
import type { CreatureDisplay } from "../../shared/types.js";

type Status = "loading" | "ready" | "error";

export function useCreature() {
  const [display, setDisplay] = useState<CreatureDisplay | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [isDemo, setIsDemo] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const readResponse = async (res: Response) => {
    const data = await res.json();
    if (!res.ok) {
      setNeedsReconnect(data.error === "WHOOP_RECONNECT");
      setErrorMessage(
        data.error?.startsWith("WHOOP_")
          ? data.message
          : "We couldn’t update your companion. Please try again.",
      );
      throw new Error("Could not load creature");
    }
    setNeedsReconnect(false);
    setErrorMessage("");
    return data;
  };

  const fetchCreature = useCallback(async () => {
    try {
      setStatus("loading");
      const res = await fetch("/api/creature", { credentials: "include" });
      const data = await readResponse(res);
      setDisplay(data);
      setIsDemo(data.is_demo ?? true);
      setStatus("ready");
    } catch {
      setDisplay(null);
      setStatus("error");
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      setStatus("loading");
      const res = await fetch("/api/creature/refresh", {
        method: "POST",
        credentials: "include",
      });
      const data = await readResponse(res);
      setDisplay(data);
      setIsDemo(data.is_demo ?? true);
      setStatus("ready");
    } catch {
      setDisplay(null);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    fetchCreature();
  }, [fetchCreature]);

  return {
    display,
    status,
    isDemo,
    refresh,
    fetchCreature,
    errorMessage,
    needsReconnect,
  };
}
