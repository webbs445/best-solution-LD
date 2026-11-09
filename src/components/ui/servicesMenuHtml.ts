import { SITE_MENU } from "@/content/services";
import { SERVICE_ICON_PATHS } from "@/components/services/ServiceIcon";

/*
  The same Services dropdown (components/ui/ServicesMenu) as static HTML, for the pages whose header is static markup
  (/corporate-tax, /cost-calculator). wireServicesMenu() adds the same open / close behaviour.
*/
export function servicesMenuHtml(id: string, align: "start" | "end" = "end"): string {
  const items = SITE_MENU.map(
    (s) =>
      `<a class="svm-item" href="${s.href}"><span class="svm-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${SERVICE_ICON_PATHS[s.id === "hub" ? "setup" : s.id]}"/></svg></span><span><b>${s.label}</b><small>${s.line}</small></span></a>`,
  ).join("");
  return `<div class="svm"><button type="button" class="svm-btn" aria-expanded="false" aria-controls="${id}">Services<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button><div class="svm-panel${align === "end" ? " svm-end" : ""}" id="${id}" hidden>${items}</div></div>`;
}

/** Open / close for the static dropdowns: the button toggles; Escape or a click outside closes. */
export function wireServicesMenu(root: ParentNode, signal: AbortSignal) {
  root.querySelectorAll<HTMLElement>(".svm").forEach((menu) => {
    const btn = menu.querySelector<HTMLButtonElement>(".svm-btn");
    const panel = menu.querySelector<HTMLElement>(".svm-panel");
    if (!btn || !panel) return;
    const set = (open: boolean) => {
      btn.setAttribute("aria-expanded", String(open));
      panel.hidden = !open;
    };
    btn.addEventListener("click", () => set(Boolean(panel.hidden)), { signal });
    document.addEventListener("keydown", (e) => e.key === "Escape" && set(false), { signal });
    document.addEventListener("pointerdown", (e) => !menu.contains(e.target as Node) && set(false), { signal });
  });
}
