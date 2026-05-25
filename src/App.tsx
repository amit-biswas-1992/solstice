export default function App() {
  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">Electron + React Scaffold</p>
        <h1>Daily Notes Desktop</h1>
        <p className="lede">
          Task 1 scaffold is in place and ready for the storage, auth, and
          workspace tasks that follow.
        </p>
        <p className="build-tag">Bridge v{window.dailyNotesDesktop.version}</p>
      </section>
    </main>
  );
}
