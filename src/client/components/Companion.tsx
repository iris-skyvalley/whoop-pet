import React from "react";
import type { CreatureState } from "../../shared/types.js";
import eggImage from "../assets/egg-soft.png";

export function Companion({
  creature,
  delighted,
}: {
  creature: CreatureState;
  delighted: boolean;
}) {
  const egg = creature.evolution_stage === "egg";
  const sleepy = ["tired", "struggling"].includes(creature.mood);
  const alive = creature.is_alive;
  return (
    <svg
      className={`companion ${delighted ? "is-delighted" : ""} ${sleepy ? "is-sleepy" : ""} ${!alive ? "is-resting" : ""}`}
      viewBox="0 0 360 310"
      role="img"
      aria-label={`${creature.name}, ${egg ? "an egg" : "a puppy"}, feeling ${creature.mood}`}
    >
      <ellipse cx="180" cy="280" rx="87" ry="12" fill="#655471" opacity=".12" />
      <g
        className="pet-body"
        stroke="#40382f"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {egg ? (
          <image href={eggImage} x="50" y="22" width="260" height="260" />
        ) : (
          <>
            <path
              className="pet-tail"
              d="M240 225c61 3 67-52 44-51-18 0-8 30-38 27"
              fill="#d5aa7a"
            />
            <path
              d="M115 196c-15 26-24 65-7 71h145c15-14-1-56-19-73"
              fill="#f4d2a0"
            />
            <path d="M126 247v22m106-22v22" />
            <ellipse
              cx="177"
              cy="227"
              rx="31"
              ry="30"
              fill="#fff4dc"
              stroke="none"
            />
            <path
              d="M123 85C86 45 58 73 74 134c6 21 26 27 46 4M231 86c36-42 66-8 50 48-7 24-29 29-45 4"
              fill="#bc885e"
            />
            <path
              d="M108 113c0-73 139-75 139 0l9 49c12 74-169 76-159 0Z"
              fill="#f4d2a0"
            />
            <path
              d="M140 93c10-21 63-22 76 0"
              stroke="#ffe8c5"
              strokeWidth="12"
            />
            <ellipse
              cx="177"
              cy="180"
              rx="47"
              ry="31"
              fill="#fff4dc"
              stroke="none"
            />
            <g className="pet-eyes" fill="#40382f" stroke="none">
              {alive && !sleepy && !delighted ? (
                <>
                  <ellipse cx="148" cy="157" rx="5.5" ry="8" />
                  <ellipse cx="210" cy="157" rx="5.5" ry="8" />
                  <circle cx="150" cy="154" r="1.6" fill="white" />
                  <circle cx="212" cy="154" r="1.6" fill="white" />
                </>
              ) : alive ? (
                <g fill="none" stroke="#40382f" strokeWidth="3.5">
                  <path d="m140 158 8-5 8 5m46 0 8-5 8 5" />
                </g>
              ) : (
                <g stroke="#40382f" strokeWidth="3">
                  <path d="m143 152 10 10m0-10-10 10m62-10 10 10m0-10-10 10" />
                </g>
              )}
            </g>
            <ellipse
              cx="130"
              cy="176"
              rx="12"
              ry="6"
              fill="#e9a59d"
              stroke="none"
            />
            <ellipse
              cx="229"
              cy="176"
              rx="12"
              ry="6"
              fill="#e9a59d"
              stroke="none"
            />
            <>
              <path d="M170 173q9-7 18 0l-9 8Z" fill="#40382f" />
              <path d="M179 181v8m-13-1q6 10 13 1 7 9 13-1" fill="none" />
              {delighted && <path d="M172 197q7 21 14 0" fill="#e49d9f" />}
              <path
                d="M126 219q52 25 104-1"
                stroke="#9e87be"
                strokeWidth="10"
              />
              <circle cx="180" cy="233" r="9" fill="#f6cf66" strokeWidth="2" />
            </>
            {creature.evolution_stage === "legendary" && (
              <path
                d="m144 57-6-29 24 13 18-23 18 23 24-13-6 29Z"
                fill="#f6cf66"
              />
            )}
          </>
        )}
      </g>
      {delighted && (
        <g className="love-pops" fill="#b57986">
          <path d="M70 110c-20-19-28 8 0 22 28-14 20-41 0-22Z" />
          <path d="M288 65c-15-14-21 6 0 17 21-11 15-31 0-17Z" />
        </g>
      )}
    </svg>
  );
}
