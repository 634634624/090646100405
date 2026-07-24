#!/usr/bin/env node
import { execFileSync, spawn } from "node:child_process";
import { accessSync, constants, existsSync } from "node:fs";
import process from "node:process";
import { fileURLToPath } from "node:url";

export const DEFAULT_TIMEOUT_MS = 120_000;

function executable(candidate) {
    if (!candidate || !existsSync(candidate)) return false;
    try {
        accessSync(candidate, constants.X_OK);
        return true;
    } catch {
        return false;
    }
}

export function findChrome() {
    const candidates = [
        process.env.UUI_CHROME_PATH,
        process.env.CHROME_PATH,
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "/Applications/Chromium.app/Contents/MacOS/Chromium",
    ];
    for (const candidate of candidates) if (executable(candidate)) return candidate;
    for (const name of ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser", "chrome-headless-shell"]) {
        try {
            const candidate = execFileSync("which", [name], { encoding: "utf8" }).trim();
            if (executable(candidate)) return candidate;
        } catch {
            // Try the next known browser name.
        }
    }
    throw new Error("No Chrome-compatible browser found. Set UUI_CHROME_PATH.");
}

function numericOption(argv, name, fallback) {
    const index = argv.indexOf(name);
    if (index === -1) return { value: fallback, argv };
    const value = Number(argv[index + 1]);
    if (!Number.isFinite(value) || value < 1000) throw new Error(`${name} requires at least 1000 milliseconds`);
    return { value, argv: argv.filter((_, current) => current !== index && current !== index + 1) };
}

function killProcessGroup(child, signal) {
    if (!child?.pid) return;
    try {
        process.kill(process.platform === "win32" ? child.pid : -child.pid, signal);
    } catch (error) {
        if (error?.code !== "ESRCH") throw error;
    }
}

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function runHeadlessChrome(rawArgs = process.argv.slice(2)) {
    const argsWithoutSeparator = rawArgs[0] === "--" ? rawArgs.slice(1) : rawArgs;
    if (argsWithoutSeparator.includes("--help") || !argsWithoutSeparator.length) {
        console.log("usage: node run-headless-chrome.mjs [--timeout-ms N] -- [chrome arguments] <url>");
        return argsWithoutSeparator.length ? 0 : 2;
    }
    const timeout = numericOption(argsWithoutSeparator, "--timeout-ms", Number(process.env.UUI_HEADLESS_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS);
    const chromeArgs = timeout.argv.some((arg) => arg === "--headless" || arg.startsWith("--headless="))
        ? timeout.argv
        : ["--headless=new", ...timeout.argv];
    const child = spawn(findChrome(), ["--no-first-run", ...chromeArgs], {
        detached: process.platform !== "win32",
        stdio: "inherit",
    });
    let timedOut = false;
    let forceTimer;
    const timer = setTimeout(() => {
        timedOut = true;
        killProcessGroup(child, "SIGTERM");
        forceTimer = setTimeout(() => killProcessGroup(child, "SIGKILL"), 1000);
    }, timeout.value);
    const forward = (signal) => killProcessGroup(child, signal);
    process.once("SIGINT", forward);
    process.once("SIGTERM", forward);
    try {
        const result = await new Promise((resolve, reject) => {
            child.once("error", reject);
            child.once("exit", (code, signal) => resolve({ code, signal }));
        });
        if (timedOut) {
            console.error(`HEADLESS CHROME TIMEOUT · ${timeout.value}ms`);
            return 124;
        }
        if (result.signal) return 128;
        return result.code ?? 1;
    } finally {
        clearTimeout(timer);
        clearTimeout(forceTimer);
        process.removeListener("SIGINT", forward);
        process.removeListener("SIGTERM", forward);
        killProcessGroup(child, "SIGTERM");
        await sleep(150);
        killProcessGroup(child, "SIGKILL");
    }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
    process.exitCode = await runHeadlessChrome();
}
