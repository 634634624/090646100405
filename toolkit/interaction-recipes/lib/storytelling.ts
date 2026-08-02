/**
 * toolkit/interaction-recipes/lib/storytelling.ts — controllers for the SEMANTIC
 * reward buttons (storytelling-buttons.css). Each button plays a long multi-stage
 * story on click: idle → busy (the action, animated) → done (the reward) → idle.
 * `like` is a toggle. SSR-safe, reduced-motion-aware (the CSS collapses to the
 * end-state), idempotent. Mock-first: the default onAct simulates.
 */

const buzz = (ms = 10): void => {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* no Vibration API */
  }
};

/** Per-type stage durations (ms) — matched to the CSS sequences. */
const DUR: Record<string, { busy: number; done: number }> = {
  pay: { busy: 1450, done: 1700 },
  cart: { busy: 1150, done: 1500 },
  send: { busy: 1150, done: 1500 },
};

export interface StoryButtonOptions {
  /** Override the async action; resolve → the reward plays, reject → back to idle. */
  onAct?: (btn: HTMLButtonElement) => Promise<unknown> | unknown;
}

export function attachStoryButton(btn: HTMLButtonElement, opts: StoryButtonOptions = {}): void {
  if (!btn || btn.dataset.sbInit) return;
  btn.dataset.sbInit = "1";
  const type = btn.dataset.sbType || "pay";
  if (!btn.dataset.sbState) btn.dataset.sbState = "idle";

  // LIKE is a toggle, not a sequence.
  if (type === "like") {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const liked = btn.dataset.sbState === "liked";
      btn.dataset.sbState = liked ? "idle" : "liked";
      btn.setAttribute("aria-pressed", liked ? "false" : "true");
      if (!liked) buzz(12);
    });
    return;
  }

  const t = DUR[type] || DUR.pay;
  const act = opts.onAct ?? (() => new Promise((r) => window.setTimeout(r, 900))); // mock success
  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    if (btn.dataset.sbState !== "idle") return;
    btn.dataset.sbState = "busy";
    btn.setAttribute("aria-busy", "true");
    btn.disabled = true;
    // busy lasts at least the animated stage, even if the action is faster
    const minBusy = new Promise((r) => window.setTimeout(r, t.busy));
    try {
      await Promise.all([minBusy, Promise.resolve(act(btn))]);
      btn.dataset.sbState = "done";
      buzz(14);
    } catch {
      btn.dataset.sbState = "idle";
      btn.setAttribute("aria-busy", "false");
      btn.disabled = false;
      return;
    }
    btn.setAttribute("aria-busy", "false");
    window.setTimeout(() => {
      btn.dataset.sbState = "idle";
      btn.disabled = false;
    }, t.done);
  });
}

/** Boot the declarative storytelling buttons: every `[data-sb]` (mock action). */
export function bootStory(root: ParentNode = document): void {
  if (typeof document === "undefined") return;
  root.querySelectorAll<HTMLButtonElement>("[data-sb]:not([data-sb-init])").forEach((btn) => attachStoryButton(btn));
}
