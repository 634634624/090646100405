/**
 * UUI layout + layer contract.
 *
 * Values stay UUI-native. Authors choose semantic roles; only this registry
 * owns the static Tailwind utility strings and their numeric z-order.
 */
export type LayoutRail = "full" | "wide" | "content" | "narrow" | "prose";
export type SectionSpace = "band" | "standard" | "hero";
export type BleedRole = "rail";
export type SurfaceLevel = "canvas" | "base" | "sunken" | "raised" | "overlay";
export type ZRole =
    | "base"
    | "local"
    | "sticky"
    | "dropdown"
    | "blanket"
    | "lifted"
    | "popover"
    | "modal"
    | "toast"
    | "tooltip";

export const layoutRail = {
    full: "rail-full",
    wide: "rail-wide",
    content: "rail-content",
    narrow: "rail-narrow",
    prose: "rail-prose",
} as const satisfies Record<LayoutRail, string>;

export const sectionSpace = {
    band: "section-space-band",
    standard: "section-space-standard",
    hero: "section-space-hero",
} as const satisfies Record<SectionSpace, string>;

/** Safe gutter escape; full viewport media belongs outside the constrained rail. */
export const bleedRole = {
    rail: "bleed-rail",
} as const satisfies Record<BleedRole, string>;

/** Surface owns background + boundary/elevation as one indivisible choice. */
export const surfaceLevel = {
    canvas: "surface-canvas",
    base: "surface-base",
    sunken: "surface-sunken",
    raised: "surface-raised",
    overlay: "surface-overlay",
} as const satisfies Record<SurfaceLevel, string>;

/**
 * Global z-order. Modal roots use a reserved 60..99 runtime stack range;
 * toast and tooltip remain deterministically above it.
 */
export const zRole = {
    base: "z-base",
    local: "z-local",
    sticky: "z-sticky",
    dropdown: "z-dropdown",
    blanket: "z-blanket",
    lifted: "z-lifted",
    popover: "z-popover",
    modal: "z-modal-stack",
    toast: "z-toast",
    tooltip: "z-tooltip",
} as const satisfies Record<ZRole, string>;
