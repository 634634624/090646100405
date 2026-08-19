declare module "cloudflare:workers" {
    export const env: Env;

    export abstract class DurableObject<RuntimeEnv = Env> {
        protected ctx: DurableObjectState;
        protected env: RuntimeEnv;
        constructor(ctx: DurableObjectState, env: RuntimeEnv);
    }
}

interface DurableObjectStorage {
    get<T>(key: string): Promise<T | undefined>;
    put<T>(key: string, value: T): Promise<void>;
}

interface DurableObjectState {
    storage: DurableObjectStorage;
}

interface ExecutionContext {
    waitUntil(promise: Promise<unknown>): void;
    passThroughOnException(): void;
}

interface ExportedHandler<RuntimeEnv = Env> {
    fetch?: (request: Request, env: RuntimeEnv, ctx: ExecutionContext) => Response | Promise<Response>;
}

type CommerceCoordinatorStub = {
    allow(scope: string, limit: number, periodMs: number): Promise<boolean>;
    claim(webhookId: string): Promise<{
        acquired: boolean;
        state: "creating" | "complete";
        wspyId?: string;
    }>;
    complete(webhookId: string, wspyId: string): Promise<void>;
};

type CommerceCoordinatorNamespace = {
    getByName(name: string): CommerceCoordinatorStub;
};

interface Env {
    ASSETS: unknown;
    SHOPIFY_WEBHOOK_SECRET?: string;
    WEBSHIPPY_API_KEY?: string;
    WEBSHIPPY_WRITE_MODE?: string;
    COMMERCE_COORDINATOR: CommerceCoordinatorNamespace;
}
