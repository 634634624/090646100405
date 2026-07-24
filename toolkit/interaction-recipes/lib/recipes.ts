/**
 * toolkit/interaction-recipes/lib/recipes.ts — controllers for the composed
 * interaction recipes in recipes.css.
 *
 * SELF-CONTAINED (no cross-package import — the recipes package stands alone and
 * never edits toolkit/microinteractions), SSR-SAFE (server markup is the real
 * final state; JS only ENHANCES), REDUCED-MOTION-AWARE (state stays truthful; the
 * CSS drops the movement), IDEMPOTENT (safe to re-run on astro:page-load).
 *
 * Grounded in the same rules as motion.css (RULES.md) + the research in
 * toolkit/MOTION-FRAMEWORK.md (NN/g 100–400ms, enter>exit, Saffer trigger→feedback,
 * optimistic/loading→success morph, prefers-reduced-motion replace-don't-strip).
 */

const prefersReducedMotion = (): boolean =>
  typeof matchMedia === "function" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches &&
  document.documentElement.getAttribute("data-motion") !== "force";

const buzz = (ms = 10): void => {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* no Vibration API → visual feedback only */
  }
};

/* ── 1 · SUBMIT BUTTON STATE MACHINE ──────────────────────────────────────────
 * Trigger → Rules → Feedback (Saffer). Click → loading (aria-busy + disabled,
 * blocks double-submit) → the handler's promise resolves → success | rejects →
 * error, then auto-reverts to idle. Width never changes (faces are grid-stacked
 * in recipes.css). Landing state is always truthful under reduced motion / no-JS. */
export interface SubmitOptions {
  /** ms the success/error face holds before reverting to idle (default 1400). */
  resetDelay?: number;
  /** keep the button in success (don't revert) — e.g. real navigation follows. */
  stickySuccess?: boolean;
}

type SubmitHandler = (btn: HTMLButtonElement) => Promise<unknown> | unknown;

export function attachSubmitButton(
  btn: HTMLButtonElement,
  handler: SubmitHandler,
  opts: SubmitOptions = {},
): void {
  if (!btn || btn.dataset.irSubmitInit) return;
  btn.dataset.irSubmitInit = "1";
  if (!btn.dataset.irState) btn.dataset.irState = "idle";
  const resetDelay = opts.resetDelay ?? 1400;
  const setState = (s: "idle" | "loading" | "success" | "error") => {
    btn.dataset.irState = s;
    btn.setAttribute("aria-busy", s === "loading" ? "true" : "false");
  };
  btn.addEventListener("click", async (e) => {
    if (btn.dataset.irState === "loading" || btn.disabled) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    setState("loading");
    btn.disabled = true;
    try {
      await handler(btn);
      setState("success");
      buzz(10);
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

/** Progressive-enhancement wrapper for a REAL <form> submit (fires on Enter-in-field
 *  AND the button — a plain click handler misses Enter). Finds the form's `.ir-submit`
 *  button, intercepts submit, runs the state machine, and by default POSTs the form to
 *  its `action` as JSON (Web3Forms-shaped). Without JS the native POST still works — the
 *  SSR markup is the real, complete form. Mock-first: a form with no `action` (preview
 *  mode) resolves as success after a short beat, never a broken fetch. */
export interface SubmitFormOptions extends SubmitOptions {
  /** Override the network step; resolve = success, throw = error. */
  onSubmit?: (form: HTMLFormElement) => Promise<unknown> | unknown;
  /** Reset the fields on success (default true). */
  resetOnSuccess?: boolean;
}

export function attachSubmitForm(form: HTMLFormElement, opts: SubmitFormOptions = {}): void {
  if (!form || form.dataset.irSubmitFormInit) return;
  form.dataset.irSubmitFormInit = "1";
  const btn = form.querySelector<HTMLButtonElement>(".ir-submit");
  if (!btn) return;
  if (!btn.dataset.irState) btn.dataset.irState = "idle";
  const resetDelay = opts.resetDelay ?? 2400;
  const setState = (s: "idle" | "loading" | "success" | "error") => {
    btn.dataset.irState = s;
    btn.setAttribute("aria-busy", s === "loading" ? "true" : "false");
  };
  const send =
    opts.onSubmit ??
    (async (f: HTMLFormElement) => {
      const action = f.getAttribute("action");
      if (!action || action === "#") {
        // preview / no endpoint → simulate success (mock-first, never a broken fetch)
        await new Promise((r) => window.setTimeout(r, 900));
        return;
      }
      const res = await fetch(action, {
        method: (f.getAttribute("method") || "POST").toUpperCase(),
        body: new FormData(f),
        headers: { Accept: "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || (data as { success?: boolean })?.success === false) throw new Error("submit failed");
    });

  form.addEventListener("submit", async (e) => {
    if (btn.dataset.irState === "loading") {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    setState("loading");
    btn.disabled = true;
    try {
      await send(form);
      setState("success");
      buzz(10);
      if (opts.resetOnSuccess !== false) form.reset();
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

/* ── 2 · SLIDING TAB / SEGMENTED INDICATOR ────────────────────────────────────
 * The indicator is ONE element that translates+resizes to the active tab (shared
 * axis). Measure with offsetLeft/Width (cheap, layout-read once per change), write
 * transform via CSS vars → the transition in recipes.css does the move. */
export function attachTabIndicator(root: HTMLElement): (() => void) | void {
  if (!root || root.dataset.irTabsInit) return;
  root.dataset.irTabsInit = "1";
  const indicator = root.querySelector<HTMLElement>(".ir-tabs__indicator");
  const tabs = [...root.querySelectorAll<HTMLElement>(".ir-tabs__tab")];
  if (!indicator || !tabs.length) return;
  indicator.setAttribute("aria-hidden", "true");

  const activeTab = (): HTMLElement =>
    tabs.find((t) => t.getAttribute("aria-selected") === "true" || t.classList.contains("is-active")) || tabs[0];

  const move = (to: HTMLElement) => {
    indicator.style.setProperty("--ir-w", `${to.offsetWidth}px`);
    indicator.style.setProperty("--ir-x", `${to.offsetLeft - (root.clientLeft || 0)}px`);
  };
  const isTablist = root.getAttribute("role") === "tablist";
  const select = (to: HTMLElement) => {
    tabs.forEach((t) => {
      const on = t === to;
      t.classList.toggle("is-active", on);
      if (t.hasAttribute("aria-selected")) t.setAttribute("aria-selected", on ? "true" : "false");
      if (isTablist) t.tabIndex = on ? 0 : -1; // roving tabindex (WCAG APG tabs pattern)
    });
    move(to);
  };

  tabs.forEach((t) => t.addEventListener("click", () => select(t)));

  // Keyboard: a role="tablist" contract requires arrow/Home/End nav + roving tabindex.
  // (A plain segmented control without role="tablist" keeps normal Tab-through behaviour.)
  if (isTablist) {
    tabs.forEach((t) => (t.tabIndex = t === activeTab() ? 0 : -1)); // seed roving
    root.addEventListener("keydown", (e) => {
      const i = tabs.indexOf(document.activeElement as HTMLElement);
      if (i < 0) return;
      let j = -1;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") j = (i + 1) % tabs.length;
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") j = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === "Home") j = 0;
      else if (e.key === "End") j = tabs.length - 1;
      if (j < 0) return;
      e.preventDefault();
      select(tabs[j]);
      tabs[j].focus();
    });
  }
  // initial placement after layout settles (fonts/reflow) — no transition on first paint
  const prevTransition = indicator.style.transition;
  indicator.style.transition = "none";
  requestAnimationFrame(() => {
    move(activeTab());
    requestAnimationFrame(() => (indicator.style.transition = prevTransition));
  });

  const ro = typeof ResizeObserver === "function" ? new ResizeObserver(() => move(activeTab())) : null;
  ro?.observe(root);
  return () => ro?.disconnect();
}

/* ── 3 · TOAST STACK ──────────────────────────────────────────────────────────
 * aria-live polite log. Enter overshoots (spring, recipes.css); exit is a shorter
 * clean fade (enter>exit — NN/g). Auto-dismiss pauses while hovered/focused. */
export interface ToastOptions {
  type?: "info" | "success" | "error";
  /** ms before auto-dismiss (default 4000). 0 = sticky (manual close only). */
  duration?: number;
}

const TOAST_ICON: Record<string, string> = {
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" class="size-5"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5h.01"/></svg>',
  success:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true" class="size-5"><path d="m5 13 4 4L19 7"/></svg>',
  error:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" class="size-5"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>',
};

function toastRegion(): HTMLElement {
  let region = document.querySelector<HTMLElement>(".ir-toast-region");
  if (!region) {
    region = document.createElement("div");
    region.className = "ir-toast-region";
    region.setAttribute("role", "status");
    region.setAttribute("aria-live", "polite");
    document.body.appendChild(region);
  }
  return region;
}

export function toast(message: string, opts: ToastOptions = {}): () => void {
  const region = toastRegion();
  const type = opts.type ?? "info";
  const duration = opts.duration ?? 4000;
  const node = document.createElement("div");
  node.className = "ir-toast";
  node.dataset.irType = type;
  // Build via DOM APIs — no untrusted interpolation. innerHTML receives ONLY a
  // constant SVG from the fixed TOAST_ICON map (keyed by a normalized type);
  // the caller's `message` goes through textContent.
  const icon = document.createElement("span");
  icon.className = "ir-toast__icon";
  icon.dataset.irType = type;
  icon.innerHTML = TOAST_ICON[type] || TOAST_ICON.info;
  const msg = document.createElement("span");
  msg.className = "ir-toast__msg";
  msg.textContent = message;
  const close = document.createElement("button");
  close.type = "button";
  close.className = "ir-toast__close";
  close.setAttribute("aria-label", "Bezárás");
  close.textContent = "×"; // ×
  node.append(icon, msg, close);
  region.appendChild(node);

  let timer = 0;
  const dismiss = () => {
    window.clearTimeout(timer);
    if (node.dataset.irLeaving) return;
    node.dataset.irLeaving = "1";
    if (prefersReducedMotion()) {
      node.remove();
    } else {
      node.addEventListener("animationend", () => node.remove(), { once: true });
      window.setTimeout(() => node.remove(), 400); // fallback if animationend missed
    }
  };
  const arm = () => {
    if (duration > 0) timer = window.setTimeout(dismiss, duration);
  };
  node.querySelector<HTMLElement>(".ir-toast__close")!.addEventListener("click", dismiss);
  node.addEventListener("pointerenter", () => window.clearTimeout(timer));
  node.addEventListener("pointerleave", arm);
  node.addEventListener("focusin", () => window.clearTimeout(timer));
  node.addEventListener("focusout", arm);
  arm();
  return dismiss;
}

/* ── 4 · HERO CHOREOGRAPHY ────────────────────────────────────────────────────
 * Adds data-ir-play when the group enters view → the staggered children in
 * recipes.css cascade in. SSR-safe: start state only under .js-motion; no-JS =
 * final. Under reduced motion the opacity fade stays (movement is dropped by CSS). */
export function initChoreo(root: ParentNode = document): void {
  const groups = [...root.querySelectorAll<HTMLElement>(".ir-choreo:not([data-ir-play])")];
  if (!groups.length) return;
  if (typeof IntersectionObserver !== "function") {
    groups.forEach((g) => g.setAttribute("data-ir-play", ""));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (en.isIntersecting) {
          en.target.setAttribute("data-ir-play", "");
          io.unobserve(en.target);
        }
      }
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.15 },
  );
  groups.forEach((g) => io.observe(g));
}

/* ── 5 · FLOATING FIELD LABEL ─────────────────────────────────────────────────
 * Pure CSS (:placeholder-shown) — this only guarantees the empty placeholder the
 * selector needs, so authors don't have to remember `placeholder=" "`. */
export function initFieldLabels(root: ParentNode = document): void {
  root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(".ir-field > input, .ir-field > textarea").forEach(
    (el) => {
      if (!el.getAttribute("placeholder")) el.setAttribute("placeholder", " ");
    },
  );
}

/* ── 6 · DRAG-TO-REORDER (FLIP) ────────────────────────────────────────────────
 * The one primitive that implements First-Last-Invert-Play. Pointer drag lifts an
 * item and follows the finger 1:1; on release every item GLIDES to its new slot via
 * a transform tween — no layout reflow (§6), no mid-drag DOM churn. Keyboard:
 * ArrowUp/Down moves the focused item, announced through an aria-live region.
 * RM-safe (§3): the 1:1 drag stays (it IS the feature), the FLIP glide + drop settle
 * are instant. Idempotent. Contract: list has children `.ir-reorder__item`, each with
 * a `.ir-reorder__handle` (or pass opts.handle). */
export interface ReorderOptions {
  /** Selector for the drag handle inside an item; defaults to `.ir-reorder__handle`. */
  handle?: string;
  /** Called after any successful reorder with the item elements in new order. */
  onReorder?: (order: HTMLElement[]) => void;
}

export function attachReorder(list: HTMLElement, opts: ReorderOptions = {}): void {
  if (!list || list.dataset.irReorderInit) return;
  list.dataset.irReorderInit = "1";
  const handleSel = opts.handle ?? ".ir-reorder__handle";
  const items = (): HTMLElement[] => [...list.querySelectorAll<HTMLElement>(":scope > .ir-reorder__item")];

  // aria-live region for keyboard-move announcements (excluded from items() by class).
  const live = document.createElement("div");
  live.className = "sr-only";
  live.setAttribute("aria-live", "polite");
  if (list.parentNode) list.after(live); // sibling, not a child — keeps <ul>/<ol> markup valid
  else list.appendChild(live);
  const announce = (el: HTMLElement) => {
    const all = items();
    live.textContent = `${el.getAttribute("aria-label") || "Elem"}: ${all.indexOf(el) + 1} / ${all.length}`;
  };

  // FLIP: capture First tops, run mutate(), then Invert+Play every moved item.
  const flip = (mutate: () => void) => {
    const before = new Map(items().map((el) => [el, el.getBoundingClientRect().top]));
    mutate();
    if (prefersReducedMotion()) return; // §3: settle instant under reduced motion
    const moved: HTMLElement[] = [];
    for (const el of items()) {
      const d = (before.get(el) ?? el.getBoundingClientRect().top) - el.getBoundingClientRect().top;
      if (!d) continue;
      el.dataset.irFlip = "1"; // transition:none for the Invert frame
      el.style.transform = `translateY(${d}px)`;
      moved.push(el);
    }
    requestAnimationFrame(() => {
      for (const el of moved) {
        delete el.dataset.irFlip; // Play — transition re-enabled, transform → 0 animates
        el.style.transform = "";
      }
    });
  };

  items().forEach((el) => {
    if (!el.hasAttribute("tabindex")) el.tabIndex = 0; // focusable for keyboard reorder
  });

  const moveBy = (el: HTMLElement, dir: -1 | 1) => {
    const els = items();
    const j = els.indexOf(el) + dir;
    if (j < 0 || j >= els.length) return;
    flip(() => {
      if (dir < 0) list.insertBefore(el, els[j]);
      else list.insertBefore(el, els[j].nextSibling);
    });
    el.focus();
    announce(el);
    opts.onReorder?.(items());
  };

  list.addEventListener("keydown", (e) => {
    const el = (e.target as HTMLElement)?.closest<HTMLElement>(".ir-reorder__item");
    if (!el || !list.contains(el)) return;
    if (e.key === "ArrowUp") {
      e.preventDefault();
      moveBy(el, -1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      moveBy(el, 1);
    }
  });

  // Pointer drag: lift + follow, reorder ONCE on drop (no mid-drag DOM churn → no rebasing).
  let dragging: HTMLElement | null = null;
  let pointerStart = 0;
  list.addEventListener("pointerdown", (e) => {
    const target = e.target as HTMLElement;
    if (!target.closest(handleSel)) return;
    const el = target.closest<HTMLElement>(".ir-reorder__item");
    if (!el || !list.contains(el)) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    dragging = el;
    pointerStart = e.clientY;
    el.dataset.irDragging = "1";
    el.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  });
  list.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    dragging.style.transform = `translateY(${e.clientY - pointerStart}px)`;
  });
  const drop = () => {
    if (!dragging) return;
    const el = dragging;
    dragging = null;
    // where did its centre land, relative to the OTHER items' current slots?
    const rect = el.getBoundingClientRect();
    const centre = rect.top + rect.height / 2;
    const target =
      items()
        .filter((x) => x !== el)
        .find((x) => {
          const r = x.getBoundingClientRect();
          return centre < r.top + r.height / 2;
        }) ?? null;
    flip(() => {
      el.style.transform = "";
      delete el.dataset.irDragging;
      list.insertBefore(el, target); // target === null → append at end
    });
    announce(el);
    opts.onReorder?.(items());
  };
  list.addEventListener("pointerup", drop);
  list.addEventListener("pointercancel", drop);
}

/** Boot the declarative recipes (choreo + field labels + any [data-ir-tabs] / [data-ir-reorder]).
 *  Submit buttons + toasts are wired explicitly by page code (they need a handler
 *  / a trigger). Idempotent; flips on .js-motion for the SSR-safe choreo start. */
export function bootRecipes(root: ParentNode = document): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.add("js-motion");
  initChoreo(root);
  initFieldLabels(root);
  (root as ParentNode).querySelectorAll<HTMLElement>("[data-ir-tabs]:not([data-ir-tabs-init])").forEach((el) => {
    attachTabIndicator(el);
  });
  (root as ParentNode).querySelectorAll<HTMLElement>("[data-ir-reorder]:not([data-ir-reorder-init])").forEach((el) => {
    attachReorder(el);
  });
  (root as ParentNode)
    .querySelectorAll<HTMLFormElement>("[data-ir-submit-form]:not([data-ir-submit-form-init])")
    .forEach((el) => {
      attachSubmitForm(el);
    });
}
