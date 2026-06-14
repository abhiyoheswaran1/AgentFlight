import type {
  ProofGap,
  ReviewFocusItem,
  ReviewIntelligence,
  RiskCategorySummary,
  SessionEvent,
  VerificationRun
} from "../types/index.js";

export type ReplayTimelineItem = Pick<
  SessionEvent,
  "type" | "timestamp" | "title" | "message" | "metadata"
>;

export interface HtmlReplayInput {
  task: string;
  sessionId: string;
  startedAt: string;
  timeline: ReplayTimelineItem[];
  changedFiles: string[];
  changedFileGroups?: RiskCategorySummary[] | undefined;
  riskBadges: string[];
  verificationEvidence: VerificationRun[];
  reviewReadiness?: string | undefined;
  review?: ReviewIntelligence | undefined;
  recommendation: string;
}

export function renderHtmlReplay(input: HtmlReplayInput): string {
  const risk = input.riskBadges[0] ?? "unknown";
  const readiness = input.reviewReadiness ?? "Unknown";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AgentFlight Replay ${escapeHtml(input.sessionId)}</title>
  <style>
    :root {
      color-scheme: light;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      --bg: oklch(0.982 0.006 248);
      --paper: oklch(0.996 0.003 248);
      --text: oklch(0.245 0.022 252);
      --muted: oklch(0.49 0.028 252);
      --faint: oklch(0.66 0.024 252);
      --line: oklch(0.865 0.014 252);
      --line-strong: oklch(0.74 0.026 252);
      --soft: oklch(0.955 0.008 248);
      --accent: oklch(0.47 0.105 252);
      --success: oklch(0.49 0.13 148);
      --success-bg: oklch(0.955 0.035 148);
      --danger: oklch(0.52 0.165 28);
      --danger-bg: oklch(0.955 0.032 28);
      --warning: oklch(0.57 0.115 78);
      --warning-bg: oklch(0.955 0.035 78);
      --mono: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", monospace;
    }

    * { box-sizing: border-box; }
    body { margin: 0; background: var(--bg); color: var(--text); }
    main { max-width: 1120px; margin: 0 auto; padding: 40px 28px 48px; }
    header { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 24px; align-items: start; border-bottom: 1px solid var(--line); padding-bottom: 28px; margin-bottom: 24px; }
    h1 { font-size: 30px; line-height: 1.15; margin: 8px 0 12px; letter-spacing: 0; max-width: 26ch; }
    h2 { font-size: 17px; line-height: 1.25; margin: 0 0 14px; letter-spacing: 0; }
    p { max-width: 72ch; }
    .eyebrow { color: var(--muted); font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
    .meta { color: var(--muted); font-size: 13px; line-height: 1.45; }
    .header-status { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; max-width: 360px; }
    .badges { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
    .badge { border: 1px solid var(--line); border-radius: 999px; padding: 4px 10px; background: var(--paper); color: var(--text); font-size: 12px; font-weight: 650; line-height: 1.35; }
    .badge.risk-high, .badge.status-failed { background: var(--danger-bg); border-color: var(--danger); color: var(--danger); }
    .badge.risk-medium { background: var(--warning-bg); border-color: var(--warning); color: oklch(0.39 0.095 78); }
    .badge.risk-low, .badge.status-passed, .badge.ready { background: var(--success-bg); border-color: var(--success); color: var(--success); }
    .badge.unknown { background: var(--soft); color: var(--muted); }
    .summary-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border: 1px solid var(--line); border-radius: 8px; overflow: hidden; background: var(--paper); margin: 0 0 28px; }
    .summary-card { min-width: 0; padding: 15px 16px; border-right: 1px solid var(--line); }
    .summary-card:last-child { border-right: 0; }
    .summary-card span { color: var(--muted); display: block; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; }
    .summary-card strong { display: block; font-size: 17px; line-height: 1.25; margin-top: 5px; overflow-wrap: anywhere; }
    .section { border-top: 1px solid var(--line); padding: 26px 0 4px; margin-top: 24px; }
    .section-header { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; margin-bottom: 12px; }
    .section-header .meta { flex: 0 0 auto; }
    .timeline { display: grid; gap: 8px; }
    .timeline-item { display: grid; grid-template-columns: minmax(145px, 0.34fr) 14px minmax(0, 1fr); gap: 12px; align-items: start; padding: 10px 0; border-bottom: 1px solid var(--line); }
    .timeline-item:last-child { border-bottom: 0; }
    .timeline-time { color: var(--muted); font-family: var(--mono); font-size: 12px; line-height: 1.5; overflow-wrap: anywhere; }
    .timeline-dot { width: 9px; height: 9px; margin-top: 5px; border-radius: 999px; background: var(--line-strong); }
    .timeline-body strong { display: block; font-size: 14px; line-height: 1.35; }
    .timeline-type { color: var(--muted); font-family: var(--mono); font-size: 12px; margin-top: 2px; }
    .timeline-message { color: var(--text); margin-top: 6px; }
    .file-groups { display: grid; gap: 8px; }
    .file-group { display: grid; grid-template-columns: 150px minmax(0, 1fr); gap: 14px; padding: 10px 0; border-bottom: 1px solid var(--line); }
    .file-group:last-child { border-bottom: 0; }
    .file-category { color: var(--text); font-size: 13px; font-weight: 700; }
    .file-list-inline { display: flex; flex-wrap: wrap; gap: 6px; }
    .changed-files { columns: 2; column-gap: 28px; margin: 0; padding: 0; list-style: none; }
    .changed-files li { break-inside: avoid; margin: 0 0 7px; }
    .verification-grid { border: 1px solid var(--line); border-radius: 8px; overflow: hidden; background: var(--paper); }
    .verification-card { display: grid; grid-template-columns: 104px minmax(0, 1fr); gap: 14px; align-items: start; padding: 13px 16px; border-bottom: 1px solid var(--line); }
    .verification-card:last-child { border-bottom: 0; }
    .verification-status { align-self: start; justify-self: start; }
    .verification-command { min-width: 0; }
    details { margin-top: 8px; }
    summary { color: var(--muted); cursor: pointer; font-size: 12px; font-weight: 650; }
    .verification-paths { color: var(--muted); font-size: 12px; line-height: 1.55; margin-top: 6px; overflow-wrap: anywhere; }
    .recommendation { background: var(--paper); border: 1px solid var(--line); border-radius: 8px; padding: 16px 18px; }
    footer { color: var(--muted); font-size: 12px; margin-top: 30px; border-top: 1px solid var(--line); padding-top: 16px; }
    ul { margin: 0; padding-left: 22px; }
    li { margin: 6px 0; }
    code { background: var(--soft); border: 1px solid var(--line); border-radius: 5px; color: var(--text); font-family: var(--mono); font-size: 0.93em; padding: 2px 5px; overflow-wrap: anywhere; }
    @media (max-width: 860px) {
      main { padding: 28px 18px 40px; }
      header { grid-template-columns: 1fr; }
      .header-status { justify-content: flex-start; }
      .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .summary-card:nth-child(2) { border-right: 0; }
      .summary-card:nth-child(-n + 2) { border-bottom: 1px solid var(--line); }
      .timeline-item, .file-group, .verification-card { grid-template-columns: 1fr; gap: 6px; }
      .timeline-dot { display: none; }
      .changed-files { columns: 1; }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <div class="eyebrow">AgentFlight Replay</div>
        <h1>${escapeHtml(input.task)}</h1>
        <div class="meta">Session ${escapeHtml(input.sessionId)} &middot; Started ${escapeHtml(input.startedAt)}</div>
        <div class="badges">${input.riskBadges.map((badge) => renderBadge(badge, "risk")).join("")}</div>
      </div>
      <div class="header-status">
        ${renderBadge(readiness, "readiness")}
        ${renderBadge(risk, "risk")}
      </div>
    </header>

    ${renderSummary(input)}

    ${renderReview(input.review)}

    <section class="section">
      <div class="section-header">
        <h2>Timeline</h2>
        <div class="meta">${escapeHtml(String(input.timeline.length))} events</div>
      </div>
      ${renderTimeline(input.timeline)}
    </section>

    <section class="section">
      <div class="section-header">
        <h2>Changed File Groups</h2>
        <div class="meta">${escapeHtml(String(input.changedFileGroups?.length ?? 0))} groups</div>
      </div>
      ${renderFileGroups(input.changedFileGroups ?? [])}
      <div class="section-header" style="margin-top: 22px;">
        <h2>Changed Files</h2>
        <div class="meta">${escapeHtml(String(input.changedFiles.length))} files</div>
      </div>
      ${renderFileList(input.changedFiles)}
    </section>

    <section class="section">
      <div class="section-header">
        <h2>Verification Evidence</h2>
        <div class="meta">${escapeHtml(String(input.verificationEvidence.length))} runs</div>
      </div>
      ${renderVerification(input.verificationEvidence)}
    </section>

    <section class="section">
      <div class="section-header">
        <h2>Recommendation</h2>
      </div>
      <div class="recommendation">${escapeHtml(input.recommendation)}</div>
    </section>

    <footer>Generated by AgentFlight</footer>
  </main>
</body>
</html>
`;
}

function renderSummary(input: HtmlReplayInput): string {
  const passed = input.verificationEvidence.filter((item) => item.status === "passed").length;
  const failed = input.verificationEvidence.filter((item) => item.status === "failed").length;
  const risk = input.riskBadges[0] ?? "unknown";
  const readiness = input.reviewReadiness ?? "Unknown";

  return `<section class="summary-grid" aria-label="Session summary">
      ${renderSummaryCard("Risk", risk)}
      ${renderSummaryCard("Changed Files", String(input.changedFiles.length))}
      ${renderSummaryCard("Proof", `${passed} passed / ${failed} failed`)}
      ${renderSummaryCard("Readiness", readiness)}
    </section>`;
}

function renderSummaryCard(label: string, value: string): string {
  return `<div class="summary-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function renderTimeline(items: ReplayTimelineItem[]): string {
  if (items.length === 0) return "<p>No timeline events recorded.</p>";
  return `<div class="timeline">${items
    .map(
      (item) => `<div class="timeline-item">
        <div class="timeline-time">${escapeHtml(item.timestamp)}</div>
        <div class="timeline-dot" aria-hidden="true"></div>
        <div class="timeline-body">
          <strong>${escapeHtml(item.title)}</strong>
          <div class="timeline-type">${escapeHtml(item.type)}</div>
          ${item.message ? `<div class="timeline-message">${escapeHtml(item.message)}</div>` : ""}
        </div>
      </div>`
    )
    .join("")}</div>`;
}

function renderReview(review: ReviewIntelligence | undefined): string {
  if (!review) return "";
  return `<section class="section">
      <div class="section-header">
        <h2>Review Focus</h2>
        <div class="meta">${escapeHtml(String(review.focus.length))} files</div>
      </div>
      ${renderReviewFocus(review.focus)}
      <div class="section-header" style="margin-top: 22px;">
        <h2>Proof Gaps</h2>
        <div class="meta">${escapeHtml(String(review.proofGaps.length))} gaps</div>
      </div>
      ${renderProofGaps(review.proofGaps)}
      <div class="recommendation" style="margin-top: 16px;">
        <strong>${escapeHtml(review.readiness.label)}</strong><br>
        ${escapeHtml(review.readiness.reason)}<br>
        Next: ${escapeHtml(review.readiness.nextAction)}
      </div>
    </section>`;
}

function renderReviewFocus(items: ReviewFocusItem[]): string {
  if (items.length === 0) return "<p>No changed files to review.</p>";
  return `<div class="file-groups">${items
    .map(
      (item) =>
        `<div class="file-group"><div class="file-category">#${escapeHtml(String(item.rank))} ${escapeHtml(item.category)}</div><div><code>${escapeHtml(item.file)}</code><div class="meta">${escapeHtml(item.reasons.join("; "))}</div><div class="meta">${escapeHtml(item.suggestedReviewerFocus)}</div>${item.suggestedCommand ? `<div class="meta">Suggested proof: <code>${escapeHtml(item.suggestedCommand)}</code></div>` : ""}</div></div>`
    )
    .join("")}</div>`;
}

function renderProofGaps(gaps: ProofGap[]): string {
  if (gaps.length === 0) return "<p>No proof gaps detected.</p>";
  return `<ul>${gaps
    .map(
      (gap) =>
        `<li><strong>${escapeHtml(gap.severity)}</strong>: ${escapeHtml(gap.message)}${gap.suggestedCommand ? ` <code>agentflight verify -- ${escapeHtml(gap.suggestedCommand)}</code>` : ""}</li>`
    )
    .join("")}</ul>`;
}

function renderFileGroups(groups: RiskCategorySummary[]): string {
  if (groups.length === 0) return "<p>No changed file groups detected.</p>";
  return `<div class="file-groups">${groups
    .map(
      (group) =>
        `<div class="file-group"><div class="file-category">${escapeHtml(group.category)}</div><div class="file-list-inline">${group.files.map((file) => `<code>${escapeHtml(file)}</code>`).join("")}</div></div>`
    )
    .join("")}</div>`;
}

function renderFileList(files: string[]): string {
  if (files.length === 0) return "<p>No changed files detected.</p>";
  return `<ul class="changed-files">${files.map((file) => `<li><code>${escapeHtml(file)}</code></li>`).join("")}</ul>`;
}

function renderVerification(evidence: VerificationRun[]): string {
  if (evidence.length === 0) return "<p>No verification evidence recorded.</p>";
  return `<div class="verification-grid">${evidence
    .map(
      (item) => `<div class="verification-card ${escapeHtml(item.status)}">
        <div class="verification-status">${renderBadge(item.status, "status")}</div>
        <div class="verification-command">
          <code>${escapeHtml(item.command)}</code>
          <div class="meta">Exit ${escapeHtml(String(item.exitCode ?? "unknown"))} &middot; ${escapeHtml(String(item.durationMs))}ms</div>
          <details>
            <summary>Evidence files</summary>
            <div class="verification-paths">
              <div>stdout: ${escapeHtml(item.stdoutPath)}</div>
              <div>stderr: ${escapeHtml(item.stderrPath)}</div>
            </div>
          </details>
        </div>
      </div>`
    )
    .join("")}</div>`;
}

function renderBadge(value: string, kind: "readiness" | "risk" | "status"): string {
  const normalized = value.toLowerCase().replaceAll(/\s+/g, "-");
  const className =
    kind === "readiness"
      ? normalized.startsWith("ready")
        ? "ready"
        : "unknown"
      : kind === "status"
        ? `status-${normalized}`
        : `risk-${normalized}`;

  return `<span class="badge ${escapeHtml(className)}">${escapeHtml(value)}</span>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
