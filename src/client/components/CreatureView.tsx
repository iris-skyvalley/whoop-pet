import React, { useState, useEffect, useRef } from "react";
import type { CreatureDisplay } from "../../shared/types.js";
import { Companion } from "./Companion.js";
import { Icon } from "./Icon.js";

const moodLabels: Record<string, string> = {
  thriving: "On top of the world",
  happy: "Happy to be here",
  neutral: "Taking it easy",
  tired: "A little sleepy",
  struggling: "Needs a little love",
  dead: "Resting for now",
};

export function CreatureView({
  display,
  onRefresh,
  refreshing,
  isDemo,
}: {
  display: CreatureDisplay;
  onRefresh: () => void;
  refreshing: boolean;
  isDemo: boolean;
}) {
  const { creature, metrics, share_text, status_message } = display;
  const [delighted, setDelighted] = useState(false);
  const [message, setMessage] = useState("");
  const petTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const messageTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  useEffect(
    () => () => {
      clearTimeout(petTimer.current);
      clearTimeout(messageTimer.current);
    },
    [],
  );
  const pet = () => {
    clearTimeout(petTimer.current);
    setDelighted(true);
    petTimer.current = setTimeout(() => setDelighted(false), 2200);
  };
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ text: share_text });
      else {
        await navigator.clipboard.writeText(share_text);
        setMessage("Your pet’s update is copied!");
      }
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError"))
        setMessage("Couldn’t share this time. Please try again.");
    }
    clearTimeout(messageTimer.current);
    messageTimer.current = setTimeout(() => setMessage(""), 4000);
  };
  const egg = creature.evolution_stage === "egg";
  const growthDays = Math.max(0, creature.streak_days);
  const stages = [
    { name: "Egg", day: 1 },
    { name: "Baby", day: 3 },
    { name: "Teen", day: 14 },
    { name: "Adult", day: 30 },
    { name: "Legendary", day: 60 },
  ];
  const nextStage = stages.find((stage) => stage.day > growthDays);
  const currentStageIndex = Math.max(
    0,
    stages.findIndex(
      (stage) => stage.name.toLowerCase() === creature.evolution_stage,
    ),
  );
  const stageStart = stages[currentStageIndex].day;
  const growthProgress = nextStage
    ? Math.max(
        0,
        Math.min(1, (growthDays - stageStart) / (nextStage.day - stageStart)),
      )
    : 1;
  const stats = [
    {
      label: "Recovery",
      value: metrics?.recovery,
      max: 100,
      unit: "%",
      icon: "heart",
      tone: "sage",
      note: "A little spring in your step",
    },
    {
      label: "Sleep",
      value: metrics?.sleep_score,
      max: 100,
      unit: "%",
      icon: "moon",
      tone: "lilac",
      note: "Sweet dreams do good things",
    },
    {
      label: "Strain",
      value: metrics?.strain,
      max: 21,
      unit: "/ 21",
      icon: "bolt",
      tone: "peach",
      note: "The energy you put into today",
    },
  ];
  return (
    <>
      <div className="companion-layout">
        <section className="pet-card" aria-label="Your companion">
          <div className="pet-card-top">
            <div>
              <p className="eyebrow">YOUR LITTLE SIDEKICK</p>
              <h2>{creature.name}</h2>
              <span className="pet-stage-label">
                {creature.evolution_stage} · Growth day {growthDays}
              </span>
            </div>
            <div
              className="streak-badge"
              aria-label={`${growthDays} day streak`}
            >
              <Icon name="bolt" />
              <strong>{growthDays}</strong>
              <span>day streak</span>
            </div>
          </div>
          <div className="growth-status">
            <div className="growth-heading">
              <span>
                {!creature.is_alive
                  ? "Growth is resting"
                  : nextStage
                    ? egg
                      ? "Hatching soon"
                      : `Next up: ${nextStage.name}`
                    : "Fully grown. Still your baby."}
              </span>
              <strong>
                {creature.is_alive && nextStage
                  ? `${nextStage.day - growthDays} ${nextStage.day - growthDays === 1 ? "day" : "days"} to go`
                  : creature.is_alive
                    ? "Legendary!"
                    : "Time to recover"}
              </strong>
            </div>
            <div
              className="growth-track"
              role="progressbar"
              aria-label="Growth toward next stage"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(growthProgress * 100)}
            >
              <span style={{ transform: `scaleX(${growthProgress})` }} />
            </div>
            <div className="growth-milestones">
              {stages.map((stage, index) => (
                <span
                  key={stage.name}
                  className={index === currentStageIndex ? "current" : ""}
                  aria-current={
                    index === currentStageIndex ? "step" : undefined
                  }
                >
                  {stage.name}
                  <small>Day {stage.day}</small>
                </span>
              ))}
            </div>
          </div>
          <div className="habitat">
            <div className="sun-doodle" aria-hidden="true">
              ✳
            </div>
            <span className="cloud cloud-one" aria-hidden="true" />
            <span className="cloud cloud-two" aria-hidden="true" />
            <div className="speech-bubble" aria-live="polite">
              {delighted
                ? egg
                  ? "I felt that. ♡"
                  : "You’re my favourite. ♡"
                : egg
                  ? "Big dreams. Tiny egg."
                  : moodLabels[creature.mood]}
            </div>
            <div className="garden-ground" aria-hidden="true" />
            <span className="flower flower-one" aria-hidden="true">
              ✿
            </span>
            <span className="flower flower-two" aria-hidden="true">
              ✿
            </span>
            <button
              className="pet-touch"
              onClick={pet}
              aria-label={
                egg
                  ? `Give ${creature.name} a little love`
                  : `Pet ${creature.name}`
              }
            >
              <Companion creature={creature} delighted={delighted} />
            </button>
            <span className="pet-hint">
              <Icon name="heart" />{" "}
              {delighted
                ? "a little love, delivered"
                : egg
                  ? "tap to send a little love"
                  : "tap for a little head scratch"}
            </span>
          </div>
          <div className="pet-card-bottom">
            <span className="mood-label">
              <i className={`mood-dot mood-${creature.mood}`} />
              {moodLabels[creature.mood]}
            </span>
            <div
              className="hearts"
              aria-label={`Health: ${creature.health_points} out of 100`}
            >
              {Array.from({ length: 5 }, (_, i) => (
                <Icon
                  key={i}
                  name="heart"
                  className={
                    i < Math.round(creature.health_points / 20) ? "filled" : ""
                  }
                />
              ))}
            </div>
          </div>
        </section>
        <aside className="daily-panel">
          <div className="daily-title">
            <div>
              <p className="eyebrow">THE DAILY CHECK-IN</p>
              <h2>A little look at you.</h2>
            </div>
            <span className="small-spark" aria-hidden="true">
              ✧
            </span>
          </div>
          <p className="panel-description">
            How you’re feeling finds its way to your friend.
          </p>
          <div className="metric-list">
            {stats.map((stat) => (
              <div className={`metric ${stat.tone}`} key={stat.label}>
                <div className="metric-icon">
                  <Icon name={stat.icon} />
                </div>
                <div className="metric-content">
                  <div className="metric-heading">
                    <h3>{stat.label}</h3>
                    <span className="metric-value">
                      {stat.value == null
                        ? "—"
                        : stat.label === "Strain"
                          ? stat.value.toFixed(1)
                          : Math.round(stat.value)}
                      {stat.value != null && <small>{stat.unit}</small>}
                    </span>
                  </div>
                  <div
                    className="metric-track"
                    role="meter"
                    aria-label={stat.label}
                    aria-valuemin={0}
                    aria-valuemax={stat.max}
                    aria-valuenow={stat.value ?? 0}
                    aria-valuetext={
                      stat.value == null ? "No data yet" : undefined
                    }
                  >
                    <div
                      style={{
                        transform: `scaleX(${Math.max(0, Math.min(1, (stat.value ?? 0) / stat.max))})`,
                      }}
                    />
                  </div>
                  <p>{stat.note}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="daily-note">
            <span className="note-pin" aria-hidden="true" />
            <p className="eyebrow">A NOTE FROM YOUR FRIEND</p>
            <p>“{status_message}”</p>
            <div className="streak">
              <Icon name="paw" />
              <span>
                {creature.streak_days}{" "}
                {creature.streak_days === 1 ? "day" : "days"} growing together
              </span>
            </div>
          </div>
          <div className="actions">
            <button
              className="button refresh-button"
              onClick={onRefresh}
              disabled={refreshing}
            >
              <Icon name="refresh" className={refreshing ? "spinning" : ""} />
              {refreshing ? "Checking in…" : "Refresh my day"}
            </button>
            <button
              className="button share-button"
              onClick={share}
              aria-label="Share your companion"
            >
              <Icon name="share" />
              Share
            </button>
          </div>
          <p className="action-message" role="status">
            {message}
          </p>
        </aside>
      </div>
      {isDemo && (
        <div className="demo-strip">
          <div className="demo-label">
            <span className="demo-dot" />
            <strong>A little preview</strong>
            <span>Imaginary stats. Real cuteness.</span>
          </div>
          <a
            className="connect-link"
            href={import.meta.env.DEV ? "/auth/whoop" : "/api/auth"}
          >
            Connect your WHOOP <span aria-hidden="true">↗</span>
          </a>
        </div>
      )}
    </>
  );
}
