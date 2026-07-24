/**
 * toolkit/interaction-recipes/lib/premium.ts — the ~15-line JS for the two premium
 * button effects CSS can't do: magnetic pull + pointer tilt. Everything else in
 * premium-buttons.css is pure CSS. SSR-safe, reduced-motion-aware (no-op), idempotent.
 */

const prefersReducedMotion = (): boolean =>
  typeof matchMedia === "function" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches &&
  document.documentElement.getAttribute("data-motion") !== "force";

const clamp = (v: number, m: number): number => Math.max(-m, Math.min(m, v));

/** Magnetic pull — the element drifts toward the cursor, springs back on leave. */
export function attachMagnetic(el: HTMLElement, opts: { strength?: number; max?: number } = {}): void {
  if (!el || el.dataset.pbMagInit) return;
  el.dataset.pbMagInit = "1";
  const strength = opts.strength ?? 0.3;
  const max = opts.max ?? 10;
  el.addEventListener("pointermove", (e) => {
    if (prefersReducedMotion()) return;
    const r = el.getBoundingClientRect();
    const mx = clamp((e.clientX - (r.left + r.width / 2)) * strength, max);
    const my = clamp((e.clientY - (r.top + r.height / 2)) * strength, max);
    el.style.setProperty("--pb-mx", `${mx.toFixed(1)}px`);
    el.style.setProperty("--pb-my", `${my.toFixed(1)}px`);
  });
  el.addEventListener("pointerleave", () => {
    el.style.setProperty("--pb-mx", "0px");
    el.style.setProperty("--pb-my", "0px");
  });
}

/** Pointer tilt — the element rotates in 3D toward the cursor, resets on leave. */
export function attachTilt(el: HTMLElement, opts: { max?: number } = {}): void {
  if (!el || el.dataset.pbTiltInit) return;
  el.dataset.pbTiltInit = "1";
  const max = opts.max ?? 10;
  el.addEventListener("pointermove", (e) => {
    if (prefersReducedMotion()) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--pb-ry", `${(px * max).toFixed(1)}deg`);
    el.style.setProperty("--pb-rx", `${(-py * max).toFixed(1)}deg`);
  });
  el.addEventListener("pointerleave", () => {
    el.style.setProperty("--pb-rx", "0deg");
    el.style.setProperty("--pb-ry", "0deg");
  });
}

/** Rolling-digit number ticker (Revolut style). Builds digit columns and rolls each
 *  to its target with a per-column stagger. Reduced motion → set the final instantly. */
export function attachOdometer(el: HTMLElement, opts: { to?: number } = {}): void {
  if (!el || el.dataset.pbOdoInit) return;
  el.dataset.pbOdoInit = "1";
  const to = opts.to ?? (parseInt((el.dataset.pbTo || el.textContent || "0").replace(/\D/g, ""), 10) || 0);
  const str = to.toLocaleString("hu-HU");
  el.textContent = "";
  el.classList.add("pb-odometer");
  const rm = prefersReducedMotion();
  let col = 0;
  for (const ch of str) {
    if (/\d/.test(ch)) {
      const c = col;
      col++;
      const target = Number(ch);
      const column = document.createElement("span");
      column.className = "pb-odo-col";
      const strip = document.createElement("span");
      strip.className = "pb-odo-strip";
      for (let d = 0; d <= 9; d++) {
        const digit = document.createElement("span");
        digit.className = "pb-odo-d";
        digit.textContent = String(d);
        strip.appendChild(digit);
      }
      column.appendChild(strip);
      el.appendChild(column);
      if (rm) {
        strip.style.transform = `translateY(-${target}em)`;
      } else {
        requestAnimationFrame(() => {
          strip.style.transition = `transform ${900 + c * 80}ms cubic-bezier(0.2, 0.8, 0.2, 1) ${c * 90}ms`;
          strip.style.transform = `translateY(-${target}em)`;
        });
      }
    } else {
      const sep = document.createElement("span");
      sep.textContent = ch;
      el.appendChild(sep);
    }
  }
}

/** Text-scramble reveal: letters flicker through random glyphs, then settle to the
 *  target. Trigger on hover/focus. Reduced motion → no scramble (target stays). */
export function attachScramble(el: HTMLElement): void {
  if (!el || el.dataset.pbScrInit) return;
  el.dataset.pbScrInit = "1";
  const target = (el.dataset.pbText || el.textContent || "").trim();
  el.dataset.pbText = target;
  const glyphs = "!<>-_\\/[]{}=+*^?#";
  let raf = 0;
  const run = () => {
    if (prefersReducedMotion()) return;
    cancelAnimationFrame(raf);
    let frame = 0;
    const total = target.length * 2 + 12;
    const step = () => {
      let out = "";
      for (let i = 0; i < target.length; i++) {
        if (target[i] === " ") out += " ";
        else if (frame >= i * 2 + 6) out += target[i];
        else out += glyphs[Math.floor(Math.random() * glyphs.length)];
      }
      el.textContent = out;
      frame++;
      if (frame <= total) raf = requestAnimationFrame(step);
      else el.textContent = target;
    };
    step();
  };
  el.addEventListener("pointerenter", run);
  el.addEventListener("focus", run);
}

/** Boot the declarative premium effects: magnetic · tilt · odometer (on scroll-in) · scramble. */
export function bootPremium(root: ParentNode = document): void {
  if (typeof document === "undefined") return;
  root.querySelectorAll<HTMLElement>("[data-pb-magnetic]:not([data-pb-mag-init])").forEach((el) => attachMagnetic(el));
  root.querySelectorAll<HTMLElement>("[data-pb-tilt]:not([data-pb-tilt-init])").forEach((el) => attachTilt(el));
  root.querySelectorAll<HTMLElement>("[data-pb-scramble]:not([data-pb-scr-init])").forEach((el) => attachScramble(el));
  root.querySelectorAll<HTMLElement>("[data-pb-odometer]:not([data-pb-odo-wired])").forEach((el) => {
    el.dataset.pbOdoWired = "1";
    if (typeof IntersectionObserver === "function") {
      const io = new IntersectionObserver((entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            attachOdometer(e.target as HTMLElement);
            io.unobserve(e.target);
          }
      });
      io.observe(el);
    } else {
      attachOdometer(el);
    }
  });
}
