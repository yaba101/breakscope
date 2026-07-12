import { Check, Cloud, LockKeyhole, Shapes } from "lucide-react";
import { cn } from "@/lib/cn";

const plans = [
  { name: "Starter", price: "$0", sub: "Forever", action: "Get started", features: ["1 project", "5 GB storage", "Community support"] },
  { name: "Pro", price: "$29", sub: "per month", action: "Start free trial", features: ["Unlimited projects", "100 GB storage", "Priority support", "Advanced analytics"] },
  { name: "Enterprise", price: "Custom", sub: "Contact sales", action: "Contact sales", features: ["Unlimited projects", "Unlimited storage", "Dedicated support", "SLA & security"] },
];

export function DemoSite({ candidate = false, compact = false }: { candidate?: boolean; compact?: boolean }) {
  return (
    <div className={cn("demo-site", compact && "compact")}>
      <header className="demo-header">
        <span className="demo-brand"><Cloud size={14} /> Acme Cloud</span>
        <nav><span>Product</span><span>Solutions</span><span className="active">Pricing</span><span>Docs</span><span>Company</span></nav>
        <div><span>Log in</span><button>Get started</button></div>
      </header>
      <main className="demo-main">
        <span className="eyebrow">PRICING</span>
        <h2>Simple, transparent pricing</h2>
        <p>Choose the plan that&apos;s right for you. Scale up or down<br />anytime. No hidden fees.</p>
        <div className="billing-toggle"><b>Monthly</b><span>Yearly</span><em>Save 20%</em></div>
        <div className="plan-grid">
          {plans.map((plan, index) => (
            <article key={plan.name} className={cn("plan-card", index === 1 && "featured", candidate && index === 1 && "candidate-shift")}>
              <div className="plan-title"><strong>{plan.name}</strong>{index === 1 && <span>Popular</span>}</div>
              <h3>{plan.price}</h3><small>{plan.sub}</small>
              <p>{index === 0 ? "Perfect for trying out Acme Cloud and small projects." : index === 1 ? "For growing teams that need more power and flexibility." : "For organizations with advanced security and compliance needs."}</p>
              <ul>{plan.features.map((feature) => <li key={feature}><Check size={10} />{feature}</li>)}</ul>
              <button className={index === 1 ? "primary" : ""}>{plan.action}</button>
              {candidate && index === 1 && <div className="measure measure-top">24px</div>}
            </article>
          ))}
        </div>
        <h4>All plans include</h4>
        <footer><span><Shapes size={12} /> 99.9% uptime SLA</span><span><LockKeyhole size={12} /> Secure by design</span><span>24/7 support</span><span>Easy integrations</span></footer>
      </main>
    </div>
  );
}
