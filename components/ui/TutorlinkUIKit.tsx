'use client';
import React, { useMemo, useState } from "react";
import Link from 'next/link'
import Image from 'next/image'

/**
 * Tutorlink Tailwind/React UI Kit
 * - Single-file drop-in. No external UI deps.
 * - Tailwind required. Designed for dark theme with elegant gradients.
 * - Components: Container, Badge, Button, Card, Navbar, Hero, StepTimeline,
 *   FilterBar, TutorCard, TestimonialRail, Footer.
 * - Demo page at bottom (export default function Landing()).
 */

/*************************
 * Primitive Components   *
 *************************/
const Container: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = "", ...props }) => (
  <div className={"mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 " + className} {...props} />
);

const Badge: React.FC<{ children: React.ReactNode; tone?: "teal" | "coral" | "slate" } & React.HTMLAttributes<HTMLSpanElement>> = ({ children, tone = "teal", className = "", ...props }) => {
  const tones: Record<string, string> = {
    teal: "bg-teal-500/10 text-teal-300 ring-1 ring-inset ring-teal-400/20",
    coral: "bg-rose-500/10 text-rose-300 ring-1 ring-inset ring-rose-400/20",
    slate: "bg-slate-500/10 text-slate-300 ring-1 ring-inset ring-slate-400/20",
  };
  return (
    <span className={["inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium backdrop-blur ", tones[tone], className].join(" ")} {...props}>
      {children}
    </span>
  );
};

const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  href?: string;
  className?: string;
}> = ({ children, onClick, variant = "primary", size = "md", href, className = "" }) => {
  const base = "group inline-flex items-center justify-center rounded-2xl font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400 disabled:opacity-60";
  const sizes: Record<string, string> = {
    sm: "text-sm px-3 py-2",
    md: "text-sm px-4 py-2.5",
    lg: "text-base px-5 py-3",
  };
  const variants: Record<string, string> = {
    primary:
      "bg-gradient-to-tr from-teal-500 to-cyan-400 text-slate-900 hover:shadow-lg hover:shadow-teal-500/25 active:scale-[.98]",
    secondary:
      "bg-slate-800/70 text-slate-200 ring-1 ring-white/10 hover:bg-slate-700/70 hover:ring-white/20 backdrop-blur",
    ghost:
      "text-slate-200 hover:text-white hover:bg-white/5 ring-1 ring-white/10",
  };
  const Comp: React.ElementType = href ? 'a' : 'button';
  return (
    <Comp href={href} onClick={onClick} className={[base, sizes[size], variants[variant], className].join(" ")}>{children}
      <span className="ml-1 transition-transform duration-200 group-hover:translate-x-0.5">→</span>
    </Comp>
  );
};

const Card: React.FC<{ children: React.ReactNode; className?: string; hover?: boolean } & React.HTMLAttributes<HTMLDivElement>> = ({ children, className = "", hover = true, ...props }) => (
  <div
    className={[
      "rounded-2xl bg-white/5 p-5 text-slate-200 shadow-sm ring-1 ring-white/10",
      hover && "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/20 hover:ring-white/20",
      className,
    ].join(" ")}
    {...props}
  >
    {children}
  </div>
);

/*************************
 * Higher Level UI        *
 *************************/
const Navbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/60 backdrop-blur supports-[backdrop-filter]:bg-slate-950/40">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="font-extrabold tracking-[0.3em] text-slate-100">TUTORLINK</Link>
        <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
          <Link className="hover:text-white" href="/">How it works</Link>
          <Link className="hover:text-white" href="/">Why us</Link>
          <Link className="hover:text-white" href="/tutor/feed">Tutors</Link>
          <Link className="hover:text-white" href="/">FAQs</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" href="/auth/sign-in">Sign in</Button>
          <Button size="sm" href="/tutor/feed">Find a tutor</Button>
        </div>
      </Container>
    </header>
  );
};

const Hero: React.FC = () => {
  return (
    <section className="relative overflow-hidden">
      <Container className="py-14 sm:py-20">
        <Badge tone="teal" className="mb-4">Learn 1-on-1 • Offline • Your place & time</Badge>
        <h1 className="max-w-4xl text-balance text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
          Easily <span className="bg-gradient-to-tr from-teal-300 via-cyan-200 to-white bg-clip-text text-transparent">find</span> –
          <span className="bg-gradient-to-tr from-teal-300 via-cyan-200 to-white bg-clip-text text-transparent"> choose</span> – connect with quality tutors
        </h1>
        <p className="mt-4 max-w-2xl text-slate-300">Learn 1-on-1, offline, at your preferred time & place. No endless messaging — book in seconds.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button size="lg" href="/tutor/feed">Find a tutor</Button>
          <Button size="lg" variant="secondary" href="/tutor/apply">Become a tutor</Button>
        </div>

        {/* Quick search mock */}
        <div className="mt-10 grid gap-3 rounded-2xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur sm:grid-cols-4">
          <input className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-400 focus:border-teal-400 focus:outline-none" placeholder="Subject (e.g., Math)" />
          <input className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-400 focus:border-teal-400 focus:outline-none" placeholder="Location" />
          <input className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-400 focus:border-teal-400 focus:outline-none" placeholder="Time" />
          <Button className="w-full" variant="secondary">Search</Button>
        </div>
      </Container>
    </section>
  );
};

const StepTimeline: React.FC = () => {
  const steps = [
    { n: 1, title: "Sign up in 30s", desc: "Create your account and profile." },
    { n: 2, title: "Choose subject & style", desc: "Filter by subject, location, time, budget." },
    { n: 3, title: "Browse verified profiles", desc: "View ratings, experience, and intro video." },
    { n: 4, title: "Book instantly", desc: "Pick a time slot that fits your schedule." },
    { n: 5, title: "Feedback after lesson", desc: "Help improve quality across the platform." },
  ];
  return (
    <section id="how" className="border-t border-white/10">
      <Container className="py-14 sm:py-20">
        <h2 className="mb-8 text-2xl font-bold text-white sm:text-3xl">How it works</h2>
        <div className="grid gap-4 md:grid-cols-5">
          {steps.map((s) => (
            <Card key={s.n} className="relative">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-teal-500/20 text-teal-300 ring-1 ring-teal-400/20">{s.n}</div>
              <h3 className="text-base font-semibold text-white">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-400">{s.desc}</p>
              <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/0 transition-all duration-200 hover:ring-white/20" />
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
};

const FilterBar: React.FC = () => {
  return (
    <div className="sticky top-16 z-30 border-b border-white/10 bg-slate-950/60 backdrop-blur">
      <Container className="flex flex-wrap items-center gap-2 py-3">
        {[
          "Subject",
          "Location",
          "Format",
          "Time",
          "Price",
          "Rating",
          "More filters",
        ].map((f) => (
          <button
            key={f}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10"
          >
            {f}
          </button>
        ))}
        <div className="ml-auto">
          <Button variant="secondary" size="sm">Reset</Button>
        </div>
      </Container>
    </div>
  );
};

type Tutor = {
  id: number;
  name: string;
  subject: string;
  location: string;
  price: string;
  rating: number;
  reviews: number;
  avatar?: string;
};

const sampleTutors: Tutor[] = new Array(8).fill(0).map((_, i) => ({
  id: i + 1,
  name: `Tutor ${i + 1}`,
  subject: "Math • Physics",
  location: ["Hanoi", "Da Nang", "HCM"][(i % 3)],
  price: "120.000đ / 90min",
  rating: 4.8,
  reviews: 69 + i,
  avatar: "https://i.pravatar.cc/120?img=" + ((i + 10) % 70),
}));

const TutorCard: React.FC<{ t: Tutor }> = ({ t }) => (
  <Card className="flex gap-4 p-4">
    <Image src={t.avatar || ''} alt={t.name} width={64} height={64} className="h-16 w-16 rounded-2xl object-cover" />
    <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between gap-3">
        <h3 className="truncate text-lg font-semibold text-white">{t.name}</h3>
        <Badge tone="teal">{t.rating.toFixed(1)} ★ ({t.reviews})</Badge>
      </div>
      <p className="mt-1 text-sm text-slate-300">{t.subject}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-400">
        <span className="rounded-lg bg-white/5 px-2 py-1">{t.location}</span>
        <span className="rounded-lg bg-white/5 px-2 py-1">1:1 • Small group</span>
        <span className="rounded-lg bg-white/5 px-2 py-1">{t.price}</span>
      </div>
      <div className="mt-3 flex gap-2">
        <Button size="sm" href={`/booking/${t.id}`}>Book now</Button>
        <Button size="sm" variant="secondary" href={`/tutor/${t.id}`}>View more</Button>
      </div>
    </div>
  </Card>
);

const TestimonialRail: React.FC = () => {
  return (
    <section id="faq" className="border-t border-white/10">
      <Container className="py-14 sm:py-20">
        <h2 className="mb-6 text-2xl font-bold text-white sm:text-3xl">What students say</h2>
        <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
          {new Array(8).fill(0).map((_, i) => (
            <Card key={i} className="min-w-[320px] max-w-sm">
              <div className="mb-3 flex items-center gap-3">
                <Image src={`https://i.pravatar.cc/80?img=${(i + 20) % 70}`} alt="avatar" width={40} height={40} className="h-10 w-10 rounded-xl object-cover" />
                <div>
                  <p className="text-sm font-semibold text-white">Person {i + 1}</p>
                  <p className="text-xs text-slate-400">Learner</p>
                </div>
              </div>
              <p className="text-sm text-slate-300">“Great experience. Booking was fast, tutor was kind, and offline learning helped me focus.”</p>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
};

const Footer: React.FC = () => (
  <footer className="border-t border-white/10">
    <Container className="grid gap-10 py-14 sm:grid-cols-2 md:grid-cols-4">
      <div>
        <p className="font-extrabold tracking-[0.3em] text-white">TUTORLINK</p>
        <p className="mt-3 max-w-xs text-sm text-slate-400">We help you easily find – choose – connect with quality tutors near you.</p>
      </div>
      <div>
        <p className="mb-3 font-semibold text-white">For students</p>
        <ul className="space-y-2 text-sm text-slate-300">
          <li><Link className="hover:text-white" href="/tutor/feed">Find a tutor</Link></li>
          <li><Link className="hover:text-white" href="/">How it works</Link></li>
          <li><Link className="hover:text-white" href="/">FAQs</Link></li>
        </ul>
      </div>
      <div>
        <p className="mb-3 font-semibold text-white">For tutors</p>
        <ul className="space-y-2 text-sm text-slate-300">
          <li><Link className="hover:text-white" href="/tutor/apply">Become a tutor</Link></li>
          <li><Link className="hover:text-white" href="/tutor/feed">Opportunities</Link></li>
        </ul>
      </div>
      <div>
        <p className="mb-3 font-semibold text-white">Get in touch</p>
        <div className="flex gap-2">
          <input className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-teal-400 focus:outline-none" placeholder="Enter your email" />
          <Button variant="secondary" size="sm">Subscribe</Button>
        </div>
      </div>
    </Container>
    <div className="border-t border-white/10 py-6 text-center text-xs text-slate-500">© 2025 Tutorlink. All rights reserved.</div>
  </footer>
);

/*************************
 * Demo Page              *
 *************************/
export default function Landing() {
  const [tutors] = useState<Tutor[]>(sampleTutors);
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-200">
      <main>
        <Hero />
        <StepTimeline />
        <FilterBar />
        <section id="tutors">
          <Container className="py-10">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white sm:text-3xl">Tutor suggestions</h2>
                <p className="mt-1 text-sm text-slate-400">Verified & trusted tutors near you</p>
              </div>
              <Button variant="secondary" size="sm" href="/tutor/feed">View more</Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {tutors.map((t) => (
                <TutorCard key={t.id} t={t} />
              ))}
            </div>
          </Container>
        </section>
        <TestimonialRail />
      </main>
    </div>
  );
}
