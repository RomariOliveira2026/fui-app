export const LEAD_SECTION_ID = "captacao";

export const LANDING_HIGHLIGHT_LEAD_EVENT = "landing:highlight-lead";

export function scrollToLeadSection() {
  const el =
    document.getElementById("lead-form") ?? document.getElementById(LEAD_SECTION_ID);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  window.setTimeout(() => {
    window.dispatchEvent(new CustomEvent(LANDING_HIGHLIGHT_LEAD_EVENT));
  }, 400);
}
