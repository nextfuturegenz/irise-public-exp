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

export default function Home() {
  const [notes, setNotes] = useState("");
  const [model, setModel] = useState("gemini");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState({});
  const [tab, setTab] = useState("list");

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
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function toggle(i) {
    setDone((d) => ({ ...d, [i]: !d[i] }));
  }

  function buildEmail() {
    if (!result) return "";
    const lines = result.action_items
      .map(
        (it, i) =>
          `${i + 1}. ${it.task}${it.owner ? " — Owner: " + it.owner : ""}${
            it.deadline ? " | Due: " + it.deadline : ""
          }`
      )
      .join("\n");
    return `Subject: Action items from today's meeting\n\nHi team,\n\nHere's a quick summary of today's meeting:\n${result.meeting_summary}\n\nAction items:\n${lines}\n\nPlease confirm you've received your tasks. Reach out if you need clarification.\n\nThanks`;
  }

  const json = result ? JSON.stringify(result, null, 2) : "";
  const email = buildEmail();

  return (
    <main className="page">
      <div className="container">
        <header>
          <div className="brand">
            <span className="dot" />
            <span>AI Meeting Notes</span>
          </div>
          <h1>
            Meeting notes <span className="arrow">→</span> action items
          </h1>
          <p className="sub">
            Paste any meeting transcript. AI extracts the tasks, owners,
            deadlines and priorities in seconds.
          </p>
        </header>

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
              {["list", "json", "email"].map((t) => (
                <button
                  key={t}
                  className={tab === t ? "tab active" : "tab"}
                  onClick={() => setTab(t)}
                >
                  {t === "list"
                    ? "Action items"
                    : t === "json"
                    ? "JSON"
                    : "Email draft"}
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
                  const p = PRIORITY_STYLES[it.priority] || PRIORITY_STYLES.low;
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
                              ? {
                                  textDecoration: "line-through",
                                  opacity: 0.5,
                                }
                              : {}
                          }
                        >
                          {it.task}
                        </div>
                        <div className="pills">
                          {it.owner && (
                            <span className="pill owner">👤 {it.owner}</span>
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

            {tab === "email" && (
              <div className="card">
                <pre className="email">{email}</pre>
                <button
                  className="link-btn"
                  onClick={() => navigator.clipboard.writeText(email)}
                >
                  Copy email
                </button>
              </div>
            )}
          </section>
        )}

        <footer>
          Built live at the <strong>iRise Buildathon</strong> · Powered by the
          Vercel AI SDK
        </footer>
      </div>
    </main>
  );
}
