export default function App() {
  return (
    <main className="page">
      <section className="welcome-card" aria-labelledby="welcome-title">
        <div className="mark" aria-hidden="true">C</div>
        <p className="eyebrow">CBC UIDMS</p>
        <h1 id="welcome-title">Your workspace starts here.</h1>
        <p className="description">
          The frontend is ready. Build your next workflow from this starting point.
        </p>
        <a className="button" href="https://react.dev/learn" target="_blank" rel="noreferrer">
          Explore React <span aria-hidden="true">↗</span>
        </a>
      </section>
      <footer>Built with React</footer>
    </main>
  );
}
