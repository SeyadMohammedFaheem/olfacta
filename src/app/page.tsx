import Link from "next/link";
import { FlaskConical, ArrowRight, Shield, GitBranch, Factory, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
              <FlaskConical className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Olfacta</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">Start Formulating</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Formulate with confidence.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            Create, validate, version, and scale fragrance formulas from one professional workspace.
            Built for perfumers and fragrance manufacturers who need precision and compliance.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <Button size="lg" asChild>
              <Link href="/signup">
                Start Formulating
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/login">Log in</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Professional tools for fragrance development
          </h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={FlaskConical}
              title="Formula Workspace"
              description="Add ingredients, edit quantities, see percentages and compliance status update in real time."
            />
            <FeatureCard
              icon={Shield}
              title="Compliance Engine"
              description="Configurable rule-based validation against product context, market, and application area."
            />
            <FeatureCard
              icon={GitBranch}
              title="Version Control"
              description="Track every change. Create versions, compare formulas, and maintain full audit history."
            />
            <FeatureCard
              icon={Factory}
              title="Production Scaling"
              description="Scale any approved formula to production batch size with precise ingredient quantities."
            />
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {[
              "Create Formula",
              "Add Ingredients",
              "Validate Compliance",
              "Submit for Review",
              "Approve Formula",
              "Create Production Batch",
            ].map((step, i) => (
              <div key={step} className="flex items-start gap-3 rounded-lg border p-4">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                  {i + 1}
                </span>
                <span className="text-sm font-medium">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-xs text-muted-foreground">
          <p>Olfacta — Professional Perfume Formulation & Compliance</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
