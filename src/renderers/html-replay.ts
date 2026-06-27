import {
  compactCommandInText,
  formatFileListForDisplay,
  formatCommandForDisplay,
  getReviewContractPathClaims,
  formatProjectRequirementDetailsForDisplay,
  formatProjectRequirementStatusForDisplay,
  formatProofCalibrationDetailsForDisplay,
  formatProofCalibrationStatusForDisplay,
  formatProofCalibrationSummaryForDisplay,
  formatProofFreshnessAttributionForDisplay,
  formatProofStatusForDisplay,
  formatReviewRouteStatusForDisplay,
  formatReviewContractProofReferenceLabelForDisplay,
  formatReviewContractStatusForDisplay,
  formatVerifyCommandForDisplay,
  selectReviewContractProofReferencesForDisplay
} from "../core/output.js";
import { formatBaseframeResultForDisplay } from "../core/baseframe.js";
import { safeAnchorId, stableAnchorId } from "../core/ids.js";
import { getUnresolvedFailedRuns } from "../core/verification-runs.js";
import type { VerificationFailureCounts } from "../core/output.js";
import type {
  AgentFlightResultV1,
  ProofGap,
  ProofCalibration,
  ProofCalibrationSuggestion,
  ProjectReviewContractEvaluation,
  ProjectReviewRequirementStatus,
  ReviewContractClaim,
  ReviewContractProofReference,
  ReviewFocusItem,
  ReviewIntelligence,
  RiskCategorySummary,
  SessionEvent,
  VerificationRun
} from "../types/index.js";

const HTML_REVIEW_FOCUS_LIMIT = 30;
const HTML_GROUP_FILE_SAMPLE_LIMIT = 8;
const HTML_CHANGED_FILE_DETAILS_LIMIT = 80;

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
  baseframeResult?: AgentFlightResultV1 | undefined;
  recommendation: string;
}

export function renderHtmlReplay(input: HtmlReplayInput): string {
  const readiness = input.reviewReadiness ?? "Unknown";
  const verdict = classifyReadiness(readiness);
  const unresolvedFailedRunIndexes = getUnresolvedFailedRunIndexes(input.verificationEvidence);
  const urgentFailedRunIndex = firstRunIndex(unresolvedFailedRunIndexes);
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
    .review-path-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 10px;
      max-width: 76ch;
    }
    .review-path-list li {
      display: grid;
      grid-template-columns: 34px minmax(0, 1fr);
      gap: 12px;
      align-items: start;
      padding: 10px 0;
      border-top: 1px solid var(--rule);
    }
    .review-path-list li:first-child { border-top: 0; }
    .review-path-step {
      font-family: var(--mono);
      font-size: 12px;
      font-weight: 700;
      color: var(--faint);
      font-variant-numeric: tabular-nums;
    }
    .review-path-title a {
      color: var(--ink);
      font-weight: 650;
      text-decoration: none;
    }
    .review-path-title a:hover { color: var(--accent); }
    .review-path-detail {
      color: var(--chrome);
      font-size: 13.5px;
      line-height: 1.55;
      margin-top: 2px;
      overflow-wrap: anywhere;
    }
    .review-path-list li.is-urgent .review-path-title a { color: var(--danger); }

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
      details { display: block; }
      details:not([open]) > :not(summary) { display: block; }
      details > summary { display: none; }
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

    ${renderBaseframeSections(input.baseframeResult)}

    ${renderReviewPath(input, urgentFailedRunIndex)}

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
      ${renderVerification(input.verificationEvidence, input.verificationSummary, unresolvedFailedRunIndexes)}
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

function renderJumpNav(input: HtmlReplayInput, firstFailedRunIndex: number): string {
  const links: Array<{ href: string; label: string; urgent?: boolean }> = [];
  if (input.baseframeResult) {
    links.push({ href: "#repository-assessment", label: "Repository Assessment" });
    links.push({ href: "#task-contract", label: "Task Contract" });
    links.push({ href: "#scope-adherence", label: "Scope Adherence" });
    links.push({ href: "#verification-gates", label: "Verification Gates" });
    links.push({ href: "#baseframe-review-focus", label: "Review Focus" });
    links.push({ href: "#baseframe-proof-gaps", label: "Proof Gaps" });
    links.push({ href: "#baseframe-readiness", label: "Readiness" });
    links.push({ href: "#baseframe-next-action", label: "Next Action" });
  }
  if (input.review) {
    links.push({ href: "#review-path", label: "Review Path" });
    links.push({ href: "#review-focus", label: "Review Focus" });
    links.push({ href: "#trust-delta", label: "Trust Delta" });
    links.push({ href: "#review-queue", label: "Review Queue" });
    if (input.review.reviewRoutes && input.review.reviewRoutes.items.length > 0) {
      links.push({ href: "#review-routes", label: "Review Routing" });
    }
    if (input.review.reviewReceipt && input.review.reviewReceipt.state !== "none") {
      links.push({ href: "#review-receipt", label: "Review Receipt" });
    }
    links.push({ href: "#required-proof", label: "Required Proof" });
    if (formatProofFreshnessAttributionForDisplay(input.review.proofFreshness).length > 0)
      links.push({ href: "#proof-freshness", label: "Proof Freshness" });
    if (input.review.calibration)
      links.push({ href: "#repo-calibration", label: "Repo Calibration" });
    links.push({ href: "#review-contract", label: "Review Contract" });
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

function renderBaseframeSections(result: AgentFlightResultV1 | undefined): string {
  if (!result) return "";
  return parseBaseframeSections(formatBaseframeResultForDisplay(result))
    .map(
      (section) => `<section class="section" id="${escapeHtml(sectionId(section.heading))}">
      <div class="section-head"><h2 class="label">${escapeHtml(section.heading)}</h2></div>
      <p>${escapeHtml(section.body || "No Baseframe evidence recorded.")}</p>
    </section>`
    )
    .join("\n");
}

function parseBaseframeSections(text: string): Array<{ heading: string; body: string }> {
  return text.split("\n\n").map((section) => {
    const [heading = "Baseframe", ...body] = section.split("\n");
    return { heading, body: body.join("\n") };
  });
}

function sectionId(heading: string): string {
  if (heading === "Review Focus") return "baseframe-review-focus";
  if (heading === "Proof Gaps") return "baseframe-proof-gaps";
  if (heading === "Readiness") return "baseframe-readiness";
  if (heading === "Next Action") return "baseframe-next-action";
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface ReviewPathItem {
  href: string;
  title: string;
  detail: string;
  urgent?: boolean;
}

function renderReviewPath(input: HtmlReplayInput, firstFailedRunIndex: number): string {
  if (!input.review) return "";

  const items = buildReviewPathItems(input, firstFailedRunIndex);
  return `<section class="section review-path" id="review-path">
      <div class="section-head"><h2 class="label">Review Path</h2><span class="count">${escapeHtml(String(items.length))} steps</span></div>
      <ol class="review-path-list">${items
        .map(
          (item, index) =>
            `<li${item.urgent ? ` class="is-urgent"` : ""}><span class="review-path-step">${escapeHtml(String(index + 1).padStart(2, "0"))}</span><div><div class="review-path-title"><a href="${escapeHtml(item.href)}">${escapeHtml(item.title)}</a></div><div class="review-path-detail">${escapeHtml(item.detail)}</div></div></li>`
        )
        .join("")}</ol>
    </section>`;
}

function buildReviewPathItems(
  input: HtmlReplayInput,
  firstFailedRunIndex: number
): ReviewPathItem[] {
  const review = input.review;
  if (!review) return [];

  const items = [
    ...buildContractPathItems(review),
    ...buildTrustDeltaPathItems(review),
    ...buildReviewQueuePathItems(review),
    ...buildReviewRoutePathItems(review),
    ...buildReviewReceiptPathItems(review),
    ...buildProofGapPathItems(review.proofGaps),
    ...buildCalibrationPathItems(review.calibration),
    ...buildFailedRunPathItems(firstFailedRunIndex),
    ...buildFocusPathItems(review.focus),
    ...buildVerificationPathItems(input),
    ...buildChangedFilePathItems(input)
  ];

  return items.length > 0 ? items : [buildFallbackPathItem(review)];
}

function buildReviewReceiptPathItems(review: ReviewIntelligence): ReviewPathItem[] {
  const receipt = review.reviewReceipt;
  if (!receipt || receipt.state === "none") return [];
  return [
    {
      href: "#review-receipt",
      title: "Check review receipt",
      detail: receipt.summary,
      urgent:
        receipt.state === "stale" ||
        receipt.state === "needs_changes" ||
        receipt.state === "blocked"
    }
  ];
}

function buildContractPathItems(review: ReviewIntelligence): ReviewPathItem[] {
  const contract = review.contract;
  if (!contract?.reviewPath) return [];
  return [
    {
      href: "#review-contract",
      title: "Read Review Contract",
      detail: contract.reviewPath.summary
    },
    ...getReviewContractPathClaims(contract, 3).map((claim) => ({
      href: `#${claimAnchorId(claim)}`,
      title: `${formatReviewContractStatusForDisplay(claim.status)} - ${claim.text}`,
      detail: claim.reason,
      urgent: claim.status === "failed"
    }))
  ];
}

function buildProofGapPathItems(gaps: ProofGap[]): ReviewPathItem[] {
  if (gaps.length === 0) return [];
  return [
    {
      href: "#proof-gaps",
      title: "Fix proof gaps",
      detail: formatProofGapDetail(gaps)
    }
  ];
}

function buildTrustDeltaPathItems(review: ReviewIntelligence): ReviewPathItem[] {
  if (!review.trustDelta || review.trustDelta.items.length === 0) return [];
  return [
    {
      href: "#trust-delta",
      title: "Read Trust Delta",
      detail: review.trustDelta.summary,
      urgent: review.trustDelta.items.some((item) => item.severity === "blocking")
    }
  ];
}

function buildReviewQueuePathItems(review: ReviewIntelligence): ReviewPathItem[] {
  const first = review.reviewQueue?.[0];
  if (!first) return [];
  return [
    {
      href: "#review-queue",
      title: "Follow review queue",
      detail: `${first.label}: ${first.detail}`,
      urgent:
        first.action === "fix_failed_proof" ||
        first.action === "rerun_stale_proof" ||
        first.action === "refresh_review_receipt" ||
        first.action === "run_missing_proof"
    }
  ];
}

function buildReviewRoutePathItems(review: ReviewIntelligence): ReviewPathItem[] {
  const first = review.reviewRoutes?.items.find((item) => item.status !== "clear");
  if (!first) return [];
  return [
    {
      href: "#review-routes",
      title: "Route reviewer attention",
      detail: `${first.label}: ${first.summary}`,
      urgent: first.status === "blocked"
    }
  ];
}

function buildCalibrationPathItems(calibration: ProofCalibration | undefined): ReviewPathItem[] {
  if (!calibration || calibration.suggestions.length === 0) return [];
  return [
    {
      href: "#repo-calibration",
      title: "Check repo calibration",
      detail: calibration.summary
    }
  ];
}

function buildFailedRunPathItems(firstFailedRunIndex: number): ReviewPathItem[] {
  if (firstFailedRunIndex < 0) return [];
  return [
    {
      href: `#verification-run-${firstFailedRunIndex + 1}`,
      title: "Open first failed run",
      detail: "Use the inline excerpt before reading full evidence files.",
      urgent: true
    }
  ];
}

function buildFocusPathItems(focus: ReviewFocusItem[]): ReviewPathItem[] {
  const firstFocus = focus[0];
  if (!firstFocus) return [];
  return [
    {
      href: "#review-focus",
      title: "Review highest-risk files",
      detail: `Start with ${firstFocus.file}.`
    }
  ];
}

function buildVerificationPathItems(input: HtmlReplayInput): ReviewPathItem[] {
  if (input.verificationEvidence.length > 0) {
    return [
      {
        href: "#verification-evidence",
        title: "Confirm verification evidence",
        detail: formatReviewPathProof(input)
      }
    ];
  }
  return [];
}

function buildChangedFilePathItems(input: HtmlReplayInput): ReviewPathItem[] {
  if (input.changedFiles.length === 0) return [];
  return [
    {
      href: "#changed-files",
      title: "Inspect changed files",
      detail: `${input.changedFiles.length} changed ${input.changedFiles.length === 1 ? "file" : "files"} listed below.`
    }
  ];
}

function buildFallbackPathItem(review: ReviewIntelligence): ReviewPathItem {
  return {
    href: "#recommendation",
    title: "Read recommendation",
    detail: compactCommandInText(review.readiness.nextAction, review.readiness.suggestedCommand)
  };
}

function formatProofGapDetail(gaps: ProofGap[]): string {
  const blocking = gaps.filter((gap) => gap.severity === "blocking").length;
  if (blocking > 0) {
    return `${blocking} blocking ${blocking === 1 ? "gap" : "gaps"} before review is safe.`;
  }
  return `${gaps.length} proof ${gaps.length === 1 ? "gap" : "gaps"} to inspect before handoff.`;
}

function formatReviewPathProof(input: HtmlReplayInput): string {
  if (input.verificationSummary) return formatReplayProof(input.verificationSummary);

  const passed = input.verificationEvidence.filter((item) => item.status === "passed").length;
  const failed = input.verificationEvidence.filter((item) => item.status === "failed").length;
  return `${passed} passed / ${failed} failed`;
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
  const visibleReviewFocusAnchors = new Set(
    review.focus.slice(0, HTML_REVIEW_FOCUS_LIMIT).map((item) => reviewFocusAnchorId(item.file))
  );
  const failedRunShortcut =
    firstFailedRunIndex >= 0
      ? `<div class="review-shortcuts"><a class="nav-urgent" href="#verification-run-${escapeHtml(String(firstFailedRunIndex + 1))}">Jump to first failed run</a></div>`
      : "";
  return `<section class="section" id="review-focus">
      <div class="section-head"><h2 class="label">Review Focus</h2><span class="count">${escapeHtml(String(review.focus.length))} files</span></div>
      ${renderReviewFocus(review.focus)}
    </section>
    ${renderTrustDelta(review)}
    ${renderReviewQueue(review)}
    ${renderReviewRoutes(review)}
    ${renderReviewReceipt(review)}
    <section class="section" id="required-proof">
      <div class="section-head"><h2 class="label">Required Proof</h2><span class="count">${escapeHtml(String(review.projectReviewContract?.requirements.length ?? 0))} requirements</span></div>
      ${renderRequiredProof(review.projectReviewContract)}
    </section>
    ${renderProofFreshness(review)}
    <section class="section" id="repo-calibration">
      <div class="section-head"><h2 class="label">Repo Calibration</h2><span class="count">${escapeHtml(String(review.calibration?.suggestions.length ?? 0))} suggestions</span></div>
      ${renderRepoCalibration(review.calibration)}
    </section>
    <section class="section" id="review-contract">
      <div class="section-head"><h2 class="label">Review Contract</h2><span class="count">${escapeHtml(String(review.contract?.claims.length ?? 0))} claims</span></div>
      ${renderReviewContract(review, visibleReviewFocusAnchors)}
    </section>
    <section class="section" id="proof-gaps">
      <div class="section-head"><h2 class="label">Proof Gaps</h2><span class="count">${escapeHtml(String(review.proofGaps.length))} gaps</span></div>
      ${renderProofGaps(review.proofGaps)}
      <div class="callout" id="review-readiness">
        <div class="callout-state">${escapeHtml(review.readiness.label)}</div>
        <div class="callout-reason">${escapeHtml(compactCommandInText(review.readiness.reason, command))}</div>
        <div class="callout-next"><span class="label">Next</span>${escapeHtml(compactCommandInText(review.readiness.nextAction, command))}</div>
        ${failedRunShortcut}
      </div>
    </section>`;
}

function renderReviewReceipt(review: ReviewIntelligence): string {
  const receipt = review.reviewReceipt;
  if (!receipt || receipt.state === "none") {
    return `<section class="section" id="review-receipt">
      <div class="section-head"><h2 class="label">Review Receipt</h2><span class="count">none</span></div>
      <p class="empty">No local review receipt recorded yet.</p>
    </section>`;
  }

  const staleFiles = receipt.staleFiles.length
    ? `<div class="reason"><span class="reason-strong">Stale files:</span> ${escapeHtml(receipt.staleFiles.join(", "))}</div>`
    : "";
  const recorded = receipt.receipt?.recordedAt
    ? `<div class="reason"><span class="reason-strong">Recorded:</span> ${escapeHtml(receipt.receipt.recordedAt)}</div>`
    : "";
  const receiptSummary = receipt.receipt?.summary
    ? `<div class="reason">${escapeHtml(receipt.receipt.summary)}</div>`
    : "";

  return `<section class="section" id="review-receipt">
      <div class="section-head"><h2 class="label">Review Receipt</h2><span class="count">${escapeHtml(receipt.state.replaceAll("_", " "))}</span></div>
      <div class="records"><div class="record"><div class="record-key"><span class="record-cat">${escapeHtml(receipt.label)}</span></div><div class="record-body">${receiptSummary}${recorded}<div class="reason">${escapeHtml(receipt.summary)}</div>${staleFiles}<div class="reason"><span class="reason-strong">Next:</span> ${escapeHtml(receipt.nextAction)}</div></div></div></div>
    </section>`;
}

function renderTrustDelta(review: ReviewIntelligence): string {
  const delta = review.trustDelta;
  if (!delta) {
    return `<section class="section" id="trust-delta">
      <div class="section-head"><h2 class="label">Trust Delta</h2><span class="count">0 items</span></div>
      <p class="empty">No trust delta recorded.</p>
    </section>`;
  }
  return `<section class="section" id="trust-delta">
      <div class="section-head"><h2 class="label">Trust Delta</h2><span class="count">${escapeHtml(String(delta.items.length))} items</span></div>
      <div class="callout"><div class="callout-state">Current trust state</div><div class="callout-reason">${escapeHtml(delta.summary)}</div></div>
      <div class="records">${delta.items
        .map(
          (item) =>
            `<div class="record"><div class="record-key"><span class="record-cat">${escapeHtml(item.severity)}</span></div><div class="record-body"><div>${escapeHtml(formatTrustDeltaKind(item.kind))}</div><div class="reason">${escapeHtml(compactCommandInText(item.message, item.suggestedCommand))}</div>${renderRelatedFilesLine(item.relatedFiles)}${item.suggestedCommand ? `<div class="reason">Suggested proof: ${renderSuggestedProof(item.suggestedCommand)}</div>` : ""}</div></div>`
        )
        .join("")}</div>
    </section>`;
}

function renderReviewQueue(review: ReviewIntelligence): string {
  const queue = review.reviewQueue ?? [];
  if (queue.length === 0) {
    return `<section class="section" id="review-queue">
      <div class="section-head"><h2 class="label">Review Queue</h2><span class="count">0 steps</span></div>
      <p class="empty">No review queue recorded.</p>
    </section>`;
  }
  return `<section class="section" id="review-queue">
      <div class="section-head"><h2 class="label">Review Queue</h2><span class="count">${escapeHtml(String(queue.length))} steps</span></div>
      <div class="records">${queue
        .map(
          (item) =>
            `<div class="record"><div class="record-key"><span class="record-rank">#${escapeHtml(String(item.rank))}</span><span class="record-cat">${escapeHtml(item.action.replaceAll("_", " "))}</span></div><div class="record-body"><div>${escapeHtml(item.label)}</div><div class="reason">${escapeHtml(compactCommandInText(item.detail, item.suggestedCommand))}</div>${renderRelatedFilesLine(item.relatedFiles)}${item.suggestedCommand ? `<div class="reason">Suggested proof: ${renderSuggestedProof(item.suggestedCommand)}</div>` : ""}</div></div>`
        )
        .join("")}</div>
    </section>`;
}

function renderReviewRoutes(review: ReviewIntelligence): string {
  const routes = review.reviewRoutes;
  if (!routes || routes.items.length === 0) {
    return `<section class="section" id="review-routes">
      <div class="section-head"><h2 class="label">Review Routing</h2><span class="count">0 routes</span></div>
      <p class="empty">No reviewer routing needed for the current worktree.</p>
    </section>`;
  }

  return `<section class="section" id="review-routes">
      <div class="section-head"><h2 class="label">Review Routing</h2><span class="count">${escapeHtml(String(routes.items.length))} routes</span></div>
      <div class="callout"><div class="callout-state">Reviewer routing</div><div class="callout-reason">${escapeHtml(routes.summary)}</div></div>
      <div class="records">${routes.items
        .map(
          (item) =>
            `<div class="record"><div class="record-key"><span class="record-rank">#${escapeHtml(String(item.priority))}</span><span class="record-cat">${escapeHtml(item.label)}</span></div><div class="record-body"><div>${escapeHtml(formatReviewRouteStatusForDisplay(item.status))}</div><div class="reason">${escapeHtml(compactCommandInText(item.summary, item.suggestedCommand))}</div><div class="reason"><span class="reason-strong">Why:</span> ${escapeHtml(compactCommandInText(item.reason, item.suggestedCommand))}</div>${renderRelatedFilesLine(item.relatedFiles)}${item.suggestedCommand ? `<div class="reason">Suggested proof: ${renderSuggestedProof(item.suggestedCommand)}</div>` : ""}</div></div>`
        )
        .join("")}</div>
    </section>`;
}

function formatTrustDeltaKind(kind: string): string {
  return kind.replaceAll("_", " ");
}

function renderRelatedFilesLine(files: string[]): string {
  if (files.length === 0) return "";
  return `<div class="reason"><span class="reason-strong">Files:</span> ${escapeHtml(formatFileListForDisplay(files))}</div>`;
}

function renderReviewFocus(items: ReviewFocusItem[]): string {
  if (items.length === 0) return `<p class="empty">No changed files to review.</p>`;
  const visibleItems = items.slice(0, HTML_REVIEW_FOCUS_LIMIT);
  const overflow =
    items.length > visibleItems.length
      ? `<p class="empty">Showing ${escapeHtml(String(visibleItems.length))} highest-signal files. See Changed Files for ${escapeHtml(String(items.length - visibleItems.length))} more.</p>`
      : "";
  return `<div class="records">${visibleItems
    .map(
      (item) =>
        `<div class="record" id="${escapeHtml(reviewFocusAnchorId(item.file))}"><div class="record-key"><span class="record-rank">#${escapeHtml(String(item.rank))}</span><span class="record-cat">${escapeHtml(item.category)}</span></div><div class="record-body"><code>${escapeHtml(item.file)}</code><div class="reason"><span class="reason-strong">Proof:</span> ${escapeHtml(formatProofStatusForDisplay(item.proofStatus))}</div><div class="reason"><span class="reason-strong">Why:</span> ${escapeHtml(item.reasons.join("; "))}</div><div class="reason">${escapeHtml(item.suggestedReviewerFocus)}</div>${item.suggestedCommand ? `<div class="reason">Suggested proof: ${renderSuggestedProof(item.suggestedCommand)}</div>` : ""}</div></div>`
    )
    .join("")}</div>${overflow}`;
}

function renderRequiredProof(contract: ProjectReviewContractEvaluation | undefined): string {
  if (!contract) return `<p class="empty">No project review contract configured.</p>`;
  if (!contract.enabled) return `<p class="empty">Project review contract disabled.</p>`;
  if (contract.requirements.length === 0) {
    return `<p class="empty">No project review contract requirements matched these changes.</p>`;
  }
  return `<div class="records">${contract.requirements.map(renderProjectRequirement).join("")}</div>`;
}

function renderProjectRequirement(requirement: ProjectReviewRequirementStatus): string {
  const details = formatProjectRequirementDetailsForDisplay(requirement)
    .filter((line) => !line.startsWith("Suggested proof: "))
    .map((line) => `<div class="reason">${renderProjectRequirementDetailLine(line)}</div>`)
    .join("");
  const proofGaps = requirement.relatedProofGapIds.length
    ? `<div class="reason"><span class="reason-strong">Proof gaps:</span> ${requirement.relatedProofGapIds.map((id) => `<a href="#${escapeHtml(proofGapAnchorId(id))}">${escapeHtml(id)}</a>`).join("; ")}</div>`
    : "";
  const suggestedProof = requirement.suggestedCommand
    ? `<div class="reason">Suggested proof: ${renderSuggestedProof(requirement.suggestedCommand)}</div>`
    : "";
  return `<div class="record" id="${escapeHtml(projectRequirementAnchorId(requirement.id))}"><div class="record-key"><span class="record-cat">${escapeHtml(formatProjectRequirementStatusForDisplay(requirement.status))}</span></div><div class="record-body"><div>${escapeHtml(requirement.label)}</div>${details}${proofGaps}${suggestedProof}</div></div>`;
}

function renderProjectRequirementDetailLine(line: string): string {
  const [label, ...rest] = line.split(": ");
  if (!label || rest.length === 0) return escapeHtml(line);
  return `<span class="reason-strong">${escapeHtml(label)}:</span> ${escapeHtml(rest.join(": "))}`;
}

function renderProofFreshness(review: ReviewIntelligence): string {
  const lines = formatProofFreshnessAttributionForDisplay(review.proofFreshness);
  if (lines.length === 0) return "";
  return `<section class="section" id="proof-freshness">
      <div class="section-head"><h2 class="label">Proof Freshness</h2><span class="count">${escapeHtml(String(lines.length))} notes</span></div>
      <div class="records">${lines
        .map(
          (line) =>
            `<div class="record"><div class="record-key"><span class="record-cat">freshness</span></div><div class="record-body"><div class="reason">${escapeHtml(line)}</div></div></div>`
        )
        .join("")}</div>
    </section>`;
}

function renderRepoCalibration(calibration: ProofCalibration | undefined): string {
  if (!calibration) return `<p class="empty">No repo calibration history loaded.</p>`;
  if (calibration.suggestions.length === 0) {
    return `<p class="empty">${escapeHtml(formatProofCalibrationSummaryForDisplay(calibration))}</p>`;
  }
  return `<div class="callout"><div class="callout-state">Local proof history</div><div class="callout-reason">${escapeHtml(formatProofCalibrationSummaryForDisplay(calibration))}</div></div><div class="records">${calibration.suggestions.map(renderRepoCalibrationSuggestion).join("")}</div>`;
}

function renderRepoCalibrationSuggestion(suggestion: ProofCalibrationSuggestion): string {
  const details = formatProofCalibrationDetailsForDisplay(suggestion)
    .filter((line) => !line.startsWith("Suggested proof: "))
    .map((line) => `<div class="reason">${renderProjectRequirementDetailLine(line)}</div>`)
    .join("");
  return `<div class="record"><div class="record-key"><span class="record-cat">${escapeHtml(formatProofCalibrationStatusForDisplay(suggestion.status))}</span></div><div class="record-body"><div>${escapeHtml(suggestion.category)}</div><div class="reason">${escapeHtml(suggestion.message)}</div>${details}<div class="reason">Suggested proof: ${renderSuggestedProof(suggestion.suggestedCommand)}</div></div></div>`;
}

function renderReviewContract(
  review: ReviewIntelligence,
  visibleReviewFocusAnchors: Set<string>
): string {
  const contract = review.contract;
  if (!contract || contract.claims.length === 0) {
    return `<p class="empty">No review contract claims recorded.</p>`;
  }

  const reviewPath = contract.reviewPath
    ? `<div class="callout"><div class="callout-state">Review path</div><div class="callout-reason">${escapeHtml(contract.reviewPath.summary)}</div><div class="callout-next"><span class="label">Next</span>${escapeHtml(contract.reviewPath.nextAction)}</div>${renderReviewPathClaimLinks(contract.claims, contract.reviewPath.inspectClaimIds)}</div>`
    : "";

  return `${reviewPath}<div class="records">${contract.claims
    .map((claim) => {
      const files = claim.files.length
        ? `<div class="reason"><span class="reason-strong">Files:</span> ${escapeHtml(formatFileListForDisplay(claim.files))}</div>`
        : "";
      const evidence = claim.evidence.length
        ? `<div class="reason"><span class="reason-strong">Evidence:</span> ${escapeHtml(claim.evidence.join("; "))}</div>`
        : "";
      const proofReferences = renderProofReferences(
        claim.proofReferences ?? [],
        visibleReviewFocusAnchors
      );
      const command = claim.suggestedCommand
        ? `<div class="reason">Suggested proof: ${renderSuggestedProof(claim.suggestedCommand)}</div>`
        : "";
      return `<div class="record" id="${escapeHtml(claimAnchorId(claim))}"><div class="record-key"><span class="record-cat">${escapeHtml(formatReviewContractStatusForDisplay(claim.status))}</span></div><div class="record-body"><div>${escapeHtml(claim.text)}</div><div class="reason">${escapeHtml(claim.reason)}</div>${files}${evidence}${proofReferences}${command}</div></div>`;
    })
    .join("")}</div>`;
}

function renderProofGaps(gaps: ProofGap[]): string {
  if (gaps.length === 0) return `<p class="empty">No proof gaps detected.</p>`;
  return `<ul class="gaps">${gaps
    .map(
      (gap) =>
        `<li id="${escapeHtml(proofGapAnchorId(gap.id))}"><span class="gap-sev sev-${escapeHtml(gap.severity.toLowerCase())}">${escapeHtml(gap.severity)}</span><span>${escapeHtml(compactCommandInText(gap.message, gap.suggestedCommand))}${gap.suggestedCommand ? ` ${renderSuggestedProof(gap.suggestedCommand)}` : ""}</span></li>`
    )
    .join("")}</ul>`;
}

function renderReviewPathClaimLinks(claims: ReviewContractClaim[], ids: string[]): string {
  const claimsById = new Map(claims.map((claim) => [claim.id, claim]));
  const links = ids
    .map((id) => claimsById.get(id))
    .filter((claim): claim is ReviewContractClaim => Boolean(claim))
    .map(
      (claim) =>
        `<a href="#${escapeHtml(claimAnchorId(claim))}">${escapeHtml(formatReviewContractStatusForDisplay(claim.status))}: ${escapeHtml(claim.text)}</a>`
    );
  if (links.length === 0) return "";
  return `<div class="review-shortcuts">${links.join("")}</div>`;
}

function renderProofReferences(
  references: ReviewContractProofReference[],
  visibleReviewFocusAnchors: Set<string>
): string {
  if (references.length === 0) return "";
  const { visibleReferences, hiddenCount } =
    selectReviewContractProofReferencesForDisplay(references);
  const labels = visibleReferences
    .map((reference) => renderProofReference(reference, visibleReviewFocusAnchors))
    .concat(hiddenCount > 0 ? [`and ${escapeHtml(String(hiddenCount))} more`] : []);
  return `<div class="reason"><span class="reason-strong">Proof refs:</span> ${labels.join("; ")}</div>`;
}

function renderProofReference(
  reference: ReviewContractProofReference,
  visibleReviewFocusAnchors: Set<string>
): string {
  const label = formatReviewContractProofReferenceLabelForDisplay(reference);
  if (!reference.target) return escapeHtml(label);
  const target = safeAnchorId(reference.target);
  const href =
    target.startsWith("review-focus-file-") && !visibleReviewFocusAnchors.has(target)
      ? "changed-files"
      : target;
  return `<a href="#${escapeHtml(href)}">${escapeHtml(label)}</a>`;
}

function renderSuggestedProof(command: string): string {
  const full = `agentflight verify -- ${command}`;
  const display = formatVerifyCommandForDisplay(command);
  const details =
    display === full
      ? ""
      : `<details><summary>Full command</summary><code>${escapeHtml(full)}</code></details>`;
  return `<code title="${escapeHtml(full)}">${escapeHtml(display)}</code>${details}`;
}

function claimAnchorId(claim: ReviewContractClaim): string {
  return `claim-${safeAnchorId(claim.id)}`;
}

function projectRequirementAnchorId(id: string): string {
  return `project-requirement-${stableAnchorId(id)}`;
}

function reviewFocusAnchorId(file: string): string {
  return `review-focus-file-${stableAnchorId(file)}`;
}

function proofGapAnchorId(id: string): string {
  return `proof-gap-${stableAnchorId(id)}`;
}

function renderLedgerCommand(command: string): string {
  const display = formatCommandForDisplay(command);
  const title = display === command ? "" : ` title="${escapeHtml(command)}"`;
  const details =
    display === command
      ? ""
      : `<details><summary>Full command</summary><code>${escapeHtml(command)}</code></details>`;
  return `<div class="entry-cmd"${title}>${escapeHtml(display)}</div>${details}`;
}

function renderFileGroups(groups: RiskCategorySummary[]): string {
  if (groups.length === 0) return `<p class="empty">No changed file groups detected.</p>`;
  return `<div class="records">${groups
    .map((group) => {
      const visibleFiles = group.files.slice(0, HTML_GROUP_FILE_SAMPLE_LIMIT);
      const overflow =
        group.files.length > visibleFiles.length
          ? `<div class="reason">and ${escapeHtml(String(group.files.length - visibleFiles.length))} more</div>`
          : "";
      return `<div class="record"><div class="record-key"><span class="record-cat">${escapeHtml(group.category)}</span></div><div class="record-body"><div class="tags">${visibleFiles.map((file) => `<code>${escapeHtml(file)}</code>`).join("")}</div>${overflow}</div></div>`;
    })
    .join("")}</div>`;
}

function renderFileList(files: string[]): string {
  if (files.length === 0) return `<p class="empty">No changed files detected.</p>`;
  if (files.length > HTML_CHANGED_FILE_DETAILS_LIMIT) {
    return `<details><summary>${escapeHtml(String(files.length))} changed files</summary><ul class="files">${files.map((file) => `<li><code>${escapeHtml(file)}</code></li>`).join("")}</ul></details>`;
  }
  return `<ul class="files">${files.map((file) => `<li><code>${escapeHtml(file)}</code></li>`).join("")}</ul>`;
}

function renderVerification(
  evidence: VerificationRun[],
  summary: VerificationFailureCounts | undefined,
  unresolvedFailedRunIndexes: Set<number>
): string {
  if (evidence.length === 0) return `<p class="empty">No verification evidence recorded.</p>`;
  return `<div class="ledger">${evidence
    .map((item, index) => {
      const runNumber = index + 1;
      const display = verificationRunDisplay(item, index, summary, unresolvedFailedRunIndexes);
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
  index: number,
  summary: VerificationFailureCounts | undefined,
  unresolvedFailedRunIndexes: Set<number>
): { entryClass: string; stampClass: string; stamp: string } {
  if (isHistoricalFailedRun(item, index, summary, unresolvedFailedRunIndexes)) {
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
  index: number,
  summary: VerificationFailureCounts | undefined,
  unresolvedFailedRunIndexes: Set<number>
): boolean {
  if (item.status !== "failed") return false;
  if (summary?.failed || summary === undefined) return !unresolvedFailedRunIndexes.has(index);
  return false;
}

function getUnresolvedFailedRunIndexes(runs: VerificationRun[]): Set<number> {
  const unresolvedRuns = new Set(getUnresolvedFailedRuns(runs));
  const indexes = new Set<number>();
  runs.forEach((run, index) => {
    if (run.status === "failed" && unresolvedRuns.has(run)) indexes.add(index);
  });
  return indexes;
}

function firstRunIndex(indexes: Set<number>): number {
  let first = -1;
  indexes.forEach((index) => {
    if (first === -1 || index < first) first = index;
  });
  return first;
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
