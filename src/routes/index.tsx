import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import heroDish from "@/assets/hero-dish.jpg";

export const Route = createFileRoute("/")({
  component: ProposalPage,
});

/* ---------------------------- Data ---------------------------- */

const TOC = [
  { id: "executive-summary", label: "1. Executive Summary" },
  { id: "objectives", label: "2. Business Objectives" },
  { id: "scope", label: "3. Project Scope" },
  { id: "pages", label: "4. Page Specifications" },
  { id: "design-system", label: "5. UI/UX Design System" },
  { id: "ux-flow", label: "6. User Experience Flow" },
  { id: "database", label: "7. Database Design" },
  { id: "architecture", label: "8. Technology Architecture" },
  { id: "functional", label: "9. Functional Requirements" },
  { id: "non-functional", label: "10. Non-Functional Requirements" },
  { id: "roadmap", label: "11. Development Roadmap" },
  { id: "metrics", label: "12. Success Metrics" },
  { id: "advantage", label: "13. Competitive Advantage" },
  { id: "blueprint", label: "14. Design & Build Blueprint" },
];

const COLORS: { name: string; hex: string; role: string; purpose: string }[] = [
  { name: "Primary", hex: "#FF6B35", role: "Orange", purpose: "Appetite-triggering CTA, highlights, promo badges." },
  { name: "Secondary", hex: "#2D3142", role: "Deep Navy", purpose: "Headers, footers, navigation, premium contrast." },
  { name: "Accent", hex: "#06D6A0", role: "Mint Green", purpose: "Success states, fresh/healthy tags, confirmations." },
  { name: "Background", hex: "#F8F9FA", role: "Light Gray", purpose: "Page canvas, reduces glare, elevates cards." },
  { name: "Surface", hex: "#FFFFFF", role: "White", purpose: "Cards, modals, product tiles." },
  { name: "Text Primary", hex: "#212529", role: "Ink", purpose: "Body copy, primary readable text." },
  { name: "Text Secondary", hex: "#6C757D", role: "Slate", purpose: "Metadata, captions, helper text." },
  { name: "Success", hex: "#2ECC71", role: "Green", purpose: "Order delivered, payment success." },
  { name: "Warning", hex: "#FFC107", role: "Amber", purpose: "Low stock, delayed order, verification." },
  { name: "Danger", hex: "#DC3545", role: "Red", purpose: "Errors, cancellations, destructive actions." },
  { name: "Info", hex: "#17A2B8", role: "Teal", purpose: "Notifications, help tips, system messages." },
];

const CUSTOMER_PAGES = [
  { name: "Home", purpose: "Convert first-time visitors and re-engage returning customers.", user: "All visitors", components: "Hero, category rail, featured meals, offers strip, testimonials, download-app band, footer.", actions: "Search food, browse categories, add to cart, book table, subscribe.", outcome: "User discovers menu and initiates first order within 60 seconds." },
  { name: "Menu", purpose: "Full browsable catalogue with filters and search.", user: "Diners", components: "Sticky filter bar, category chips, sort dropdown, grid of food cards, pagination.", actions: "Filter (price, diet, rating), sort, add to cart, favourite.", outcome: "User locates desired item quickly." },
  { name: "Food Details", purpose: "Deep product page for informed ordering.", user: "Diners", components: "Gallery, description, nutrition, add-ons, quantity, related items, reviews.", actions: "Customize, select add-ons, add to cart, share.", outcome: "Higher average order value via upsell add-ons." },
  { name: "Categories", purpose: "Curated category landing (Pizza, Burgers, Drinks…).", user: "Browsers", components: "Category banner, sub-category chips, item grid.", actions: "Filter within category.", outcome: "Guided browsing." },
  { name: "Offers", purpose: "Central promotions hub.", user: "Deal-seekers", components: "Offer cards, expiry timers, coupon reveal, T&Cs.", actions: "Copy coupon, apply, share offer.", outcome: "Boost conversion during low periods." },
  { name: "Cart", purpose: "Review items before checkout.", user: "Buyers", components: "Line items with qty, coupon field, subtotal, delivery fee, tax, total, CTA.", actions: "Update qty, remove, apply coupon, proceed.", outcome: "Reduced cart abandonment." },
  { name: "Checkout", purpose: "Frictionless multi-step purchase.", user: "Buyers", components: "Address, delivery slot, payment method, order summary, place-order.", actions: "Enter address, choose slot, pay.", outcome: "Order placed in ≤ 3 steps." },
  { name: "Order Tracking", purpose: "Live delivery visibility.", user: "Buyers", components: "Status stepper, map with rider pin, ETA, rider contact.", actions: "Call rider, chat, tip.", outcome: "Reduces support calls & anxiety." },
  { name: "Reservation", purpose: "Book a table for dine-in.", user: "Diners", components: "Date/time picker, party size, table zone, notes.", actions: "Confirm booking, receive email confirmation.", outcome: "Additional revenue stream." },
  { name: "Reviews", purpose: "Public social proof.", user: "All", components: "Rating summary, verified badge, filter by stars, media in reviews.", actions: "Read, mark helpful.", outcome: "Higher trust." },
  { name: "Contact", purpose: "Reach the restaurant directly.", user: "All", components: "Form, phone, WhatsApp, embedded map, hours.", actions: "Send message.", outcome: "Support ticket created." },
  { name: "About", purpose: "Brand story & credibility.", user: "All", components: "Story, chef bios, awards, sourcing philosophy.", actions: "Read, share.", outcome: "Emotional brand connection." },
  { name: "Blog", purpose: "SEO & content marketing.", user: "Visitors", components: "Article grid, categories, tags, author, related posts.", actions: "Read, share, subscribe.", outcome: "Organic traffic growth." },
  { name: "FAQ", purpose: "Self-service answers.", user: "All", components: "Search, categorized accordion.", actions: "Expand, search.", outcome: "Fewer support tickets." },
  { name: "Login", purpose: "Authenticate existing users.", user: "Returning users", components: "Email/password, social login, remember-me, forgot link.", actions: "Sign in.", outcome: "Personalized experience unlocked." },
  { name: "Registration", purpose: "Create new account.", user: "New users", components: "Form, OTP, T&C, social sign-up.", actions: "Register, verify.", outcome: "New verified customer." },
  { name: "Forgot Password", purpose: "Password recovery.", user: "Locked out users", components: "Email input, OTP, new password.", actions: "Reset.", outcome: "Account restored." },
  { name: "Terms & Privacy", purpose: "Legal compliance (GDPR/NDPR).", user: "All", components: "Long-form legal, TOC, last-updated.", actions: "Read.", outcome: "Regulatory compliance." },
  { name: "404 Page", purpose: "Graceful error recovery.", user: "All", components: "Illustration, search, popular links.", actions: "Return home, search.", outcome: "Retain lost visitors." },
];

const CUSTOMER_DASHBOARD = [
  ["Dashboard", "At-a-glance snapshot: recent order, loyalty points, active coupons."],
  ["Profile", "Manage personal info, avatar, preferences, dietary flags."],
  ["Orders", "Live orders with status pills and re-order shortcut."],
  ["Order History", "Paginated past orders with invoice download."],
  ["Addresses", "CRUD saved addresses with default pin."],
  ["Wishlist", "Favourited meals, quick add-to-cart."],
  ["Notifications", "In-app alerts: order updates, promos, replies."],
  ["Loyalty Points", "Balance, tier, redemption catalogue."],
  ["Coupons", "Active/expired coupons with copy-to-clipboard."],
  ["Reviews", "Manage own reviews, edit, delete."],
  ["Reservations", "Upcoming/past bookings, cancel/modify."],
  ["Payment Methods", "Saved cards & wallets, tokenized via Stripe."],
  ["Security Settings", "Password, 2FA, active sessions, delete account."],
  ["Logout", "End session across devices option."],
];

const ADMIN_MODULES = [
  ["Dashboard", "KPIs: revenue today, orders, avg prep time, active riders."],
  ["Analytics", "Cohort retention, funnel, top-selling items, heat-maps."],
  ["Menu Management", "CRUD items, variants, add-ons, availability toggle."],
  ["Category Management", "Nested categories, drag-sort, icons, SEO slugs."],
  ["Inventory", "Stock levels, low-stock alerts, waste tracking (Phase 3)."],
  ["Orders", "Kanban board: New → Preparing → Ready → Out → Delivered."],
  ["Customers", "Segmentation, LTV, blocklist, GDPR export/erase."],
  ["Delivery Riders", "Onboarding, live map, earnings, ratings."],
  ["Reservations", "Floor plan, table assignment, walk-ins."],
  ["Reviews", "Moderation, reply, flag as spam."],
  ["Promotions", "Time-boxed campaigns, banners, targeted audiences."],
  ["Coupons", "Percentage/fixed/BOGO, usage caps, first-order flags."],
  ["Payments", "Ledger, payouts, refunds, dispute log."],
  ["Sales Reports", "Daily/weekly/monthly exports, tax reports, PDF/CSV."],
  ["Settings", "Store hours, delivery zones, tax rules, branding."],
  ["Roles & Permissions", "Granular RBAC: Owner/Manager/Kitchen/Cashier/Rider."],
  ["Activity Logs", "Immutable audit trail with user, IP, action."],
  ["Notifications", "Broadcast push/email/SMS to segments."],
];

const DB_TABLES = [
  ["users", "Base auth identity", "id", "role_id", "1‑1 profile, 1‑n orders"],
  ["roles", "RBAC definitions", "id", "—", "1‑n users"],
  ["customers", "Diner profile extension", "id", "user_id", "1‑n addresses, favourites"],
  ["staff", "Employee extension of users", "id", "user_id, role_id", "1‑n orders_prepared"],
  ["restaurants", "Multi-branch support", "id", "—", "1‑n menu_items, orders"],
  ["categories", "Menu taxonomy", "id", "parent_id", "1‑n menu_items"],
  ["menu_items", "Sellable dishes", "id", "category_id, restaurant_id", "n‑n add_ons"],
  ["ingredients", "Recipe atoms", "id", "—", "n‑n menu_items"],
  ["inventory", "Stock ledger", "id", "ingredient_id, restaurant_id", "reduced by order"],
  ["orders", "Header record", "id", "customer_id, address_id, coupon_id", "1‑n order_items, 1‑1 payment"],
  ["order_items", "Line items", "id", "order_id, menu_item_id", "—"],
  ["payments", "Transaction log", "id", "order_id", "1‑n refunds"],
  ["coupons", "Discount rules", "id", "—", "n‑n orders"],
  ["reviews", "Ratings & text", "id", "customer_id, menu_item_id", "—"],
  ["reservations", "Table bookings", "id", "customer_id, restaurant_id", "—"],
  ["addresses", "Saved delivery pins", "id", "customer_id", "1‑n orders"],
  ["favorites", "Wishlist join", "id", "customer_id, menu_item_id", "—"],
  ["delivery_riders", "Courier profile", "id", "user_id", "1‑n delivery_tracking"],
  ["delivery_tracking", "GPS breadcrumbs", "id", "order_id, rider_id", "append-only"],
  ["notifications", "Multi-channel inbox", "id", "user_id", "read/unread"],
  ["activity_logs", "Audit trail", "id", "user_id", "immutable"],
  ["settings", "Key/value config", "id", "restaurant_id", "singleton per branch"],
];

const ROADMAP = [
  { phase: "Phase 1 — Foundation", weeks: "Weeks 1–5", items: ["Landing page", "Authentication + OTP", "Global navigation", "Menu & categories", "Food details", "Cart", "Checkout", "Payment (Stripe/Paystack)"] },
  { phase: "Phase 2 — Customer Experience", weeks: "Weeks 6–9", items: ["Customer dashboard", "Real-time order tracking", "Reviews & ratings", "Reservations", "Wishlist", "Notifications"] },
  { phase: "Phase 3 — Admin System", weeks: "Weeks 10–14", items: ["Orders kanban", "Menu management", "Customer CRM", "Payments ledger", "Sales reports", "Inventory basics"] },
  { phase: "Phase 4 — Advanced Features", weeks: "Weeks 15–20", items: ["BI Analytics", "Loyalty program", "Coupon engine", "Referral system", "Promotions studio", "Push notifications", "Inventory automation"] },
];

/* ---------------------------- Components ---------------------------- */

function Section({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 py-16 md:py-24 border-b border-border">
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
        <h2 className="mt-3 text-3xl md:text-5xl font-bold text-secondary">{title}</h2>
      </div>
      <div className="space-y-6 text-[15px] leading-relaxed text-foreground/90">{children}</div>
    </section>
  );
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-card shadow-card border border-border/60 p-6 ${className}`}>{children}</div>
  );
}

function Pill({ children, tone = "primary" }: { children: ReactNode; tone?: "primary" | "accent" | "navy" | "muted" }) {
  const tones: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/15 text-accent-foreground",
    navy: "bg-secondary text-secondary-foreground",
    muted: "bg-muted text-muted-foreground",
  };
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

function TOCSidebar({ active }: { active: string }) {
  return (
    <nav className="hidden lg:block sticky top-24 self-start w-64 shrink-0">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-4">Contents</p>
      <ul className="space-y-1 text-sm">
        {TOC.map((t) => (
          <li key={t.id}>
            <a
              href={`#${t.id}`}
              className={`block rounded-md px-3 py-2 transition-colors ${
                active === t.id ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {t.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/* ---------------------------- Page ---------------------------- */

function ProposalPage() {
  const [active, setActive] = useState(TOC[0].id);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => e.isIntersecting && setActive(e.target.id));
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    TOC.forEach((t) => {
      const el = document.getElementById(t.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top nav */}
      <header className="sticky top-0 z-40 backdrop-blur bg-background/85 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 md:px-8 h-16 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2">
            <span className="grid place-items-center h-9 w-9 rounded-xl gradient-hero text-white font-bold shadow-glow">S</span>
            <span className="font-display font-bold text-lg text-secondary">SavorFlow</span>
            <span className="hidden sm:inline text-xs text-muted-foreground ml-2">/ Proposal v1.0</span>
          </a>
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#executive-summary" className="hover:text-foreground">Summary</a>
            <a href="#scope" className="hover:text-foreground">Scope</a>
            <a href="#roadmap" className="hover:text-foreground">Roadmap</a>
            <a href="#blueprint" className="hover:text-foreground">Blueprint</a>
          </div>
          <a href="#executive-summary" className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 transition">
            Read Proposal
          </a>
        </div>
      </header>

      {/* Hero */}
      <section id="top" className="relative overflow-hidden gradient-navy text-white">
        <div className="mx-auto max-w-7xl px-4 md:px-8 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <Pill tone="primary">Business Proposal · SRS · PRD · Blueprint</Pill>
            <h1 className="mt-5 text-4xl md:text-6xl font-bold leading-tight">
              SavorFlow — A Modern Restaurant <span className="text-primary">Ordering & Delivery</span> Platform
            </h1>
            <p className="mt-6 text-white/80 text-lg max-w-xl">
              A complete digital restaurant management platform combining premium customer experience,
              real-time delivery tracking, and centralized operations — designed to unlock new revenue,
              retention, and efficiency.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#executive-summary" className="inline-flex items-center rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow hover:opacity-90 transition">
                Executive Summary
              </a>
              <a href="#roadmap" className="inline-flex items-center rounded-xl border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white hover:bg-white/10 transition">
                View Roadmap
              </a>
            </div>
            <dl className="mt-12 grid grid-cols-3 gap-6 max-w-md">
              {[
                ["20 wks", "MVP → Advanced"],
                ["18+", "Admin modules"],
                ["3", "Value drivers"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-3xl font-bold text-primary font-display">{k}</dt>
                  <dd className="text-xs uppercase tracking-widest text-white/60 mt-1">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative">
            <div className="absolute -inset-8 rounded-full bg-primary/30 blur-3xl" aria-hidden />
            <img
              src={heroDish}
              alt="Signature dish"
              width={1600}
              height={1000}
              className="relative rounded-3xl shadow-elegant object-cover w-full aspect-[4/3]"
            />
            <div className="absolute -bottom-6 -left-6 rounded-2xl bg-white text-secondary p-4 shadow-elegant hidden sm:block">
              <p className="text-xs text-muted-foreground">Live order</p>
              <p className="font-semibold">Rider 8 min away</p>
              <div className="mt-2 h-2 w-40 rounded-full bg-muted overflow-hidden">
                <div className="h-full w-2/3 gradient-hero rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Body with TOC */}
      <div className="mx-auto max-w-7xl px-4 md:px-8 flex gap-12">
        <TOCSidebar active={active} />
        <main className="flex-1 min-w-0">

          {/* 1. Executive Summary */}
          <Section id="executive-summary" eyebrow="Section 01" title="Executive Summary">
            <p>
              Traditional restaurant ordering — phone calls, printed menus, and disconnected POS systems — loses revenue
              daily to friction, missed upsells, and operational blind spots. Customers now expect the polish of Uber Eats
              or Domino's from every restaurant they touch, and they punish those who cannot deliver it.
            </p>
            <p>
              <strong>SavorFlow</strong> is a full-stack ordering & delivery management platform that consolidates the
              customer-facing storefront, real-time delivery, and back-of-house administration into one product. It
              eliminates commission bleed to third-party aggregators, captures first-party customer data, and turns every
              order into a compounding retention event through loyalty, reviews, and personalization.
            </p>

            <div className="grid md:grid-cols-3 gap-5 mt-8">
              {[
                { t: "Increased Online Sales", d: "Seamless digital ordering with add-on upsell, coupons, and one-click re-order lifts AOV and conversion." },
                { t: "Real-Time Customer Satisfaction", d: "Live GPS tracking, ETA transparency, and proactive notifications reduce anxiety and support load." },
                { t: "Operational Efficiency", d: "One dashboard replaces spreadsheets, printed dockets, and call-in orders across menu, kitchen, and delivery." },
              ].map((v) => (
                <Card key={v.t}>
                  <div className="h-10 w-10 rounded-xl gradient-hero grid place-items-center text-white font-bold shadow-glow">★</div>
                  <h3 className="mt-4 font-display font-semibold text-secondary">{v.t}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{v.d}</p>
                </Card>
              ))}
            </div>

            <Card className="mt-8 gradient-warm">
              <h3 className="font-display font-semibold text-secondary">Expected ROI</h3>
              <ul className="mt-3 grid md:grid-cols-2 gap-2 text-sm">
                <li>• 25–40% uplift in online order volume within 6 months</li>
                <li>• 15–20% higher average order value via digital upsell</li>
                <li>• 30% reduction in order-entry errors</li>
                <li>• 50% reduction in "where is my order?" support calls</li>
                <li>• Payback period: 4–7 months post-launch</li>
                <li>• Eliminates 15–30% aggregator commissions on captured orders</li>
              </ul>
            </Card>
          </Section>

          {/* 2. Business Objectives */}
          <Section id="objectives" eyebrow="Section 02" title="Business Objectives">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <h3 className="font-display font-semibold text-secondary">Vision</h3>
                <p className="mt-2 text-muted-foreground text-sm">To become the digital operating system for modern restaurants — where every meal is discovered, ordered, prepared, delivered, and remembered on a single unified platform.</p>
              </Card>
              <Card>
                <h3 className="font-display font-semibold text-secondary">Mission</h3>
                <p className="mt-2 text-muted-foreground text-sm">Empower restaurants with technology that raises revenue per customer, shortens delivery time, and turns raw operational data into daily competitive advantage.</p>
              </Card>
            </div>

            <div className="mt-6 grid md:grid-cols-2 gap-6">
              <Card>
                <h3 className="font-display font-semibold text-secondary">Business Goals</h3>
                <ul className="mt-3 list-disc pl-5 text-sm space-y-1 text-muted-foreground">
                  <li>Grow direct-channel revenue by 40% year-one.</li>
                  <li>Reduce dependence on 3rd-party aggregators by 60%.</li>
                  <li>Build a first-party customer database of 10k+ diners.</li>
                  <li>Achieve NPS ≥ 55 within 12 months.</li>
                </ul>
              </Card>
              <Card>
                <h3 className="font-display font-semibold text-secondary">Project Objectives</h3>
                <ul className="mt-3 list-disc pl-5 text-sm space-y-1 text-muted-foreground">
                  <li>Ship an MVP in 5 weeks with checkout & payment.</li>
                  <li>Deliver full admin console within 14 weeks.</li>
                  <li>Meet WCAG 2.1 AA and Core Web Vitals thresholds.</li>
                  <li>Zero critical security findings at launch.</li>
                </ul>
              </Card>
            </div>

            <h3 className="mt-8 font-display font-semibold text-secondary text-lg">Target Users</h3>
            <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                ["Restaurant Owners", "Strategic KPIs, revenue, growth decisions."],
                ["Restaurant Managers", "Daily operations, staffing, promotions."],
                ["Kitchen Staff", "Order queue, prep timers, item availability."],
                ["Cashiers", "In-store POS integration, walk-in orders."],
                ["Delivery Riders", "Assigned orders, navigation, earnings."],
                ["Customers", "Discover, order, track, review, and re-order."],
              ].map(([r, d]) => (
                <Card key={r}>
                  <p className="font-semibold text-secondary">{r}</p>
                  <p className="text-sm text-muted-foreground mt-1">{d}</p>
                </Card>
              ))}
            </div>
          </Section>

          {/* 3. Scope */}
          <Section id="scope" eyebrow="Section 03" title="Complete Project Scope">
            <p>The platform is divided into three cohesive systems that share one database, one design system, and one authentication layer.</p>

            <h3 className="mt-6 font-display font-semibold text-secondary text-xl">A. Customer Website</h3>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              {CUSTOMER_PAGES.map((p) => (
                <Card key={p.name}>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-secondary">{p.name}</p>
                    <Pill tone="muted">{p.user}</Pill>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground"><strong>Purpose:</strong> {p.purpose}</p>
                  <p className="mt-1 text-sm text-muted-foreground"><strong>Components:</strong> {p.components}</p>
                  <p className="mt-1 text-sm text-muted-foreground"><strong>Actions:</strong> {p.actions}</p>
                  <p className="mt-1 text-sm text-muted-foreground"><strong>Outcome:</strong> {p.outcome}</p>
                </Card>
              ))}
            </div>

            <h3 className="mt-10 font-display font-semibold text-secondary text-xl">B. Customer Dashboard</h3>
            <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {CUSTOMER_DASHBOARD.map(([n, d]) => (
                <Card key={n}>
                  <p className="font-semibold text-secondary">{n}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{d}</p>
                </Card>
              ))}
            </div>

            <h3 className="mt-10 font-display font-semibold text-secondary text-xl">C. Admin Dashboard</h3>
            <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ADMIN_MODULES.map(([n, d]) => (
                <Card key={n}>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-secondary">{n}</p>
                    <Pill tone="accent">RBAC</Pill>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{d}</p>
                </Card>
              ))}
            </div>
          </Section>

          {/* 4. Page specs */}
          <Section id="pages" eyebrow="Section 04" title="Detailed Page Specifications">
            <p>Every page is specified along 20 dimensions — enough for a designer to lay out a mock and a developer to scaffold routes, states, and API contracts without further clarification.</p>
            <Card>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                {["Purpose","Layout Structure","Sections","Components","Buttons","Cards","Forms","Tables","Navigation","Icons","Animations","Validation","Responsive Behaviour","Accessibility","Loading States","Empty States","Error States","Success Messages","API Requirements","Business Logic"].map((d) => (
                  <div key={d} className="rounded-lg bg-muted px-3 py-2">
                    <span className="text-muted-foreground">• </span>{d}
                  </div>
                ))}
              </div>
            </Card>

            <h3 className="mt-8 font-display font-semibold text-secondary text-lg">Example: Food Details Page</h3>
            <Card>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Layout:</strong> Two-column above the fold — gallery left, info right; sticky "Add to Cart" bar on mobile.</p>
                  <p className="mt-2"><strong>Sections:</strong> Gallery · Title & rating · Price & badges · Description · Nutrition · Add-ons · Quantity · CTA · Related items · Reviews.</p>
                  <p className="mt-2"><strong>Forms:</strong> Add-on multiselect with inline price deltas; quantity stepper with inventory clamp.</p>
                  <p className="mt-2"><strong>Validation:</strong> Enforce max quantity per rules; disable CTA when out of stock.</p>
                </div>
                <div>
                  <p><strong>States:</strong> Loading skeleton · Sold-out overlay · Error retry · Success toast on add.</p>
                  <p className="mt-2"><strong>API:</strong> <code>GET /items/:id</code>, <code>POST /cart</code>, <code>GET /items/:id/reviews</code>.</p>
                  <p className="mt-2"><strong>Business Logic:</strong> Recompute total with add-ons; hide alcohol items for &lt;18 accounts; log view for recommendations.</p>
                  <p className="mt-2"><strong>Accessibility:</strong> Keyboard-navigable gallery, ARIA-labeled stepper, reduced-motion fallback.</p>
                </div>
              </div>
            </Card>
          </Section>

          {/* 5. Design System */}
          <Section id="design-system" eyebrow="Section 05" title="UI / UX Design System">
            <p>A premium, appetite-forward identity built on warm orange, deep navy, and mint green — deliberately distant from generic yellow-and-black delivery templates.</p>

            <h3 className="mt-4 font-display font-semibold text-secondary text-lg">Color Palette</h3>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {COLORS.map((c) => (
                <div key={c.name} className="rounded-2xl bg-card border border-border overflow-hidden shadow-card">
                  <div className="h-20" style={{ backgroundColor: c.hex }} />
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-secondary">{c.name}</p>
                      <code className="text-xs text-muted-foreground">{c.hex}</code>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{c.role}</p>
                    <p className="text-sm mt-2">{c.purpose}</p>
                  </div>
                </div>
              ))}
            </div>

            <h3 className="mt-8 font-display font-semibold text-secondary text-lg">Typography</h3>
            <Card>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="font-display font-bold text-4xl text-secondary">Poppins Bold</p>
                  <p className="text-sm text-muted-foreground mt-1">Headings · 32/40/48/64 · line-height 1.1 · tracking -0.02em</p>
                </div>
                <div>
                  <p className="text-lg" style={{ fontFamily: "Inter" }}>The quick brown fox jumps over the lazy dog.</p>
                  <p className="text-sm text-muted-foreground mt-1">Inter · Body 14/16 · line-height 1.6 · SemiBold buttons · Medium nav · Regular captions</p>
                </div>
              </div>
            </Card>

            <h3 className="mt-8 font-display font-semibold text-secondary text-lg">Component Inventory</h3>
            <div className="flex flex-wrap gap-2">
              {["Buttons","Food Cards","Modals","Badges","Forms","Search Bar","Nav","Sidebar","Dropdowns","Pagination","Tabs","Breadcrumbs","Ratings","Reviews","Progress","Skeleton","Toasts","Tooltips"].map((c) => (
                <Pill key={c} tone="accent">{c}</Pill>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-3">Each component ships with hover, active, focus, disabled and loading states, plus documented ARIA and reduced-motion behaviour.</p>

            <h3 className="mt-8 font-display font-semibold text-secondary text-lg">Micro-interactions</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                ["Cart fly-to-icon animation", "Reinforces the add-to-cart action and pulls attention to the cart badge."],
                ["Image zoom on hover", "Used on food cards & gallery to trigger appetite response."],
                ["Button ripple", "Tactile feedback on primary CTAs (Order, Pay, Confirm)."],
                ["Order tracking pulse", "Rider marker pulse and stepper progress fill during live tracking."],
                ["Notification badge bounce", "Draws the eye when a new order status arrives."],
                ["Page transitions", "Smooth cross-fade on route change, respects prefers-reduced-motion."],
              ].map(([t, d]) => (
                <Card key={t}><p className="font-semibold text-secondary">{t}</p><p className="text-sm text-muted-foreground mt-1">{d}</p></Card>
              ))}
            </div>
          </Section>

          {/* 6. UX Flow */}
          <Section id="ux-flow" eyebrow="Section 06" title="User Experience Flow">
            <Card>
              <pre className="text-xs md:text-sm leading-relaxed text-secondary whitespace-pre overflow-x-auto">
{`  Landing ─▶ Browse Categories ─▶ View Menu ─▶ Food Details
     │                                              │
     │                                              ▼
     │                                       Customize Meal
     │                                              │
     ▼                                              ▼
  Search / Filter ────────────────────────▶  Add to Cart
                                                    │
                                                    ▼
                                                  Cart
                                                    │
                                                    ▼
                                                Checkout
                                                    │
                                                    ▼
                                                 Payment
                                                    │
                                                    ▼
                                           Order Confirmation
                                                    │
                                                    ▼
                                            Track Delivery
                                                    │
                                                    ▼
                                                Delivered
                                                    │
                                                    ▼
                                                 Review`}
              </pre>
            </Card>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                ["Reservation Flow", "Home → Reservation → Pick date/time/party → Confirm → Email + SMS reminder."],
                ["Registration Flow", "CTA → Form or Social → OTP verify → Welcome coupon → Onboarding tour."],
                ["Login Flow", "Email/Social → 2FA optional → Land on last-visited page."],
                ["Forgot Password Flow", "Email → OTP → New password → Auto-login."],
                ["Admin Workflow", "Login → Dashboard → Orders Kanban → Assign rider → Fulfilment."],
                ["Kitchen Workflow", "Ticket screen → Start prep → Timer → Mark Ready → Notify rider."],
                ["Delivery Workflow", "Accept → Navigate → Pickup → Deliver → Collect rating."],
              ].map(([t, d]) => (
                <Card key={t}><p className="font-semibold text-secondary">{t}</p><p className="text-sm text-muted-foreground mt-1">{d}</p></Card>
              ))}
            </div>
          </Section>

          {/* 7. Database */}
          <Section id="database" eyebrow="Section 07" title="Database Design">
            <p>Relational schema (PostgreSQL recommended) with soft-deletes, timestamps, and audit hooks on every table.</p>
            <div className="overflow-x-auto rounded-2xl border border-border shadow-card">
              <table className="min-w-full text-sm">
                <thead className="bg-secondary text-secondary-foreground">
                  <tr>
                    {["Entity","Purpose","PK","Foreign Keys","Relationships"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DB_TABLES.map((r, i) => (
                    <tr key={r[0]} className={i % 2 ? "bg-muted/40" : "bg-card"}>
                      {r.map((c, j) => (
                        <td key={j} className="px-4 py-3 align-top">{j === 0 ? <code className="text-primary font-semibold">{c}</code> : c}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-muted-foreground">Constraints: unique (email, phone), check (rating 1–5), on-delete cascade for owned rows, row-level security on multi-restaurant tables.</p>
          </Section>

          {/* 8. Architecture */}
          <Section id="architecture" eyebrow="Section 08" title="Technology Architecture">
            <div className="grid md:grid-cols-2 gap-4">
              {[
                ["Frontend", "React.js + TypeScript, Tailwind CSS, Vite. SSR-capable via TanStack Start. Chosen for velocity, ecosystem, and SEO."],
                ["Backend", "Node.js + Express (or Laravel alternative). REST + WebSockets for live tracking."],
                ["Database", "PostgreSQL for ACID guarantees; Redis for cart, session, and rate limits."],
                ["Authentication", "JWT with refresh tokens + optional 2FA. OAuth (Google, Apple)."],
                ["Payments", "Stripe (global), Paystack & Flutterwave (Africa), Apple/Google Pay."],
                ["Maps", "Google Maps API or Mapbox for address autocomplete, geocoding, live rider tracking."],
                ["Notifications", "Email (Resend/SES), SMS (Twilio), Web Push (FCM)."],
                ["Storage", "Cloudinary or AWS S3 with CDN for menu images."],
                ["Infra", "Cloudflare / Vercel edge for the web app; managed Postgres; queue for background jobs."],
                ["Observability", "Structured logs, Sentry error tracking, RUM + synthetic monitoring."],
              ].map(([t, d]) => (
                <Card key={t}><p className="font-semibold text-secondary">{t}</p><p className="text-sm text-muted-foreground mt-1">{d}</p></Card>
              ))}
            </div>
            <p className="text-sm">Each choice optimizes for scalability (horizontal scale-out), maintainability (typed, opinionated stacks), performance (edge + CDN + caching), and security (PCI-compliant payment vendors, no card data touches our servers).</p>
          </Section>

          {/* 9. Functional */}
          <Section id="functional" eyebrow="Section 09" title="Functional Requirements">
            <div className="grid md:grid-cols-2 gap-4">
              {[
                ["Authentication", "Register, login, OAuth, OTP verification, session mgmt, logout everywhere."],
                ["Authorization", "Role-based (Owner/Manager/Kitchen/Cashier/Rider/Customer), granular permissions."],
                ["Food Search & Filtering", "Full-text search, filter by category, price, rating, diet, prep time."],
                ["Ordering", "Guided add-to-cart with add-ons, promo codes, group orders (Phase 4)."],
                ["Cart & Checkout", "Persistent cart, address book, tip, split payment."],
                ["Payment", "Card, wallet, cash-on-delivery, refund workflow, receipts."],
                ["Delivery", "Auto-assign nearest rider, live GPS, geofenced status transitions."],
                ["Reservations", "Availability engine, table blocks, deposit optional."],
                ["Reviews", "Verified-purchase gating, media reviews, moderation queue."],
                ["Notifications", "Multi-channel (in-app, push, email, SMS) with user preferences."],
                ["Promotions & Coupons", "Rules engine: percentage/fixed/BOGO/first-order/tiered."],
                ["Reporting & Analytics", "Sales, cohort retention, item performance, delivery SLA, exports."],
                ["Admin Management", "CRUD across menu, orders, staff, promos, settings."],
              ].map(([t, d]) => (
                <Card key={t}><p className="font-semibold text-secondary">{t}</p><p className="text-sm text-muted-foreground mt-1">{d}</p></Card>
              ))}
            </div>
          </Section>

          {/* 10. Non-functional */}
          <Section id="non-functional" eyebrow="Section 10" title="Non-Functional Requirements">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                ["Performance", "LCP < 2.5s, TTI < 3.5s on 4G; API p95 < 300ms."],
                ["Security", "OWASP Top-10 hardened; PCI-DSS via vendor; encrypted at rest & in transit."],
                ["Availability", "99.9% monthly uptime SLO; multi-AZ database."],
                ["Scalability", "Horizontal scale; queue-based decoupling for spikes."],
                ["Accessibility", "WCAG 2.1 AA; keyboard, screen-reader, contrast, reduced motion."],
                ["Maintainability", "Typed codebase, 80% critical-path test coverage, CI/CD."],
                ["Reliability", "Idempotent orders, retries with backoff, dead-letter queues."],
                ["SEO", "SSR, semantic HTML, JSON-LD Restaurant/Menu schema, sitemap."],
                ["Responsive", "Mobile-first, tablet, desktop, TV / kiosk breakpoints."],
                ["Cross-browser", "Latest 2 versions Chrome, Safari, Firefox, Edge."],
              ].map(([t, d]) => (
                <Card key={t}><p className="font-semibold text-secondary">{t}</p><p className="text-sm text-muted-foreground mt-1">{d}</p></Card>
              ))}
            </div>
          </Section>

          {/* 11. Roadmap */}
          <Section id="roadmap" eyebrow="Section 11" title="Development Roadmap">
            <div className="grid md:grid-cols-2 gap-5">
              {ROADMAP.map((p, i) => (
                <Card key={p.phase} className="relative">
                  <div className="absolute -top-3 -left-3 h-8 w-8 rounded-full gradient-hero text-white grid place-items-center text-xs font-bold shadow-glow">{i + 1}</div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-semibold text-secondary">{p.phase}</h3>
                    <Pill tone="muted">{p.weeks}</Pill>
                  </div>
                  <ul className="mt-3 space-y-1 text-sm text-muted-foreground list-disc pl-5">
                    {p.items.map((it) => (<li key={it}>{it}</li>))}
                  </ul>
                </Card>
              ))}
            </div>
          </Section>

          {/* 12. Metrics */}
          <Section id="metrics" eyebrow="Section 12" title="Success Metrics">
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[
                ["Online Order Completion Rate", "≥ 78%"],
                ["Average Order Value", "+15% vs baseline"],
                ["Customer Retention Rate", "≥ 45% at 90 days"],
                ["Repeat Purchase Rate", "≥ 35% within 60 days"],
                ["Delivery Time", "Median ≤ 32 min"],
                ["Order Accuracy", "≥ 98.5%"],
                ["Revenue Growth", "+40% Y1"],
                ["Customer Satisfaction (CSAT)", "≥ 4.6 / 5"],
                ["Operational Efficiency", "-30% order-entry time"],
                ["Admin Productivity", "1 manager handles 2× the volume"],
              ].map(([k, v]) => (
                <Card key={k}>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">{k}</p>
                  <p className="mt-2 font-display font-bold text-2xl text-primary">{v}</p>
                </Card>
              ))}
            </div>
          </Section>

          {/* 13. Advantage */}
          <Section id="advantage" eyebrow="Section 13" title="Competitive Advantage">
            <div className="grid md:grid-cols-2 gap-4">
              {[
                ["Premium UI/UX", "Editorial food photography, warm palette, motion — not a template."],
                ["Business Automation", "From menu edit to kitchen ticket in seconds, no manual sync."],
                ["Real-Time Tracking", "Native GPS map, not an approximate ETA."],
                ["Personalization", "Recommendations based on order history and time-of-day."],
                ["Loyalty Program", "Points, tiers, birthday drops — built-in retention."],
                ["Scalability", "One codebase, multi-branch ready from day one."],
                ["Mobile-First", "Designed for phones where 80% of orders happen."],
                ["Operational Intelligence", "Every action becomes analytics; no BI project required."],
                ["Data Ownership", "First-party customer database; no aggregator middleman."],
                ["Future Expansion", "Modular: subscriptions, catering, kiosks, franchise support."],
              ].map(([t, d]) => (
                <Card key={t}><p className="font-semibold text-secondary">{t}</p><p className="text-sm text-muted-foreground mt-1">{d}</p></Card>
              ))}
            </div>
          </Section>

          {/* 14. Blueprint */}
          <Section id="blueprint" eyebrow="Section 14" title="Design & Build Blueprint">
            <p>A ready-to-execute reference. Designers can begin high-fidelity mocks and developers can scaffold routes and endpoints in parallel from this single section.</p>

            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <h3 className="font-semibold text-secondary">Grid & Spacing</h3>
                <p className="text-sm text-muted-foreground mt-2">12-column responsive grid, 24px gutter desktop / 16px mobile. Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96. Container max-width 1280px.</p>
              </Card>
              <Card>
                <h3 className="font-semibold text-secondary">Iconography</h3>
                <p className="text-sm text-muted-foreground mt-2">Lucide icon set at 20/24px. 1.75px stroke. Domain icons (pizza, drink, rider) illustrated separately in the brand style.</p>
              </Card>
              <Card>
                <h3 className="font-semibold text-secondary">Buttons</h3>
                <p className="text-sm text-muted-foreground mt-2">Height 40/48/56, radius 12, semi-bold 14/16. Variants: primary (orange), secondary (navy outline), ghost, destructive. Loading spinner + disabled tokens.</p>
              </Card>
              <Card>
                <h3 className="font-semibold text-secondary">Form Validation</h3>
                <p className="text-sm text-muted-foreground mt-2">Inline errors under fields; block submission until valid; server-side mirror validation; ARIA-live for screen readers.</p>
              </Card>
              <Card>
                <h3 className="font-semibold text-secondary">API Endpoints (high level)</h3>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1 font-mono">
                  <li>POST /auth/register · /auth/login · /auth/refresh</li>
                  <li>GET /menu · /menu/:id · /categories</li>
                  <li>POST /cart · /orders · /orders/:id/track</li>
                  <li>POST /payments/intents · /payments/webhook</li>
                  <li>GET /admin/orders?status · PATCH /admin/orders/:id</li>
                  <li>GET /admin/reports/sales?range</li>
                </ul>
              </Card>
              <Card>
                <h3 className="font-semibold text-secondary">State Management</h3>
                <p className="text-sm text-muted-foreground mt-2">Server state via TanStack Query with per-route loaders. Local UI state via React. Cart persisted via Redis + client cache. WebSocket channel per active order.</p>
              </Card>
              <Card>
                <h3 className="font-semibold text-secondary">Error Handling</h3>
                <p className="text-sm text-muted-foreground mt-2">Global error boundary, typed API errors, retry with jitter, user-friendly fallback screens, Sentry capture with breadcrumbs.</p>
              </Card>
              <Card>
                <h3 className="font-semibold text-secondary">Empty & Loading States</h3>
                <p className="text-sm text-muted-foreground mt-2">Illustrated empty states with a next-best-action CTA. Skeleton loaders for menus, orders, reviews. Optimistic UI for cart.</p>
              </Card>
              <Card>
                <h3 className="font-semibold text-secondary">Accessibility</h3>
                <p className="text-sm text-muted-foreground mt-2">WCAG 2.1 AA baseline. Focus rings preserved, semantic landmarks, alt text, prefers-reduced-motion honoured, minimum 44px tap targets.</p>
              </Card>
              <Card>
                <h3 className="font-semibold text-secondary">Security</h3>
                <p className="text-sm text-muted-foreground mt-2">HTTPS-only, HSTS, CSRF tokens, rate limiting, argon2 password hashing, secrets in vault, PCI-DSS via tokenized payment vendor.</p>
              </Card>
              <Card>
                <h3 className="font-semibold text-secondary">Performance</h3>
                <p className="text-sm text-muted-foreground mt-2">Image CDN with responsive sizes, route-level code splitting, HTTP/2, ISR for menu pages, prefetch on hover, cache-control tuning.</p>
              </Card>
              <Card>
                <h3 className="font-semibold text-secondary">Permissions Matrix</h3>
                <p className="text-sm text-muted-foreground mt-2">Owner (full) · Manager (ops + reports) · Kitchen (orders) · Cashier (walk-in + refunds) · Rider (assigned orders) · Customer (own data).</p>
              </Card>
            </div>

            <Card className="mt-6 gradient-navy text-white">
              <h3 className="font-display font-semibold text-xl">Approval Requested</h3>
              <p className="mt-2 text-white/80 text-sm">
                Approve Phase 1 kick-off to lock the 20-week roadmap. First customer order can be placed on the platform within 5 weeks of sign-off.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <a href="#top" className="inline-flex items-center rounded-xl bg-primary px-5 py-2.5 font-semibold text-primary-foreground shadow-glow hover:opacity-90 transition">Back to top</a>
                <a href="#roadmap" className="inline-flex items-center rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 font-semibold text-white hover:bg-white/10 transition">Review timeline</a>
              </div>
            </Card>
          </Section>
        </main>
      </div>

      <footer className="gradient-navy text-white/70">
        <div className="mx-auto max-w-7xl px-4 md:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm">© {new Date().getFullYear()} SavorFlow. Prepared for internal review.</p>
          <p className="text-xs uppercase tracking-widest">Proposal · SRS · PRD · Design Guide · Blueprint</p>
        </div>
      </footer>
    </div>
  );
}
