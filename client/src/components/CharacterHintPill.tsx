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
        top: "56px",
        right: "20px",
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "8px 14px",
        backgroundColor: "#1a1b26",
        border: "1px solid rgba(200,146,26,0.3)",
        borderRadius: "8px",
        cursor: "pointer",
        boxShadow: "0 6px 20px rgba(0,0,0,0.45)",
        animation: "char-hint-slide-down 0.4s ease forwards",
      }}
    >
      <span style={{ color: "#c8921a", fontSize: "16px", lineHeight: 1 }}>↑</span>
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

      {/* Triangle pointer pointing up toward the character icon in the header */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "-7px",
          right: "14px",
          width: 0,
          height: 0,
          borderLeft: "7px solid transparent",
          borderRight: "7px solid transparent",
          borderBottom: "7px solid #1a1b26",
          filter: "drop-shadow(0 -1px 0 rgba(200,146,26,0.3))",
        }}
      />

      <style>{`
        @keyframes char-hint-slide-down {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
