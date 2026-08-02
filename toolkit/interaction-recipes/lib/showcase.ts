/**
 * toolkit/interaction-recipes/lib/showcase.ts — controllers for the MOMENT layer
 * (showcase.css). Play a big reward moment on a real success, or auto-play on
 * scroll-in for a demo. SSR-safe, reduced-motion-aware (final state, no movement),
 * idempotent.
 */

const prefersReducedMotion = (): boolean =>
  typeof matchMedia === "function" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches &&
  document.documentElement.getAttribute("data-motion") !== "force";

function countUp(el: HTMLElement): void {
  const to = Number(el.dataset.rwTo || "0");
  const money = el.dataset.rwMoney === "1";
  const fmt = (v: number) => (money ? `${Math.round(v).toLocaleString("hu-HU")} Ft` : String(Math.round(v)));
  if (prefersReducedMotion()) {
    el.textContent = fmt(to);
    return;
  }
  const dur = 1300;
  let t0 = 0;
  const step = (t: number) => {
    if (!t0) t0 = t;
    const p = Math.min(1, (t - t0) / dur);
    el.textContent = fmt(to * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = fmt(to);
  };
  requestAnimationFrame(step);
}

/** (Re)play the moment in a `.rw-stage`: restart the CSS animations + the count-up. */
export function playMoment(stage: HTMLElement): void {
  if (!stage) return;
  stage.classList.remove("playing");
  void stage.offsetWidth; // reflow → restart
  stage.classList.add("playing");
  stage.querySelectorAll<HTMLElement>("[data-rw-count]").forEach((num) => {
    num.textContent = num.dataset.rwMoney === "1" ? "0 Ft" : "0";
    const delay = Number(num.dataset.rwDelay || "800");
    if (prefersReducedMotion()) countUp(num);
    else window.setTimeout(() => countUp(num), delay);
  });
}

/** Boot: each `.rw-stage` plays once when scrolled into view; `[data-rw-replay="#id"]`
 *  buttons replay their target stage. Idempotent. */
export function bootShowcase(root: ParentNode = document): void {
  if (typeof document === "undefined") return;
  const stages = [...root.querySelectorAll<HTMLElement>(".rw-stage:not([data-rw-init])")];
  stages.forEach((s) => (s.dataset.rwInit = "1"));
  if (typeof IntersectionObserver === "function") {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            playMoment(e.target as HTMLElement);
            io.unobserve(e.target);
          }
      },
      { threshold: 0.4 },
    );
    stages.forEach((s) => io.observe(s));
  } else {
    stages.forEach((s) => playMoment(s));
  }
  root.querySelectorAll<HTMLElement>("[data-rw-replay]:not([data-rw-replay-init])").forEach((btn) => {
    btn.dataset.rwReplayInit = "1";
    btn.addEventListener("click", () => {
      const sel = btn.getAttribute("data-rw-replay");
      const stage = sel ? document.querySelector<HTMLElement>(sel) : null;
      if (stage) playMoment(stage);
    });
  });
}
