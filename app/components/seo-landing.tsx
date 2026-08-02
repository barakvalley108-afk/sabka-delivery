import Link from "next/link";

type Props = {
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
  cta: string;
};

export default function SeoLanding({ eyebrow, title, description, points, cta }: Props) {
  return (
    <main style={{ minHeight: "100vh", background: "#fffdf7", color: "#17211b", padding: "40px 20px" }}>
      <article style={{ maxWidth: 760, margin: "0 auto", background: "#fff", border: "1px solid #e7eadf", borderRadius: 24, padding: 28, boxShadow: "0 14px 40px rgba(23,33,27,.08)" }}>
        <p style={{ color: "#18794e", fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", margin: 0 }}>{eyebrow}</p>
        <h1 style={{ fontSize: "clamp(2rem,7vw,3.7rem)", lineHeight: 1.05, margin: "14px 0" }}>{title}</h1>
        <p style={{ fontSize: 18, lineHeight: 1.65, color: "#526158" }}>{description}</p>
        <ul style={{ lineHeight: 1.9, paddingLeft: 22 }}>
          {points.map((point) => <li key={point}>{point}</li>)}
        </ul>
        <Link href="/" style={{ display: "inline-block", marginTop: 18, padding: "14px 22px", borderRadius: 14, background: "#18864b", color: "#fff", fontWeight: 800, textDecoration: "none" }}>{cta}</Link>
        <nav aria-label="Sabka Delivery quick links" style={{ marginTop: 28, display: "flex", flexWrap: "wrap", gap: 14 }}>
          <Link href="/food-delivery">Food</Link>
          <Link href="/grocery-delivery">Grocery</Link>
          <Link href="/electronics-delivery">Electronics</Link>
          <Link href="/track-order">Track Order</Link>
        </nav>
      </article>
    </main>
  );
}
