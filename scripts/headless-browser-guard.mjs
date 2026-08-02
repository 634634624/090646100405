#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import process from "node:process";
import { fileURLToPath } from "node:url";

export const DEFAULT_STALE_AGE_SECONDS = 15 * 60;

export function elapsedToSeconds(value) {
    const match = String(value).trim().match(/^(?:(\d+)-)?(?:(\d+):)?(\d+):(\d+)$/);
    if (!match) return null;
    const [, days = "0", hours = "0", minutes, seconds] = match;
    return Number(days) * 86400 + Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
}

export function parseProcessList(source) {
    return String(source)
        .split("\n")
        .map((line) => line.match(/^\s*(\d+)\s+(\d+)\s+(\S+)\s+(.+)$/))
        .filter(Boolean)
        .map((match) => ({
            pid: Number(match[1]),
            ppid: Number(match[2]),
            elapsed: match[3],
            elapsedSeconds: elapsedToSeconds(match[3]),
            command: match[4],
        }))
        .filter((entry) => Number.isInteger(entry.elapsedSeconds));
}

export function isHeadlessBrowserRoot(command) {
    const value = String(command);
    if (!/(?:^|\s)--headless(?:=|\s|$)/.test(value) || /(?:^|\s)--type=/.test(value)) return false;
    return (
        value.includes("/Google Chrome.app/Contents/MacOS/Google Chrome ") ||
        /(?:^|\s)(?:\S*\/)?(?:google-chrome(?:-stable)?|chromium(?:-browser)?|chrome-headless-shell|headless_shell)(?:\s|$)/i.test(value)
    );
}

export function findStaleHeadless(processes, { maxAgeSeconds = DEFAULT_STALE_AGE_SECONDS } = {}) {
    return processes
        .filter((entry) =>
            entry.pid !== process.pid &&
            entry.ppid === 1 &&
            entry.elapsedSeconds >= maxAgeSeconds &&
            isHeadlessBrowserRoot(entry.command),
        )
        .sort((a, b) => a.pid - b.pid);
}

export function readProcessList() {
    return parseProcessList(execFileSync("ps", ["-axo", "pid=,ppid=,etime=,command="], { encoding: "utf8" }));
}

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function isAlive(pid) {
    try {
        process.kill(pid, 0);
        return true;
    } catch (error) {
        return error?.code === "EPERM";
    }
}

export async function terminateStaleHeadless(targets, { graceMs = 1500 } = {}) {
    for (const { pid } of targets) {
        try {
            process.kill(pid, "SIGTERM");
        } catch (error) {
            if (error?.code !== "ESRCH") throw error;
        }
    }
    if (targets.length) await sleep(graceMs);
    const survivors = targets.filter(({ pid }) => isAlive(pid));
    for (const { pid } of survivors) {
        try {
            process.kill(pid, "SIGKILL");
        } catch (error) {
            if (error?.code !== "ESRCH") throw error;
        }
    }
    if (survivors.length) await sleep(100);
    return targets.filter(({ pid }) => isAlive(pid));
}

function optionValue(argv, name, fallback) {
    const index = argv.indexOf(name);
    if (index === -1) return fallback;
    const value = Number(argv[index + 1]);
    if (!Number.isFinite(value) || value < 0) throw new Error(`${name} requires a non-negative number`);
    return value;
}

export async function main(argv = process.argv.slice(2)) {
    const [command = "check"] = argv;
    if (!new Set(["check", "cleanup"]).has(command)) {
        console.error("usage: node headless-browser-guard.mjs <check|cleanup> [--max-age-seconds N]");
        return 2;
    }
    const maxAgeSeconds = optionValue(argv, "--max-age-seconds", DEFAULT_STALE_AGE_SECONDS);
    const targets = findStaleHeadless(readProcessList(), { maxAgeSeconds });
    if (!targets.length) {
        console.log(`HEADLESS BROWSER ${command.toUpperCase()} PASS · 0 orphaned process`);
        return 0;
    }
    const summary = targets.map(({ pid, elapsed }) => `${pid} (${elapsed})`).join(", ");
    if (command === "check") {
        console.error(`HEADLESS BROWSER CHECK FAIL · ${targets.length} orphaned process: ${summary}`);
        return 1;
    }
    const survivors = await terminateStaleHeadless(targets);
    if (survivors.length) {
        console.error(`HEADLESS BROWSER CLEANUP FAIL · surviving pid: ${survivors.map(({ pid }) => pid).join(", ")}`);
        return 1;
    }
    console.log(`HEADLESS BROWSER CLEANUP PASS · closed ${targets.length}: ${summary}`);
    return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
    process.exitCode = await main();
}
