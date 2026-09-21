import React, { useState, useEffect } from "react";
import { useCreature } from "../hooks/useCreature.js";
import { CreatureView } from "./CreatureView.js";
import { PrivacyPolicy } from "./PrivacyPolicy.js";
import { Icon } from "./Icon.js";
import "../styles.css";

export function App() {
  const [path, setPath] = useState(window.location.pathname);
  const { display, status, isDemo, refresh } = useCreature();
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const navigate = (event: React.MouseEvent, to: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    event.preventDefault();
    window.history.pushState({}, "", to);
    setPath(to);
    window.scrollTo(0, 0);
  };

  return (
    <div className="app">
      <header className="site-header">
        <a
          className="wordmark"
          href="/"
          onClick={(e) => navigate(e, "/")}
          aria-label="Whoopy home"
        >
          <span className="brand-icon">
            <Icon name="paw" />
          </span>
          whoopy
        </a>
        <span className="header-note">a little you, with paws.</span>
        <span className="edition">YOUR DAILY COMPANION</span>
      </header>
      {path === "/privacy" ? (
        <main className="privacy-page">
          <PrivacyPolicy />
        </main>
      ) : (
        <main className="main-content">
          <div className="intro">
            <div>
              <h1>
                Feel good.
                <br className="mobile-break" /> Grow together
                <span className="title-star">✳</span>
              </h1>
              <p className="intro-copy">
                Your everyday ups, downs, and well-earned naps. A little friend
                for all of it.
              </p>
            </div>
            <span className="date-stamp">
              {new Intl.DateTimeFormat("en-GB", {
                day: "2-digit",
                month: "short",
              }).format(new Date())}
              <small>one day at a time</small>
            </span>
          </div>
          {status === "loading" && !display && (
            <div className="empty-state" role="status">
              <span className="loading-paw">
                <Icon name="paw" />
              </span>
              Waking up your little friend…
            </div>
          )}
          {status === "error" && (
            <div className="error-note" role="alert">
              We couldn’t update your companion.{" "}
              <button onClick={refresh}>Try again</button>
            </div>
          )}
          {display && (
            <CreatureView
              display={display}
              onRefresh={refresh}
              refreshing={status === "loading"}
              isDemo={isDemo}
            />
          )}
        </main>
      )}
      <footer className="site-footer">
        <span>
          Made for your human days. <Icon name="heart" />
        </span>
        <a href="/privacy" onClick={(e) => navigate(e, "/privacy")}>
          Privacy policy <span aria-hidden="true">↗</span>
        </a>
      </footer>
    </div>
  );
}
