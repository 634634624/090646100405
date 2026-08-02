/**
 * toolkit/interaction-recipes/lib/celebrations.ts — REWARD-TIER controllers.
 *
 * Building blocks: confettiBurst · flyToCart · bumpBadge. Composed buttons:
 * attachAddToCart (fly + badge bump + micro-confirm) and attachRewardButton
 * (idle→loading→success state machine + confetti + success ring — buy / book).
 *
 * SELF-CONTAINED (no cross-package import), SSR-SAFE (only enhances), REDUCED-MOTION
 * -AWARE (keeps the OUTCOME — badge count, success label — drops the movement),
 * IDEMPOTENT. Pairs with celebrations.css. Fire on a REAL success, never a loop.
 */

const prefersReducedMotion = (): boolean =>
  typeof matchMedia === "function" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches &&
  document.documentElement.getAttribute("data-motion") !== "force";

const buzz = (ms = 10): void => {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* no Vibration API */
  }
};

const CONFETTI = ["#7F77DD", "#1D9E75", "#D85A30", "#D4537E", "#EF9F27", "#639922", "#378ADD"];

/** Burst N confetti particles from an element's centre (fixed-positioned, so it
 *  escapes any overflow:hidden). No-op under reduced motion. */
export function confettiBurst(el: HTMLElement, count = 14): void {
  if (!el || prefersReducedMotion()) return;
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  for (let i = 0; i < count; i++) {
    const c = document.createElement("span");
    c.className = "ir-confetti";
    const ang = (Math.PI * 2 * i) / count + (Math.random() - 0.5);
    const dist = 46 + Math.random() * 60;
    c.style.left = `${cx}px`;
    c.style.top = `${cy}px`;
    c.style.setProperty("--ir-tx", `${(Math.cos(ang) * dist).toFixed(0)}px`);
    c.style.setProperty("--ir-ty", `${(Math.sin(ang) * dist).toFixed(0)}px`);
    c.style.setProperty("--ir-r", `${(Math.random() * 360).toFixed(0)}deg`);
    c.style.setProperty("--ir-delay", `${(Math.random() * 120).toFixed(0)}ms`);
    c.style.background = CONFETTI[i % CONFETTI.length];
    if (Math.random() > 0.5) c.style.borderRadius = "50%";
    document.body.appendChild(c);
    c.addEventListener("animationend", () => c.remove(), { once: true });
    window.setTimeout(() => c.remove(), 1200);
  }
}

/** Toss a ghost dot from `fromEl` to `toEl` (the cart). Resolves when it lands.
 *  Under reduced motion it resolves immediately (the caller still bumps the badge). */
export function flyToCart(fromEl: HTMLElement, toEl: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    if (!fromEl || !toEl || prefersReducedMotion()) return resolve();
    const a = fromEl.getBoundingClientRect();
    const b = toEl.getBoundingClientRect();
    const fromX = a.left + a.width / 2;
    const fromY = a.top + a.height / 2;
    const dx = b.left + b.width / 2 - fromX;
    const dy = b.top + b.height / 2 - fromY;
    const ghost = document.createElement("div");
    ghost.className = "ir-fly";
    ghost.style.left = `${fromX}px`;
    ghost.style.top = `${fromY}px`;
    document.body.appendChild(ghost);
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      ghost.remove();
      resolve();
    };
    // reflow so the base transform paints before we set the target
    void ghost.offsetWidth;
    requestAnimationFrame(() => {
      ghost.style.transform = `translate(-50%, -50%) translate(${dx}px, ${dy}px) scale(0.3)`;
      ghost.style.opacity = "0";
    });
    ghost.addEventListener("transitionend", finish, { once: true });
    window.setTimeout(finish, 720); // fallback if transitionend is missed
  });
}

/** Increment a cart-count badge + spring it. Restartable. RM → count updates, no pop. */
export function bumpBadge(badge: HTMLElement, delta = 1): void {
  if (!badge) return;
  const n = (parseInt(badge.textContent || "0", 10) || 0) + delta;
  badge.textContent = String(n);
  if (prefersReducedMotion()) return;
  badge.classList.remove("ir-badge--bump");
  void badge.offsetWidth;
  badge.classList.add("ir-badge--bump");
}

/* ── ADD-TO-CART — optimistic: fly a ghost to the cart, bump the count, flash the
 *    button's success face, revert. No network (adding is instant). The button
 *    reuses the .ir-submit faces (idle / success). ── */
export interface AddToCartOptions {
  cart?: HTMLElement | null;
  badge?: HTMLElement | null;
  onAdd?: (btn: HTMLButtonElement) => void;
  resetDelay?: number;
}

export function attachAddToCart(btn: HTMLButtonElement, opts: AddToCartOptions = {}): void {
  if (!btn || btn.dataset.irCartInit) return;
  btn.dataset.irCartInit = "1";
  if (!btn.dataset.irState) btn.dataset.irState = "idle";
  const resetDelay = opts.resetDelay ?? 1400;
  const cart = opts.cart ?? (btn.dataset.irCart ? document.querySelector<HTMLElement>(btn.dataset.irCart) : null);
  const badge = opts.badge ?? (btn.dataset.irBadge ? document.querySelector<HTMLElement>(btn.dataset.irBadge) : null);
  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    opts.onAdd?.(btn);
    buzz(8);
    if (cart) await flyToCart(btn, cart);
    if (badge) bumpBadge(badge, 1);
    btn.dataset.irState = "success";
    window.setTimeout(() => (btn.dataset.irState = "idle"), resetDelay);
  });
}

/* ── REWARD BUTTON (buy / book) — idle→loading→success|error state machine with a
 *    celebratory success: confetti + the success ring (.ir-reward). Fires on a REAL
 *    async result. Mock-first: the default handler simulates. ── */
export interface RewardButtonOptions {
  onAct?: (btn: HTMLButtonElement) => Promise<unknown> | unknown;
  reward?: "confetti" | "none";
  resetDelay?: number;
  stickySuccess?: boolean;
}

export function attachRewardButton(btn: HTMLButtonElement, opts: RewardButtonOptions = {}): void {
  if (!btn || btn.dataset.irRewardInit) return;
  btn.dataset.irRewardInit = "1";
  btn.classList.add("ir-reward");
  if (!btn.dataset.irState) btn.dataset.irState = "idle";
  const resetDelay = opts.resetDelay ?? 2000;
  const reward = opts.reward ?? "confetti";
  const setState = (s: "idle" | "loading" | "success" | "error") => {
    btn.dataset.irState = s;
    btn.setAttribute("aria-busy", s === "loading" ? "true" : "false");
  };
  const act =
    opts.onAct ??
    (() => new Promise((r) => window.setTimeout(r, 1100))); // mock success
  btn.addEventListener("click", async (e) => {
    if (btn.dataset.irState === "loading") return;
    e.preventDefault();
    setState("loading");
    btn.disabled = true;
    try {
      await act(btn);
      setState("success");
      if (reward === "confetti") confettiBurst(btn, 16);
      buzz(12);
    } catch {
      setState("error");
      buzz(20);
    } finally {
      btn.disabled = false;
      if (!(opts.stickySuccess && btn.dataset.irState === "success")) {
        window.setTimeout(() => setState("idle"), resetDelay);
      }
    }
  });
}

/** Declarative boot: `[data-ir-add-to-cart]` (with data-ir-cart / data-ir-badge
 *  selectors) and `[data-ir-reward]` (demo mock; data-ir-reward-result=
 *  "success|error|random"). Idempotent. */
export function bootCelebrations(root: ParentNode = document): void {
  if (typeof document === "undefined") return;
  root.querySelectorAll<HTMLButtonElement>("[data-ir-add-to-cart]:not([data-ir-cart-init])").forEach((btn) => {
    attachAddToCart(btn);
  });
  root.querySelectorAll<HTMLButtonElement>("[data-ir-reward]:not([data-ir-reward-init])").forEach((btn) => {
    const mode = btn.getAttribute("data-ir-reward-result") || "success";
    attachRewardButton(btn, {
      onAct: () =>
        new Promise((resolve, reject) =>
          window.setTimeout(() => {
            const fail = mode === "error" || (mode === "random" && Math.random() < 0.35);
            if (fail) reject(new Error("mock"));
            else resolve(null);
          }, 1100),
        ),
    });
  });
}
