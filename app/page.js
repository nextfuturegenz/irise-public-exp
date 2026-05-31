"use client";

import { useState } from "react";

const SAMPLE = `Q2 Planning Meeting – May 30 2025
Attendees: Priya (PM), Rahul (Dev Lead), Sneha (Design), Arjun (Marketing)

We reviewed the roadmap and discussed launch priorities. Priya confirmed that the mobile app feature needs to go out by June 15. Rahul said he'd have the API changes done by June 5 and will share documentation by June 8. Sneha agreed to deliver final UI mockups by June 3 so Rahul's team can start integration immediately. Arjun will draft the launch announcement email by June 10 and send it to Priya for review. Priya will set up the go-live checklist by June 6. We also agreed that Rahul should schedule a code review session next Tuesday with the team.`;

const PRIORITY_STYLES = {
  high: { bg: "#fee2e2", color: "#991b1b", border: "#fecaca" },
  medium: { bg: "#fef3c7", color: "#92400e", border: "#fde68a" },
  low: { bg: "#e0e7ff", color: "#3730a3", border: "#c7d2fe" },
};

const FEATURES = [
  {
    icon: "⚡",
    title: "Instant AI Extraction",
    desc: "Paste any meeting transcript and get fully structured action items in under 3 seconds.",
  },
  {
    icon: "🎯",
    title: "Smart Prioritization",
    desc: "AI reads between the lines to infer high, medium, or low priority from urgency and business impact.",
  },
  {
    icon: "👤",
    title: "Auto Owner Detection",
    desc: "Every task is matched to the right person automatically so nothing falls through the cracks.",
  },
  {
    icon: "✉️",
    title: "Personalized Email Drafts",
    desc: "One-click personalized emails for each team member, pre-filled with only their tasks and deadlines.",
  },
  {
    icon: "📅",
    title: "Deadline Extraction",
    desc: "Dates and timeframes are automatically pulled from natural language — 'next Tuesday', 'end of month'.",
  },
  {
    icon: "🔄",
    title: "Multi-Model AI",
    desc: "Switch between Google Gemini and Anthropic Claude. Use the free tier or bring your own API key.",
  },
];

const FAQS = [
  {
    q: "How does Task Master extract action items?",
    a: "Task Master uses large language models with a strict structured output schema. This guarantees every response is a consistent JSON object — no unreliable text parsing, no hallucinated formats.",
  },
  {
    q: "Which AI models are supported?",
    a: "We support Google Gemini 2.5 Flash (included in the free tier) and Anthropic Claude 3.5 Sonnet (available on Pro). You can switch models with a single click before each extraction.",
  },
  {
    q: "Is my meeting data stored or shared?",
    a: "No. Your notes are sent directly to the AI provider for processing and are never stored on our servers. We don't log or retain any meeting content.",
  },
  {
    q: "Can I cancel my Pro subscription anytime?",
    a: "Yes, absolutely. Cancel anytime from your account settings — no questions asked, no cancellation fees, no lock-in period.",
  },
  {
    q: "What kind of meeting notes work best?",
    a: "Any format works — bullet points, full transcripts, casual stream-of-consciousness notes. The AI is robust to formatting and will extract every commitment it can identify.",
  },
  {
    q: "Do you offer team or enterprise plans?",
    a: "Team and enterprise plans with shared workspaces and SSO are on the roadmap. Reach out to hello@taskmaster.ai to get early access.",
  },
];

function initials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function buildPersonEmail(owner, tasks, summary) {
  const isUnassigned = owner === "Unassigned";
  const lines = tasks
    .map(
      (it, i) =>
        `${i + 1}. ${it.task}${it.deadline ? " — Due: " + it.deadline : ""} [${it.priority} priority]`
    )
    .join("\r\n");

  if (isUnassigned) {
    return {
      subject: "Unassigned action items from today's meeting",
      body: `Hi team,\r\n\r\nThe following action items from today's meeting don't have a clear owner yet. Please review and assign them:\r\n\r\n${lines}\r\n\r\nMeeting recap: ${summary}\r\n\r\nThanks`,
    };
  }

  const firstName = owner.split(" ")[0];
  return {
    subject: "Your action items from today's meeting",
    body: `Hi ${firstName},\r\n\r\nThanks for joining today's meeting. Here's a quick recap:\r\n${summary}\r\n\r\nYour action items:\r\n${lines}\r\n\r\nPlease confirm you've received your tasks and reach out if you need any clarification.\r\n\r\nThanks`,
  };
}

function mailtoLink({ subject, body }) {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function groupByOwner(action_items) {
  const map = {};
  action_items.forEach((it) => {
    const key = it.owner || "Unassigned";
    if (!map[key]) map[key] = [];
    map[key].push(it);
  });
  return Object.entries(map).map(([owner, tasks]) => ({ owner, tasks }));
}

export default function Home() {
  const [notes, setNotes] = useState("");
  const [model, setModel] = useState("gemini");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState({});
  const [tab, setTab] = useState("list");
  const [emailPerson, setEmailPerson] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

  async function extract() {
    if (!notes.trim()) {
      setError("Please paste some meeting notes first.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    setDone({});
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, model }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setResult(data);
      setTab("list");
      const grouped = groupByOwner(data.action_items);
      setEmailPerson(grouped[0]?.owner ?? null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function toggle(i) {
    setDone((d) => ({ ...d, [i]: !d[i] }));
  }

  const json = result ? JSON.stringify(result, null, 2) : "";
  const personGroups = result ? groupByOwner(result.action_items) : [];
  const activePerson =
    personGroups.find((g) => g.owner === emailPerson) ?? personGroups[0];
  const activeEmail = activePerson
    ? buildPersonEmail(activePerson.owner, activePerson.tasks, result.meeting_summary)
    : null;

  return (
    <>
      {/* ── Nav ── */}
      <nav className="nav">
        <div className="nav-inner">
          <a href="#" className="nav-logo">
            <span>⚡</span>
            Task Master
          </a>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
          </div>
          <a href="#demo" className="nav-cta">
            Try it free →
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-badge">✨ AI-Powered Meeting Intelligence</div>
          <h1 className="hero-title">
            Turn meeting chaos
            <br />
            into clear action items
          </h1>
          <p className="hero-sub">
            Task Master reads your meeting notes and instantly extracts every
            task, owner, deadline, and priority — then drafts personalized
            emails for your whole team.
          </p>
          <div className="hero-actions">
            <a href="#demo" className="btn-primary">
              Try it free →
            </a>
            <a href="#pricing" className="btn-outline">
              See pricing
            </a>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <strong>{"< 3s"}</strong>
              <span>extraction time</span>
            </div>
            <div className="hero-divider" />
            <div className="hero-stat">
              <strong>100%</strong>
              <span>structured output</span>
            </div>
            <div className="hero-divider" />
            <div className="hero-stat">
              <strong>2</strong>
              <span>AI models</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="lp-section" id="features">
        <div className="lp-inner">
          <div className="section-eyebrow">Features</div>
          <h2 className="section-title">
            Everything your team needs to follow through
          </h2>
          <p className="section-sub">
            Stop losing track of who said they'd do what. Task Master turns
            every meeting into a structured, actionable record.
          </p>
          <div className="features-grid">
            {FEATURES.map((f) => (
              <div className="feature-card" key={f.title}>
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live Demo ── */}
      <section className="lp-section demo-section" id="demo">
        <div className="lp-inner">
          <div className="section-eyebrow">Live Demo</div>
          <h2 className="section-title">See it in action</h2>
          <p className="section-sub">
            No signup needed. Paste your notes below and watch Task Master
            extract every commitment in seconds.
          </p>

          <div className="tool-wrap">
            <section className="card">
              <div className="row-between">
                <label className="label">Meeting notes</label>
                <div className="model-toggle">
                  <button
                    className={model === "gemini" ? "active" : ""}
                    onClick={() => setModel("gemini")}
                  >
                    Gemini (free)
                  </button>
                  <button
                    className={model === "claude" ? "active" : ""}
                    onClick={() => setModel("claude")}
                  >
                    Claude
                  </button>
                </div>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Paste your meeting transcript or notes here..."
                rows={9}
              />
              <button className="link-btn" onClick={() => setNotes(SAMPLE)}>
                Load sample notes
              </button>
            </section>

            <button className="primary" onClick={extract} disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner" /> Extracting…
                </>
              ) : (
                <>⚡ Extract action items</>
              )}
            </button>

            {error && <div className="error">{error}</div>}

            {result && (
              <section className="results">
                <div className="tabs">
                  {["list", "email", "json"].map((t) => (
                    <button
                      key={t}
                      className={tab === t ? "tab active" : "tab"}
                      onClick={() => setTab(t)}
                    >
                      {t === "list"
                        ? "Action items"
                        : t === "json"
                        ? "JSON"
                        : "Email drafts"}
                    </button>
                  ))}
                </div>

                {tab === "list" && (
                  <div className="card">
                    <div className="summary">
                      <strong>Summary:</strong> {result.meeting_summary}
                    </div>
                    <div className="count">
                      {result.action_items.length} action item
                      {result.action_items.length !== 1 ? "s" : ""} found · via{" "}
                      {result.model_used}
                    </div>
                    {result.action_items.map((it, i) => {
                      const p =
                        PRIORITY_STYLES[it.priority] || PRIORITY_STYLES.low;
                      return (
                        <div className="item" key={i}>
                          <button
                            className={done[i] ? "check checked" : "check"}
                            onClick={() => toggle(i)}
                            aria-label="Toggle done"
                          >
                            {done[i] ? "✓" : ""}
                          </button>
                          <div className="item-body">
                            <div
                              className="task"
                              style={
                                done[i]
                                  ? { textDecoration: "line-through", opacity: 0.45 }
                                  : {}
                              }
                            >
                              {it.task}
                            </div>
                            <div className="pills">
                              {it.owner && (
                                <span className="pill owner">
                                  👤 {it.owner}
                                </span>
                              )}
                              {it.deadline && (
                                <span className="pill deadline">
                                  📅 {it.deadline}
                                </span>
                              )}
                              <span
                                className="pill"
                                style={{
                                  background: p.bg,
                                  color: p.color,
                                  borderColor: p.border,
                                }}
                              >
                                {it.priority}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {tab === "email" && (
                  <div className="card">
                    <div className="person-tabs">
                      {personGroups.map(({ owner, tasks }) => (
                        <button
                          key={owner}
                          className={`person-btn${
                            emailPerson === owner ? " selected" : ""
                          }`}
                          onClick={() => setEmailPerson(owner)}
                        >
                          <span className="avatar">{initials(owner)}</span>
                          {owner}
                          <span className="person-task-count">
                            {tasks.length}
                          </span>
                        </button>
                      ))}
                    </div>

                    {activePerson && activeEmail && (
                      <>
                        <div className="email-header">
                          <span className="email-to">
                            To: {activePerson.owner}
                          </span>
                          <div className="email-actions">
                            <button
                              className="link-btn"
                              style={{ marginTop: 0 }}
                              onClick={() =>
                                navigator.clipboard.writeText(
                                  `Subject: ${activeEmail.subject}\n\n${activeEmail.body}`
                                )
                              }
                            >
                              Copy
                            </button>
                            <a
                              className="send-btn"
                              href={mailtoLink(activeEmail)}
                            >
                              ✉ Send email
                            </a>
                          </div>
                        </div>
                        <pre className="email">{`Subject: ${activeEmail.subject}\n\n${activeEmail.body}`}</pre>
                      </>
                    )}
                  </div>
                )}

                {tab === "json" && (
                  <div className="card">
                    <pre>{json}</pre>
                    <button
                      className="link-btn"
                      onClick={() => navigator.clipboard.writeText(json)}
                    >
                      Copy JSON
                    </button>
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="lp-section" id="pricing">
        <div className="lp-inner">
          <div className="section-eyebrow">Pricing</div>
          <h2 className="section-title">Simple, transparent pricing</h2>
          <p className="section-sub">Start free. Upgrade when you need more.</p>
          <div className="pricing-grid">
            <div className="pricing-card">
              <div className="pricing-name">Starter</div>
              <div className="pricing-price">
                <span className="price-amount">$0</span>
                <span className="price-period">/month</span>
              </div>
              <div className="pricing-desc">
                Perfect for individuals trying it out.
              </div>
              <ul className="pricing-features">
                <li>✓ 5 extractions per month</li>
                <li>✓ Gemini AI model</li>
                <li>✓ Action items &amp; JSON export</li>
                <li>✓ Email draft generation</li>
                <li className="dim">✗ Claude AI model</li>
                <li className="dim">✗ Priority support</li>
              </ul>
              <a href="#demo" className="pricing-btn outline">
                Get started free
              </a>
            </div>

            <div className="pricing-card featured">
              <div className="pricing-badge">Most popular</div>
              <div className="pricing-name">Pro</div>
              <div className="pricing-price">
                <span className="price-amount">$10</span>
                <span className="price-period">/month</span>
              </div>
              <div className="pricing-desc">
                For professionals and growing teams.
              </div>
              <ul className="pricing-features">
                <li>✓ Unlimited extractions</li>
                <li>✓ Gemini + Claude AI models</li>
                <li>✓ Action items &amp; JSON export</li>
                <li>✓ Personalized email drafts</li>
                <li>✓ Priority email support</li>
                <li>✓ Early access to new features</li>
              </ul>
              <a href="#demo" className="pricing-btn filled">
                Start Pro free trial
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="lp-section faq-section" id="faq">
        <div className="lp-inner lp-inner--narrow">
          <div className="section-eyebrow">FAQ</div>
          <h2 className="section-title">Frequently asked questions</h2>
          <div className="faq-list">
            {FAQS.map((item, i) => (
              <div
                className={`faq-item${openFaq === i ? " open" : ""}`}
                key={i}
              >
                <button
                  className="faq-question"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {item.q}
                  <span className="faq-chevron">{openFaq === i ? "−" : "+"}</span>
                </button>
                {openFaq === i && (
                  <div className="faq-answer">{item.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="site-footer">
        <div className="lp-inner">
          <div className="footer-top">
            <div className="footer-brand">
              <span>⚡</span>
              <span className="footer-name">Task Master</span>
            </div>
            <p className="footer-tagline">
              AI-powered meeting intelligence for modern teams.
            </p>
          </div>
          <div className="footer-bottom">
            <span>© 2025 Task Master · Built at the iRise Buildathon by Ashish.</span>
            <div className="footer-links">
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#faq">FAQ</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
