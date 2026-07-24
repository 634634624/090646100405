/**
 * toolkit/interaction-recipes — the RECIPE layer: real page-moments composed from
 * the motion primitives. Sits above toolkit/microinteractions (single-element
 * feedback) and toolkit/motion P53 (scroll/stagger/parallax/page transitions).
 *
 * Import the styles once per page (after motion.css, whose spinner + tokens some
 * recipes reuse):
 *   import "@/toolkit/microinteractions/motion.css";
 *   import "@/toolkit/interaction-recipes/recipes.css";
 * Boot the declarative recipes (choreography + field labels + [data-ir-tabs]):
 *   import { bootRecipes } from "@/toolkit/interaction-recipes";
 *   bootRecipes();
 * Wire the imperative ones where you use them:
 *   import { attachSubmitButton, toast } from "@/toolkit/interaction-recipes";
 *
 * REWARD TIER (playful conversion-peak moments — add-to-cart, buy, book): import
 *   "@/toolkit/interaction-recipes/celebrations.css" too, then bootCelebrations()
 *   or attachAddToCart / attachRewardButton / confettiBurst / flyToCart / bumpBadge.
 *
 * Every recipe obeys toolkit/microinteractions/RULES.md and the decision framework
 * in toolkit/MOTION-FRAMEWORK.md. Live showcase: src/pages/demos/interaction-recipes
 * (state machines) + src/pages/demos/reward-buttons (the reward tier).
 */
export * from "./lib/recipes";
export * from "./lib/celebrations";
export * from "./lib/premium";
export * from "./lib/showcase";
export * from "./lib/storytelling";
