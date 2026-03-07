export function Hero() {
  return (
    <section className="molingo-card animate-pop" style={{ padding: 24, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ marginTop: 0, marginBottom: 10, fontSize: "clamp(2rem, 5vw, 3rem)" }}>Molingo</h1>
          <p style={{ margin: 0, maxWidth: 560, fontSize: 18 }}>
            Gujarati speaking practice from zero, with playful animals and bite-sized lessons.
          </p>
        </div>
        <div
          style={{
            borderRadius: 18,
            padding: "12px 16px",
            background: "linear-gradient(135deg, #b7f4cd 0%, #d2f2ff 100%)",
            fontWeight: 800,
            minWidth: 180,
            textAlign: "center"
          }}
        >
          <div>Daily Goal</div>
          <div style={{ fontSize: 28 }}>10 min</div>
          <div style={{ fontSize: 14, opacity: 0.8 }}>Speaking + Listening</div>
        </div>
      </div>
    </section>
  );
}
