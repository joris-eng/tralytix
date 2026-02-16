import Link from "next/link";

export default function HomePage() {
  return (
    <section className="card">
      <h1>Trading SaaS Web</h1>
      <p className="muted">MVP frontend connected to the Go API.</p>
      <div className="row">
        <Link href="/login">Go to Login</Link>
        <Link href="/chart">Go to Chart</Link>
        <Link href="/stats">Go to Stats</Link>
      </div>
    </section>
  );
}
