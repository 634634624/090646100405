import { handle } from "@astrojs/cloudflare/handler";
import { DurableObject } from "cloudflare:workers";

type RateWindow = {
    count: number;
    resetAt: number;
};

type OrderClaim = {
    state: "creating" | "complete";
    webhookId: string;
    wspyId?: string;
    updatedAt: number;
};

const STALE_ORDER_CLAIM_MS = 5 * 60_000;

export class CommerceCoordinator extends DurableObject<Env> {
    async allow(scope: string, limit: number, periodMs: number) {
        if (!/^[a-z][a-z0-9-]{0,31}$/.test(scope)) return false;
        if (!Number.isInteger(limit) || limit < 1 || limit > 1_000) return false;
        if (!Number.isInteger(periodMs) || periodMs < 1_000 || periodMs > 3_600_000) return false;

        const key = `rate:${scope}`;
        const now = Date.now();
        const current = await this.ctx.storage.get<RateWindow>(key);
        if (!current || current.resetAt <= now) {
            await this.ctx.storage.put(key, { count: 1, resetAt: now + periodMs });
            return true;
        }
        if (current.count >= limit) return false;
        await this.ctx.storage.put(key, { ...current, count: current.count + 1 });
        return true;
    }

    async claim(webhookId: string) {
        const current = await this.ctx.storage.get<OrderClaim>("order");
        const now = Date.now();
        if (current && (current.state === "complete" || now - current.updatedAt < STALE_ORDER_CLAIM_MS)) {
            return {
                acquired: false,
                state: current.state,
                wspyId: current.wspyId,
            } as const;
        }
        await this.ctx.storage.put<OrderClaim>("order", {
            state: "creating",
            webhookId,
            updatedAt: now,
        });
        return { acquired: true, state: "creating" } as const;
    }

    async complete(webhookId: string, wspyId: string) {
        await this.ctx.storage.put<OrderClaim>("order", {
            state: "complete",
            webhookId,
            wspyId,
            updatedAt: Date.now(),
        });
    }
}

export default {
    fetch: handle,
} satisfies ExportedHandler<Env>;
