interface CharacterHintPillProps {
  onDismiss: () => void;
  onOpen: () => void;
}

export function CharacterHintPill({ onDismiss, onOpen }: CharacterHintPillProps) {
  return (
    <div
      role="button"
      aria-label="Open character sheet"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={e => e.key === "Enter" && onOpen()}
      data-testid="pill-character-hint"
      style={{
        position: "fixed",
        bottom: "104px",
        left: "24px",
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "8px 14px",
        backgroundColor: "#1a1b26",
        border: "1px solid rgba(200,146,26,0.3)",
        borderRadius: "8px",
        cursor: "pointer",
        animation: "slide-up 0.4s ease forwards",
      }}
    >
      <span style={{ color: "#c8921a", fontSize: "14px" }}>⚔</span>
      <span
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "0.8125rem",
          color: "#8a7a5a",
          whiteSpace: "nowrap",
        }}
      >
        Your stats and inventory are here
      </span>
      <span style={{ color: "#c8921a", fontSize: "12px" }}>→</span>

      <button
        aria-label="Dismiss hint"
        data-testid="button-dismiss-char-hint"
        onClick={e => { e.stopPropagation(); onDismiss(); }}
        style={{
          marginLeft: "4px",
          background: "none",
          border: "none",
          color: "#4a4535",
          fontSize: "16px",
          cursor: "pointer",
          lineHeight: 1,
          padding: "0 2px",
        }}
      >
        ×
      </button>

      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
