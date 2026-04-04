import Link from "next/link";
import {
  Heart,
  ArrowRight,
  CheckCircle,
  DollarSign,
  Shield,
  Receipt,
  Clock,
  Star,
  ChevronRight,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const steps = [
  {
    number: "01",
    icon: Clock,
    title: "Tell us your situation",
    time: "2 minutes",
    description:
      "Answer a few quick questions about who you care for, your expenses, and your employment.",
  },
  {
    number: "02",
    icon: DollarSign,
    title: "We scan for money you\u2019re missing",
    time: "Instant",
    description:
      "Our engine cross-references your situation against every federal and state credit, deduction, and benefit.",
  },
  {
    number: "03",
    icon: CheckCircle,
    title: "Get a plan to claim it",
    time: "Actionable",
    description:
      "Receive a personalized report with exact dollar amounts and step-by-step instructions to claim every dollar.",
  },
];

const moneyItems = [
  {
    icon: Receipt,
    title: "Child & Dependent Care Credit",
    amount: "up to $6,000",
    description:
      "If you pay for care so you can work, you likely qualify for this federal credit.",
  },
  {
    icon: Heart,
    title: "Medical Expense Deductions",
    amount: "avg $4,800",
    description:
      "Out-of-pocket medical costs above 7.5% of your income are deductible. Most caregivers exceed this.",
  },
  {
    icon: Shield,
    title: "State Caregiver Programs",
    amount: "varies by state",
    description:
      "Many states offer paid leave, respite care stipends, and caregiver tax credits you may not know about.",
  },
  {
    icon: DollarSign,
    title: "Employer Benefits",
    amount: "FMLA, PFL, EAP",
    description:
      "Your employer may offer paid family leave, flexible spending accounts, and employee assistance programs.",
  },
];

const testimonials = [
  {
    name: "Maria S.",
    role: "Caring for her mother",
    amount: "$8,400",
    quote:
      "I had no idea I was eligible for $8,400 in credits. CareFund found it in 5 minutes.",
    stars: 5,
  },
  {
    name: "James T.",
    role: "Caring for his wife",
    amount: "$5,200",
    quote:
      "Between the medical deductions and state programs, CareFund helped me recover over $5,200 I would have lost.",
    stars: 5,
  },
  {
    name: "Priya K.",
    role: "Caring for her father-in-law",
    amount: "$3,800",
    quote:
      "I didn\u2019t even know my employer offered paid family leave. CareFund found $3,800 in benefits I was missing.",
    stars: 5,
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="size-6 text-primary fill-primary" />
            <span className="text-lg font-bold tracking-tight">CareFund</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <a
              href="#how-it-works"
              className="text-foreground/70 hover:text-foreground transition-colors font-medium"
            >
              How It Works
            </a>
            <a
              href="#what-we-find"
              className="text-foreground/70 hover:text-foreground transition-colors font-medium"
            >
              What We Find
            </a>
            <Link href="/login" className="text-foreground/70 hover:text-foreground transition-colors font-medium">
              Sign In
            </Link>
            <Link
              href="/onboarding"
              className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
            >
              Find My Money
              <ArrowRight className="size-3.5" />
            </Link>
          </nav>
          <div className="flex items-center gap-2 md:hidden">
            <Link
              href="/onboarding"
              className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
            >
              Find My Money
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-secondary/50 to-background py-20 sm:py-28 lg:py-36">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-primary/5 blur-3xl" />
          </div>
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <Badge variant="secondary" className="mb-6">
              <DollarSign className="size-3 text-primary" />
              Average caregiver misses $15,900/year
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              You&apos;re leaving{" "}
              <span className="text-primary">$15,900</span> on the table.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Most caregivers miss tax credits, employer benefits, and state
              programs they&apos;re entitled to. CareFund finds your money in
              minutes.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4">
              <Link
                href="/onboarding"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "gap-2 text-base px-8 h-12 text-lg"
                )}
              >
                Find My Money
                <ArrowRight className="size-5" />
              </Link>
              <p className="text-sm text-muted-foreground">
                Free. Takes 2 minutes. No credit card.
              </p>
            </div>
          </div>
        </section>

        {/* Proof Bar */}
        <section className="border-y bg-card">
          <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-8 text-center sm:grid-cols-3">
              <div>
                <div className="text-3xl font-bold text-primary sm:text-4xl">
                  $15,900
                </div>
                <div className="mt-1 text-sm text-muted-foreground sm:text-base">
                  Avg. unclaimed per caregiver
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary sm:text-4xl">
                  59M
                </div>
                <div className="mt-1 text-sm text-muted-foreground sm:text-base">
                  Americans affected
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary sm:text-4xl">
                  4
                </div>
                <div className="mt-1 text-sm text-muted-foreground sm:text-base">
                  Tax credits most miss
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-20 sm:py-28">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Get your money in 3 steps
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                No paperwork. No waiting. Just answers.
              </p>
            </div>
            <div className="mx-auto mt-14 grid max-w-4xl gap-8 sm:grid-cols-3">
              {steps.map((step) => (
                <div key={step.number} className="relative text-center">
                  <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10">
                    <step.icon className="size-7 text-primary" />
                  </div>
                  <Badge variant="secondary" className="mb-3">
                    {step.time}
                  </Badge>
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What We Find */}
        <section id="what-we-find" className="border-y bg-muted/30 py-20 sm:py-28">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Here&apos;s the money you&apos;re missing
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                These are the most common benefits caregivers don&apos;t claim.
              </p>
            </div>
            <div className="mx-auto mt-14 grid max-w-4xl gap-6 sm:grid-cols-2">
              {moneyItems.map((item) => (
                <Card
                  key={item.title}
                  className="transition-shadow hover:shadow-md"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <item.icon className="size-5 text-primary" />
                      </div>
                      <Badge variant="default" className="shrink-0">
                        {item.amount}
                      </Badge>
                    </div>
                    <CardTitle className="text-base mt-1">
                      {item.title}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {item.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link
                href="/onboarding"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "gap-2 text-base"
                )}
              >
                See what you qualify for
                <ChevronRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-20 sm:py-28">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Real money recovered by real caregivers
              </h2>
            </div>
            <div className="mx-auto mt-14 grid max-w-4xl gap-8 sm:grid-cols-3">
              {testimonials.map((testimonial) => (
                <Card key={testimonial.name} className="flex flex-col">
                  <CardHeader className="flex-1">
                    <div className="mb-1 flex gap-0.5">
                      {Array.from({ length: testimonial.stars }).map((_, i) => (
                        <Star
                          key={i}
                          className="size-4 fill-amber-400 text-amber-400"
                        />
                      ))}
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      {testimonial.amount}
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      &ldquo;{testimonial.quote}&rdquo;
                    </p>
                    <div className="mt-4 pt-4 border-t">
                      <p className="font-semibold text-sm">
                        {testimonial.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {testimonial.role}
                      </p>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t bg-gradient-to-b from-secondary/50 to-background py-20 sm:py-28">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <DollarSign className="mx-auto size-10 text-primary" />
            <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
              Stop leaving money on the table
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              Every day you wait is money you&apos;re not getting back. Find out
              what you&apos;re owed in 2 minutes.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4">
              <Link
                href="/onboarding"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "gap-2 text-base px-8 h-12 text-lg"
                )}
              >
                Find My Money
                <ArrowRight className="size-5" />
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="size-4 text-primary" />
                100% free
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="size-4 text-primary" />
                No credit card needed
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="size-4 text-primary" />
                Results in 2 minutes
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <Link href="/" className="flex items-center gap-2">
              <Heart className="size-5 text-primary fill-primary" />
              <span className="font-bold">CareFund</span>
            </Link>
            <nav className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">
                About
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Terms
              </a>
            </nav>
          </div>
          <div className="mt-6 border-t pt-6 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} CareFund. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
