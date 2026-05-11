// Brass wall-sconce with red shade — to the right of the window, mounted on the wall.
// Positioned absolutely; parent positions it inside .wall (room).

export function Sconce() {
  return (
    <div
      aria-hidden
      className="absolute z-[9] pointer-events-none text-center"
      style={{ top: "80px", right: "38px", width: "40px" }}
    >
      {/* Halo */}
      <span
        className="absolute -z-[1] pointer-events-none"
        style={{
          top: "-20px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "220px",
          height: "140px",
          background:
            "radial-gradient(ellipse, rgba(255,122,85,0.3) 0%, transparent 65%)",
        }}
      />
      {/* Bracket */}
      <div
        className="mx-auto"
        style={{
          width: "22px",
          height: "5px",
          background:
            "linear-gradient(180deg,#d8b06a 0%,#b58c4a 60%,#6a4520 100%)",
          borderRadius: "3px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.7)",
        }}
      />
      {/* Arm */}
      <div
        className="mx-auto"
        style={{
          width: "3px",
          height: "8px",
          background: "linear-gradient(90deg,#6a4520 0%,#d8b06a 50%,#6a4520 100%)",
        }}
      />
      {/* Shade */}
      <div
        className="relative mx-auto"
        style={{
          width: "36px",
          height: "26px",
          background: "linear-gradient(180deg,#c84838 0%,#8a2818 100%)",
          borderRadius: "50% 50% 6px 6px / 60% 60% 6px 6px",
          boxShadow:
            "0 4px 10px rgba(0,0,0,0.7), inset 0 -10px 16px rgba(255,122,85,0.65)",
        }}
      >
        <span
          aria-hidden
          className="absolute"
          style={{
            bottom: "-2px",
            left: "6%",
            right: "6%",
            height: "2px",
            background: "#b58c4a",
          }}
        />
      </div>
    </div>
  );
}
