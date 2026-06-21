import {
  compactCommandInText,
  formatCommandForDisplay,
  formatVerifyCommandForDisplay
} from "../core/output.js";
import type { VerificationFailureCounts } from "../core/output.js";
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
  verificationSummary?: VerificationFailureCounts | undefined;
  reviewReadiness?: string | undefined;
  review?: ReviewIntelligence | undefined;
  recommendation: string;
}

export function renderHtmlReplay(input: HtmlReplayInput): string {
  const readiness = input.reviewReadiness ?? "Unknown";
  const verdict = classifyReadiness(readiness);
  const firstFailedRunIndex = input.verificationEvidence.findIndex(
    (item) => item.status === "failed"
  );
  const urgentFailedRunIndex = shouldShowUrgentFailedRunShortcut(input, firstFailedRunIndex)
    ? firstFailedRunIndex
    : -1;
  const recommendation = compactCommandInText(
    input.recommendation,
    input.review?.readiness.suggestedCommand
  );

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AgentFlight Record ${escapeHtml(input.sessionId)}</title>
  <style>
    :root {
      color-scheme: light;
      --sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      --mono: ui-monospace, SFMono-Regular, "SF Mono", "JetBrains Mono", Consolas, "Liberation Mono", monospace;

      --bg: oklch(0.984 0.004 255);
      --paper: oklch(0.997 0.002 255);
      --ink: oklch(0.265 0.018 258);
      --chrome: oklch(0.505 0.022 258);
      --faint: oklch(0.585 0.02 258);
      --rule: oklch(0.905 0.008 258);
      --rule-strong: oklch(0.81 0.014 258);
      --soft: oklch(0.957 0.006 258);
      --accent: oklch(0.5 0.092 262);

      --ok: oklch(0.5 0.088 152);
      --ok-bg: oklch(0.965 0.022 152);
      --warn: oklch(0.49 0.1 74);
      --warn-bg: oklch(0.964 0.034 78);
      --danger: oklch(0.515 0.158 27);
      --danger-bg: oklch(0.962 0.026 27);
    }

    * { box-sizing: border-box; }
    html { -webkit-text-size-adjust: 100%; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--ink);
      font-family: var(--sans);
      font-size: 15px;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
    }
    main { max-width: 1040px; margin: 0 auto; padding: 56px 32px 64px; }
    p { max-width: 70ch; margin: 0; }
    a { color: var(--accent); }

    /* technical chrome: mono labels, section markers, metadata */
    .label {
      font-family: var(--mono);
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.13em;
      text-transform: uppercase;
      color: var(--chrome);
    }
    .mono { font-family: var(--mono); font-variant-numeric: tabular-nums; }

    /* masthead */
    .masthead {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 40px;
      align-items: end;
      padding-bottom: 26px;
      border-bottom: 2px solid var(--ink);
    }
    .masthead-id .label { display: block; margin-bottom: 14px; }
    h1 {
      font-size: clamp(26px, 3.2vw, 33px);
      line-height: 1.12;
      letter-spacing: -0.014em;
      font-weight: 640;
      margin: 0 0 14px;
      max-width: 24ch;
      text-wrap: balance;
    }
    .ident {
      font-family: var(--mono);
      font-size: 12.5px;
      color: var(--chrome);
      display: flex;
      flex-wrap: wrap;
      gap: 4px 14px;
    }

    /* verdict: the single most important signal, calm unless attention is due */
    .verdict { text-align: right; max-width: 340px; }
    .verdict .label { display: block; margin-bottom: 8px; }
    .verdict-line { display: inline-flex; align-items: center; gap: 9px; font-size: 17px; font-weight: 620; letter-spacing: -0.01em; }
    .verdict-mark { width: 9px; height: 9px; border-radius: 2px; flex: none; background: var(--rule-strong); }
    .verdict--ok .verdict-mark { background: var(--ok); }
    .verdict--attention { color: var(--warn); }
    .verdict--attention .verdict-mark { background: var(--warn); }
    .verdict--blocked { color: var(--danger); }
    .verdict--blocked .verdict-mark { background: var(--danger); }
    .flags { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px; margin-top: 12px; }
    .flag {
      font-family: var(--mono);
      font-size: 11.5px;
      letter-spacing: 0.02em;
      padding: 3px 8px;
      border: 1px solid var(--rule-strong);
      border-radius: 3px;
      color: var(--chrome);
      background: var(--paper);
    }
    .flag.tone-high { border-color: var(--danger); color: var(--danger); background: var(--danger-bg); }
    .flag.tone-medium { border-color: var(--warn); color: var(--warn); background: var(--warn-bg); }

    /* readout band: instrument readings, not metric cards.
       Sticks to the top so risk and readiness stay visible on long records. */
    .summary-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0;
      margin: 0 0 8px;
      border-bottom: 1px solid var(--rule);
      position: sticky;
      top: 0;
      z-index: 5;
      background: var(--bg);
    }
    .reading {
      display: flex;
      flex-direction: column;
      gap: 5px;
      padding: 18px 30px 18px 0;
      margin-right: 30px;
      border-right: 1px solid var(--rule);
      min-width: 0;
    }
    .reading:last-child { border-right: 0; margin-right: 0; }
    .reading-value { font-size: 19px; font-weight: 600; letter-spacing: -0.01em; overflow-wrap: anywhere; }
    .reading-value.tone-high { color: var(--danger); }
    .reading-value.tone-medium { color: var(--warn); }

    .jump-nav {
      display: flex;
      flex-wrap: wrap;
      gap: 7px;
      margin: 14px 0 0;
      padding: 12px 0 4px;
      border-bottom: 1px solid var(--rule);
    }
    .jump-nav a,
    .review-shortcuts a {
      font-family: var(--mono);
      font-size: 12px;
      color: var(--chrome);
      text-decoration: none;
      border: 1px solid var(--rule);
      border-radius: 999px;
      padding: 3px 9px;
      background: var(--paper);
    }
    .jump-nav a:hover,
    .review-shortcuts a:hover { color: var(--ink); border-color: var(--rule-strong); }
    .jump-nav a.nav-urgent,
    .review-shortcuts a.nav-urgent { color: var(--danger); border-color: var(--danger); background: var(--danger-bg); }
    .review-shortcuts { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 14px; }

    /* sections */
    .section { padding-top: 38px; }
    .section, .entry { scroll-margin-top: 96px; }
    .section-head {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 16px;
      padding-bottom: 12px;
      margin-bottom: 18px;
      border-bottom: 1px solid var(--rule);
    }
    .section-head h2 { all: unset; }
    .section-head .label { display: block; }
    .count { font-family: var(--mono); font-size: 12px; color: var(--faint); font-variant-numeric: tabular-nums; }
    .empty { color: var(--faint); font-size: 14px; }

    /* timeline as a log spine */
    .timeline { display: grid; }
    .timeline-item {
      display: grid;
      grid-template-columns: minmax(132px, 0.28fr) 18px minmax(0, 1fr);
      gap: 16px;
      padding: 4px 0 18px;
    }
    .timeline-time { font-family: var(--mono); font-variant-numeric: tabular-nums; font-size: 12px; color: var(--faint); line-height: 1.7; overflow-wrap: anywhere; }
    .timeline-rail { position: relative; }
    .timeline-rail::before {
      content: "";
      position: absolute;
      left: 50%;
      top: 0;
      bottom: 0;
      width: 1px;
      transform: translateX(-50%);
      background: var(--rule-strong);
    }
    .timeline-item:first-child .timeline-rail::before { top: 11px; }
    .timeline-item:last-child .timeline-rail::before { bottom: auto; height: 11px; }
    .timeline-node {
      position: absolute;
      left: 50%;
      top: 11px;
      width: 9px;
      height: 9px;
      border-radius: 999px;
      transform: translate(-50%, -50%);
      background: var(--paper);
      border: 1.5px solid var(--rule-strong);
    }
    .node--start { background: var(--ink); border-color: var(--ink); }
    .node--ok { background: var(--ok); border-color: var(--ok); }
    .node--fail { background: var(--danger-bg); border-color: var(--danger); border-width: 2px; }
    .node--snapshot { background: var(--paper); border-color: var(--accent); }
    .node--report { background: var(--accent); border-color: var(--accent); }
    .timeline-title { font-size: 14.5px; font-weight: 600; line-height: 1.4; }
    .timeline-type { font-family: var(--mono); font-size: 11.5px; color: var(--faint); margin-top: 3px; letter-spacing: 0.01em; }
    .timeline-message { margin-top: 7px; font-size: 14px; color: var(--ink); }

    /* records: review focus + file groups */
    .records { display: grid; }
    .record {
      display: grid;
      grid-template-columns: 168px minmax(0, 1fr);
      gap: 18px;
      padding: 14px 0;
      border-top: 1px solid var(--rule);
    }
    .record:first-child { border-top: 0; }
    .record-key { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
    .record-rank { font-family: var(--mono); font-size: 12px; color: var(--faint); }
    .record-cat { font-size: 13.5px; font-weight: 650; }
    .record-body { min-width: 0; display: flex; flex-direction: column; gap: 6px; }
    .reason { color: var(--chrome); font-size: 13.5px; line-height: 1.55; }
    .reason-strong { color: var(--ink); }
    .tags { display: flex; flex-wrap: wrap; gap: 6px; }

    /* verification evidence ledger */
    .ledger { display: grid; }
    .entry {
      display: grid;
      grid-template-columns: 78px minmax(0, 1fr);
      gap: 18px;
      align-items: start;
      padding: 15px 0;
      border-top: 1px solid var(--rule);
    }
    .entry:first-child { border-top: 0; }
    .stamp {
      font-family: var(--mono);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      padding-top: 1px;
    }
    .stamp--passed { color: var(--ok); }
    .stamp--failed { color: var(--danger); }
    .stamp--historical-failed { color: var(--chrome); }
    .entry-body { min-width: 0; display: flex; flex-direction: column; gap: 7px; }
    .entry-cmd { font-family: var(--mono); font-size: 13.5px; color: var(--ink); overflow-wrap: anywhere; }
    .entry-meta { font-family: var(--mono); font-variant-numeric: tabular-nums; font-size: 12px; color: var(--faint); }
    details { font-size: 12.5px; }
    summary { color: var(--chrome); cursor: pointer; font-family: var(--mono); font-size: 12px; letter-spacing: 0.02em; width: max-content; }
    summary:hover { color: var(--ink); }
    .paths { font-family: var(--mono); font-size: 12px; color: var(--faint); line-height: 1.7; margin-top: 7px; overflow-wrap: anywhere; }
    .excerpt {
      font-family: var(--mono);
      font-size: 12px;
      line-height: 1.55;
      margin: 2px 0 0;
      padding: 11px 13px;
      background: var(--soft);
      border: 1px solid var(--rule);
      border-radius: 5px;
      color: var(--ink);
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      max-height: 220px;
      overflow: auto;
    }
    .excerpt--failed { background: var(--danger-bg); border-color: var(--danger); color: oklch(0.4 0.1 27); }
    .entry--historical-failed .excerpt--failed { background: var(--soft); border-color: var(--rule-strong); color: var(--ink); }

    /* changed file list */
    .files { columns: 2; column-gap: 36px; margin: 0; padding: 0; list-style: none; }
    .files li { break-inside: avoid; margin: 0 0 8px; }

    /* gaps + recommendation callout */
    .gaps { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
    .gaps li { display: grid; grid-template-columns: 84px minmax(0, 1fr); gap: 14px; align-items: baseline; font-size: 14px; }
    .gap-sev { font-family: var(--mono); font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--chrome); }
    .gap-sev.sev-blocking { color: var(--danger); }
    .gap-sev.sev-warning { color: var(--warn); }

    .callout {
      margin-top: 22px;
      padding: 18px 20px;
      background: var(--soft);
      border: 1px solid var(--rule);
      border-radius: 6px;
    }
    .callout-state { font-weight: 650; font-size: 15px; }
    .callout-reason { color: var(--chrome); font-size: 14px; margin-top: 4px; line-height: 1.55; }
    .callout-next { margin-top: 10px; font-family: var(--mono); font-size: 13px; }
    .callout-next .label { display: inline; margin-right: 8px; }

    code {
      font-family: var(--mono);
      font-size: 0.92em;
      background: var(--soft);
      border: 1px solid var(--rule);
      border-radius: 4px;
      padding: 1px 5px;
      overflow-wrap: anywhere;
    }

    footer {
      margin-top: 52px;
      padding-top: 18px;
      border-top: 1px solid var(--rule);
      font-family: var(--mono);
      font-size: 11.5px;
      letter-spacing: 0.04em;
      color: var(--faint);
      display: flex;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }

    @media (max-width: 820px) {
      main { padding: 36px 20px 48px; }
      .masthead { grid-template-columns: 1fr; gap: 24px; align-items: start; }
      .verdict { text-align: left; max-width: none; }
      .verdict .flags { justify-content: flex-start; }
      .reading { padding-right: 22px; margin-right: 22px; }
      .timeline-item, .record, .entry { grid-template-columns: 1fr; gap: 6px; }
      .timeline-rail { display: none; }
      .files { columns: 1; }
      .gaps li { grid-template-columns: 1fr; gap: 2px; }
    }

    @media (prefers-reduced-motion: reduce) {
      * { scroll-behavior: auto; }
    }

    /* Print: a clean evidence record for PDF handoffs and incident reconstruction. */
    @media print {
      :root { --bg: #fff; --paper: #fff; }
      body { font-size: 11pt; }
      main { max-width: none; padding: 0; }
      .summary-grid { position: static; }
      .jump-nav, .review-shortcuts { display: none; }
      .section { padding-top: 20px; }
      .section, .record, .entry, .timeline-item, .callout, .excerpt { break-inside: avoid; }
      details { display: none; }
      .excerpt { max-height: none; overflow: visible; }
      a { color: inherit; text-decoration: none; }
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <main>
    <header class="masthead">
      <div class="masthead-id">
        <span class="label">AgentFlight &middot; Flight Record</span>
        <h1>${escapeHtml(input.task)}</h1>
        <div class="ident">
          <span>${escapeHtml(input.sessionId)}</span>
          <span>started ${escapeHtml(input.startedAt)}</span>
        </div>
      </div>
      <div class="verdict verdict--${verdict.tone}">
        <span class="label">Review readiness</span>
        <span class="verdict-line"><span class="verdict-mark" aria-hidden="true"></span>${escapeHtml(readiness)}</span>
        <div class="flags">${input.riskBadges.map((badge) => renderFlag(badge)).join("")}</div>
      </div>
    </header>

    ${renderSummary(input)}

    ${renderJumpNav(input, urgentFailedRunIndex)}

    ${renderReview(input.review, urgentFailedRunIndex)}

    <section class="section" id="timeline">
      <div class="section-head"><h2 class="label">Timeline</h2><span class="count">${escapeHtml(String(input.timeline.length))} events</span></div>
      ${renderTimeline(input.timeline)}
    </section>

    <section class="section" id="changed-file-groups">
      <div class="section-head"><h2 class="label">Changed File Groups</h2><span class="count">${escapeHtml(String(input.changedFileGroups?.length ?? 0))} groups</span></div>
      ${renderFileGroups(input.changedFileGroups ?? [])}
    </section>

    <section class="section" id="changed-files">
      <div class="section-head"><h2 class="label">Changed Files</h2><span class="count">${escapeHtml(String(input.changedFiles.length))} files</span></div>
      ${renderFileList(input.changedFiles)}
    </section>

    <section class="section" id="verification-evidence">
      <div class="section-head"><h2 class="label">Verification Evidence</h2><span class="count">${escapeHtml(String(input.verificationEvidence.length))} runs</span></div>
      ${renderVerification(input.verificationEvidence, input.verificationSummary)}
    </section>

    <section class="section" id="recommendation">
      <div class="section-head"><h2 class="label">Recommendation</h2></div>
      <p>${escapeHtml(recommendation)}</p>
    </section>

    <footer>
      <span>Generated by AgentFlight</span>
      <span>${escapeHtml(input.sessionId)}</span>
    </footer>
  </main>
</body>
</html>
`;
}

function shouldShowUrgentFailedRunShortcut(
  input: HtmlReplayInput,
  firstFailedRunIndex: number
): boolean {
  if (firstFailedRunIndex < 0) return false;
  if (!input.verificationSummary) return true;
  return input.verificationSummary.unresolvedFailed > 0;
}

function renderJumpNav(input: HtmlReplayInput, firstFailedRunIndex: number): string {
  const links: Array<{ href: string; label: string; urgent?: boolean }> = [];
  if (input.review) {
    links.push({ href: "#review-focus", label: "Review Focus" });
    links.push({ href: "#proof-gaps", label: "Proof Gaps" });
  }
  if (firstFailedRunIndex >= 0) {
    links.push({
      href: `#verification-run-${firstFailedRunIndex + 1}`,
      label: "First failed run",
      urgent: true
    });
  }
  links.push({ href: "#timeline", label: "Timeline" });
  links.push({ href: "#verification-evidence", label: "Verification" });
  links.push({ href: "#changed-files", label: "Changed Files" });
  links.push({ href: "#recommendation", label: "Recommendation" });

  return `<nav class="jump-nav" aria-label="Replay sections">${links
    .map(
      (link) =>
        `<a href="${escapeHtml(link.href)}"${link.urgent ? ` class="nav-urgent"` : ""}>${escapeHtml(link.label)}</a>`
    )
    .join("")}</nav>`;
}

function renderSummary(input: HtmlReplayInput): string {
  const passed = input.verificationEvidence.filter((item) => item.status === "passed").length;
  const failed = input.verificationEvidence.filter((item) => item.status === "failed").length;
  const proof = input.verificationSummary
    ? formatReplayProof(input.verificationSummary)
    : `${passed} passed / ${failed} failed`;
  const risk = input.riskBadges[0] ?? "unknown";
  const readiness = input.reviewReadiness ?? "Unknown";

  return `<section class="summary-grid" aria-label="Session summary">
      ${renderReading("Risk", risk, riskTone(risk))}
      ${renderReading("Changed Files", String(input.changedFiles.length))}
      ${renderReading("Proof", proof)}
      ${renderReading("Readiness", readiness)}
    </section>`;
}

function formatReplayProof(summary: VerificationFailureCounts): string {
  if (summary.failed === 0) return `${summary.passed} passed / 0 failed`;
  return `${summary.passed} passed / ${summary.unresolvedFailed} unresolved failed / ${summary.resolvedFailed} historical failed`;
}

function renderReading(label: string, value: string, tone = ""): string {
  const toneClass = tone ? ` tone-${tone}` : "";
  return `<div class="reading"><span class="label">${escapeHtml(label)}</span><span class="reading-value${toneClass}">${escapeHtml(value)}</span></div>`;
}

function renderTimeline(items: ReplayTimelineItem[]): string {
  if (items.length === 0) return `<p class="empty">No timeline events recorded.</p>`;
  return `<div class="timeline">${items
    .map(
      (item) => `<div class="timeline-item">
        <div class="timeline-time">${escapeHtml(item.timestamp)}</div>
        <div class="timeline-rail"><span class="timeline-node ${nodeClass(item.type)}" aria-hidden="true"></span></div>
        <div class="timeline-body">
          <div class="timeline-title">${escapeHtml(item.title)}</div>
          <div class="timeline-type">${escapeHtml(item.type)}</div>
          ${item.message ? `<div class="timeline-message">${escapeHtml(item.message)}</div>` : ""}
        </div>
      </div>`
    )
    .join("")}</div>`;
}

function renderReview(review: ReviewIntelligence | undefined, firstFailedRunIndex: number): string {
  if (!review) return "";
  const command = review.readiness.suggestedCommand;
  const failedRunShortcut =
    firstFailedRunIndex >= 0
      ? `<div class="review-shortcuts"><a class="nav-urgent" href="#verification-run-${escapeHtml(String(firstFailedRunIndex + 1))}">Jump to first failed run</a></div>`
      : "";
  return `<section class="section" id="review-focus">
      <div class="section-head"><h2 class="label">Review Focus</h2><span class="count">${escapeHtml(String(review.focus.length))} files</span></div>
      ${renderReviewFocus(review.focus)}
    </section>
    <section class="section" id="proof-gaps">
      <div class="section-head"><h2 class="label">Proof Gaps</h2><span class="count">${escapeHtml(String(review.proofGaps.length))} gaps</span></div>
      ${renderProofGaps(review.proofGaps)}
      <div class="callout">
        <div class="callout-state">${escapeHtml(review.readiness.label)}</div>
        <div class="callout-reason">${escapeHtml(compactCommandInText(review.readiness.reason, command))}</div>
        <div class="callout-next"><span class="label">Next</span>${escapeHtml(compactCommandInText(review.readiness.nextAction, command))}</div>
        ${failedRunShortcut}
      </div>
    </section>`;
}

function renderReviewFocus(items: ReviewFocusItem[]): string {
  if (items.length === 0) return `<p class="empty">No changed files to review.</p>`;
  return `<div class="records">${items
    .map(
      (item) =>
        `<div class="record"><div class="record-key"><span class="record-rank">#${escapeHtml(String(item.rank))}</span><span class="record-cat">${escapeHtml(item.category)}</span></div><div class="record-body"><code>${escapeHtml(item.file)}</code><div class="reason"><span class="reason-strong">Why:</span> ${escapeHtml(item.reasons.join("; "))}</div><div class="reason">${escapeHtml(item.suggestedReviewerFocus)}</div>${item.suggestedCommand ? `<div class="reason">Suggested proof: ${renderSuggestedProof(item.suggestedCommand)}</div>` : ""}</div></div>`
    )
    .join("")}</div>`;
}

function renderProofGaps(gaps: ProofGap[]): string {
  if (gaps.length === 0) return `<p class="empty">No proof gaps detected.</p>`;
  return `<ul class="gaps">${gaps
    .map(
      (gap) =>
        `<li><span class="gap-sev sev-${escapeHtml(gap.severity.toLowerCase())}">${escapeHtml(gap.severity)}</span><span>${escapeHtml(compactCommandInText(gap.message, gap.suggestedCommand))}${gap.suggestedCommand ? ` ${renderSuggestedProof(gap.suggestedCommand)}` : ""}</span></li>`
    )
    .join("")}</ul>`;
}

function renderSuggestedProof(command: string): string {
  const full = `agentflight verify -- ${command}`;
  const display = formatVerifyCommandForDisplay(command);
  return `<code title="${escapeHtml(full)}">${escapeHtml(display)}</code>`;
}

function renderLedgerCommand(command: string): string {
  const display = formatCommandForDisplay(command);
  const title = display === command ? "" : ` title="${escapeHtml(command)}"`;
  return `<div class="entry-cmd"${title}>${escapeHtml(display)}</div>`;
}

function renderFileGroups(groups: RiskCategorySummary[]): string {
  if (groups.length === 0) return `<p class="empty">No changed file groups detected.</p>`;
  return `<div class="records">${groups
    .map(
      (group) =>
        `<div class="record"><div class="record-key"><span class="record-cat">${escapeHtml(group.category)}</span></div><div class="record-body"><div class="tags">${group.files.map((file) => `<code>${escapeHtml(file)}</code>`).join("")}</div></div></div>`
    )
    .join("")}</div>`;
}

function renderFileList(files: string[]): string {
  if (files.length === 0) return `<p class="empty">No changed files detected.</p>`;
  return `<ul class="files">${files.map((file) => `<li><code>${escapeHtml(file)}</code></li>`).join("")}</ul>`;
}

function renderVerification(
  evidence: VerificationRun[],
  summary: VerificationFailureCounts | undefined
): string {
  if (evidence.length === 0) return `<p class="empty">No verification evidence recorded.</p>`;
  return `<div class="ledger">${evidence
    .map((item, index) => {
      const runNumber = index + 1;
      const display = verificationRunDisplay(item, summary);
      return `<div class="entry entry--${escapeHtml(display.entryClass)}" id="verification-run-${escapeHtml(String(runNumber))}">
        <div class="stamp stamp--${escapeHtml(display.stampClass)}">${escapeHtml(display.stamp)}</div>
        <div class="entry-body">
          ${renderLedgerCommand(item.command)}
          <div class="entry-meta">exit ${escapeHtml(String(item.exitCode ?? "unknown"))} &middot; ${escapeHtml(String(item.durationMs))}ms</div>
          ${item.status === "failed" && item.outputExcerpt ? `<pre class="excerpt excerpt--failed" aria-label="Output excerpt">${escapeHtml(item.outputExcerpt)}</pre>` : ""}
          <details>
            <summary>Evidence files</summary>
            <div class="paths">
              <div>stdout: ${escapeHtml(item.stdoutPath)}</div>
              <div>stderr: ${escapeHtml(item.stderrPath)}</div>
            </div>
            ${item.status === "passed" && item.outputExcerpt ? `<pre class="excerpt">${escapeHtml(item.outputExcerpt)}</pre>` : ""}
          </details>
        </div>
      </div>`;
    })
    .join("")}</div>`;
}

function verificationRunDisplay(
  item: VerificationRun,
  summary: VerificationFailureCounts | undefined
): { entryClass: string; stampClass: string; stamp: string } {
  if (isHistoricalFailedRun(item, summary)) {
    return {
      entryClass: "historical-failed",
      stampClass: "historical-failed",
      stamp: "HIST"
    };
  }

  return {
    entryClass: item.status,
    stampClass: item.status,
    stamp: stampText(item.status)
  };
}

function isHistoricalFailedRun(
  item: VerificationRun,
  summary: VerificationFailureCounts | undefined
): boolean {
  return item.status === "failed" && Boolean(summary?.failed) && summary?.unresolvedFailed === 0;
}

function classifyReadiness(value: string): { tone: "ok" | "attention" | "blocked" | "neutral" } {
  const normalized = value.toLowerCase();
  if (normalized.startsWith("ready")) return { tone: "ok" };
  if (normalized.includes("not ready") || normalized.includes("block")) return { tone: "blocked" };
  if (normalized.includes("needs") || normalized.includes("verif")) return { tone: "attention" };
  return { tone: "neutral" };
}

function riskTone(value: string): "high" | "medium" | "" {
  const normalized = value.toLowerCase();
  if (normalized === "high") return "high";
  if (normalized === "medium") return "medium";
  return "";
}

function renderFlag(value: string): string {
  const tone = riskTone(value);
  const toneClass = tone ? ` tone-${tone}` : "";
  return `<span class="flag${toneClass}">${escapeHtml(value)}</span>`;
}

function nodeClass(type: string): string {
  if (type.includes("passed")) return "node--ok";
  if (type.includes("failed")) return "node--fail";
  if (type.includes("snapshot")) return "node--snapshot";
  if (type.includes("session_started")) return "node--start";
  if (type.includes("replay") || type.includes("report") || type.includes("resume"))
    return "node--report";
  return "node--default";
}

function stampText(status: string): string {
  if (status === "passed") return "PASS";
  if (status === "failed") return "FAIL";
  return status.toUpperCase();
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
