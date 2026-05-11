// Window — upper-left of the wall, behind the indented shelf area.
// Composed from iteration-4-mobile.html spec: 138x196 absolute box.

export function Window() {
  return (
    <>
      {/* Curtain — pulled to the side */}
      <div
        aria-hidden
        className="absolute z-[6]"
        style={{
          top: "14px",
          left: "6px",
          width: "16px",
          height: "196px",
          background:
            "linear-gradient(90deg,#2a0a08 0%,#6a1a18 50%,#2a0a08 100%)",
          backgroundSize: "8px 100%",
          borderRadius: "0 60% 0 0",
          boxShadow: "inset -4px 0 8px rgba(0,0,0,0.5)",
        }}
      />
      {/* Window frame + sky */}
      <div
        aria-hidden
        className="absolute z-[5] overflow-hidden"
        style={{
          top: "14px",
          left: "14px",
          width: "138px",
          height: "196px",
          border: "7px solid",
          borderColor: "#5a2a18 #2c140a #3e1d10 #5a2a18",
          borderRadius: "3px",
          boxShadow:
            "0 8px 20px rgba(0,0,0,0.7), inset 0 0 24px rgba(0,0,0,0.5)",
          background:
            "radial-gradient(circle at 60% 35%, rgba(232,224,200,0.2) 0%, transparent 40%), linear-gradient(180deg,#050a18 0%,#0e1830 50%,#1a2444 100%)",
        }}
      >
        {/* Moon */}
        <span
          className="absolute"
          style={{
            top: "24%",
            left: "55%",
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 35% 35%,#e8e0c8 0%,#c8b485 60%,#6a5530 100%)",
            boxShadow:
              "0 0 24px rgba(232,224,200,0.5), 0 0 48px rgba(232,224,200,0.25)",
          }}
        />
        {/* Skyline */}
        <span
          className="absolute inset-x-0 bottom-0"
          style={{
            height: "30%",
            background:
              'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.5) 100%), url("data:image/svg+xml;utf8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'60\' viewBox=\'0 0 200 60\'%3E%3Cpath fill=\'%23030710\' d=\'M0 60V35l12-8v8l10-12v18l12-10v-15l16 16v-8l12 6v-10l20 14v-12l14 10v-6l18-16v24l16-14v10l12-8v16l20-12v-8l12 10v-6l16 12v-4l10-8v24z\'/%3E%3C/svg%3E") repeat-x bottom center',
            backgroundSize: "auto, 200px auto",
          }}
        />
        {/* Rain */}
        <span
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(108deg, transparent 49.4%, rgba(200,210,230,0.2) 49.7%, transparent 49.9%), linear-gradient(112deg, transparent 49.4%, rgba(200,210,230,0.13) 49.7%, transparent 49.9%)",
            backgroundSize: "5px 36px, 7px 46px",
          }}
        />
        {/* Mullions (cross) */}
        <span
          className="absolute inset-0 z-[4] pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, transparent calc(50% - 2px), #2c140a calc(50% - 2px), #2c140a calc(50% + 2px), transparent calc(50% + 2px)), linear-gradient(180deg, transparent 33%, #2c140a 33%, #2c140a calc(33% + 3px), transparent calc(33% + 3px), transparent 66%, #2c140a 66%, #2c140a calc(66% + 3px), transparent calc(66% + 3px))",
          }}
        />
        {/* Moonbeam */}
        <span
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 60% 30%, rgba(232,224,200,0.18) 0%, transparent 60%)",
          }}
        />
      </div>
      {/* Open hint shadow */}
      <span
        aria-hidden
        className="absolute z-[6] pointer-events-none"
        style={{
          top: "22px",
          right: "calc(100% - 152px - 6px)",
          width: "12px",
          height: "180px",
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.4) 0%, transparent 100%)",
        }}
      />
      {/* Sill */}
      <span
        aria-hidden
        className="absolute z-[6]"
        style={{
          top: "196px",
          left: "8px",
          width: "152px",
          height: "8px",
          background:
            "linear-gradient(180deg,#7a3e22 0%,#5a2a18 60%,#2c140a 100%)",
          boxShadow:
            "0 4px 10px rgba(0,0,0,0.6), inset 0 2px 0 rgba(154,85,48,0.4)",
          borderRadius: "1px",
        }}
      />
    </>
  );
}
