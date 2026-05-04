import { useEffect, useState } from "react";

interface WorldThresholdProps {
  worldName: string;
  worldDescription: string;
  gmStarted: boolean;
  onDismiss: () => void;
}

export function WorldThreshold({
  worldName,
  worldDescription,
  gmStarted,
  onDismiss,
}: WorldThresholdProps) {
  const [phase, setPhase] = useState<"loading" | "reveal" | "hint">("loading");
  const [showButton, setShowButton] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("reveal"), 1500);
    const t2 = setTimeout(() => setPhase("hint"), 3000);
    const t3 = setTimeout(() => setShowButton(true), 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  useEffect(() => {
    if (gmStarted && !exiting) triggerExit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gmStarted]);

  function triggerExit() {
    setExiting(true);
    setTimeout(onDismiss, 700);
  }

  const displayName = worldName?.trim() || "An Unknown World";
  const displayDesc = worldDescription?.trim() || "";

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
      style={{
        backgroundColor: "rgba(13,13,18,0.92)",
        backdropFilter: "blur(2px)",
        transition: "opacity 0.7s ease, filter 0.7s ease",
        opacity: exiting ? 0 : 1,
        filter: exiting ? "blur(6px)" : "blur(0px)",
      }}
      data-testid="world-threshold"
    >
      <div
        style={{
          transition: "opacity 0.6s ease",
          opacity: phase === "loading" ? 1 : 0,
          position: "absolute",
        }}
        className="flex items-center gap-3"
      >
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: "#c8921a", animation: "pulse-amber 1.2s ease-in-out infinite" }}
        />
        <span
          className="text-xs uppercase"
          style={{ color: "#8a7a5a", letterSpacing: "0.14em" }}
        >
          Your world is being woven…
        </span>
      </div>

      <div
        style={{
          transition: "opacity 0.8s ease, transform 0.8s ease",
          opacity: phase === "reveal" || phase === "hint" ? 1 : 0,
          transform: phase === "reveal" || phase === "hint" ? "translateY(0)" : "translateY(14px)",
          textAlign: "center",
          maxWidth: "520px",
        }}
      >
        <h1
          style={{
            fontFamily: "'Cinzel', 'Cormorant Garamond', serif",
            fontSize: "clamp(1.6rem, 5vw, 2.5rem)",
            fontWeight: 700,
            color: "#f0e8d0",
            letterSpacing: "0.06em",
            lineHeight: 1.15,
            marginBottom: "0.75rem",
          }}
          data-testid="text-world-name"
        >
          {displayName}
        </h1>

        {displayDesc && (
          <p
            style={{
              fontFamily: "'Crimson Text', 'Playfair Display', serif",
              fontSize: "1.125rem",
              color: "#c4b898",
              lineHeight: 1.5,
              marginBottom: "1.25rem",
            }}
            data-testid="text-world-description"
          >
            {displayDesc}
          </p>
        )}

        <div
          style={{
            width: "80px",
            height: "1px",
            backgroundColor: "rgba(200,146,26,0.4)",
            margin: "0 auto 1.75rem",
          }}
        />

        <p
          style={{
            transition: "opacity 0.8s ease",
            opacity: phase === "hint" ? 1 : 0,
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.875rem",
            color: "#8a7a5a",
            letterSpacing: "0.09em",
          }}
        >
          Type anything to shape your legend.
        </p>
      </div>

      {showButton && (
        <button
          onClick={triggerExit}
          data-testid="button-enter-world"
          style={{
            marginTop: "2.5rem",
            padding: "0.65rem 2rem",
            backgroundColor: "#c8921a",
            color: "#0d0d12",
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.875rem",
            fontWeight: 600,
            letterSpacing: "0.08em",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            animation: "fade-up-in 0.5s ease forwards",
          }}
        >
          Enter the World
        </button>
      )}

      <style>{`
        @keyframes pulse-amber {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.7); }
        }
        @keyframes fade-up-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
