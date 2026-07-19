import Image from "next/image";

const signals = [
  ["Water", "Natural drainage lines and retention opportunities"],
  ["Slope", "Buildable terraces and low-disturbance access"],
  ["Vegetation", "Existing ecological structure worth preserving"],
  ["Opportunity", "Wellness-led, low-density development"],
];

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">PSM AI · TERRITORY INSPECTION</p>
          <h1>Upload a survey.<br />Bob will read the territory.</h1>
          <p className="lead">The land is already speaking. Bob combines terrain, water, vegetation, access and development logic into one clear territorial reading.</p>
          <div className="actions">
            <button>Inspect territory</button>
            <span>Demo site: Colina Condesa</span>
          </div>
        </div>
        <div className="bob-card">
          <Image src="/assets/bob.jpg" alt="Bob, PSM AI territory inspector" fill priority />
          <div className="bob-caption"><strong>Bob</strong><span>AI territory inspector</span></div>
        </div>
      </section>

      <section className="dashboard">
        <div className="dashboard-header">
          <div><p className="eyebrow">FIRST READING</p><h2>What the land wants to become</h2></div>
          <div className="score"><strong>86</strong><span>Opportunity score</span></div>
        </div>
        <div className="grid">
          <div className="visual"><Image src="/assets/wellness-territory.png" alt="Wellness architecture and territory" fill /></div>
          <div className="signals">
            {signals.map(([title, text]) => <article key={title}><span>{title}</span><p>{text}</p></article>)}
          </div>
        </div>
        <blockquote>“Do not flatten me. Work with my water, protect my trees, and place architecture where the ground already agrees.”</blockquote>
      </section>
    </main>
  );
}
