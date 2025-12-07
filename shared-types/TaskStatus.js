"use strict";
/**
 * Shared TypeScript types for Task/Job Status across LeetStack project
 * Used by browser extension, serverless, web-app, and mobile-client
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_POLLING_CONFIG = void 0;
exports.isTaskTerminal = isTaskTerminal;
exports.isTaskActive = isTaskActive;
exports.isTaskPending = isTaskPending;
/**
 * Default polling configurations
 */
exports.DEFAULT_POLLING_CONFIG = {
    /** Default for quick tasks (under 30 seconds) */
    quick: {
        intervalMs: 500,
        maxPolls: 60,
        backoffFactor: 1.1,
        maxIntervalMs: 2000,
    },
    /** Default for medium tasks (1-5 minutes) */
    medium: {
        intervalMs: 1500,
        maxPolls: 200,
        backoffFactor: 1.2,
        maxIntervalMs: 5000,
    },
    /** Default for long tasks (5+ minutes) */
    long: {
        intervalMs: 3000,
        maxPolls: 300,
        backoffFactor: 1.5,
        maxIntervalMs: 10000,
    },
};
// ===== Type Guards =====
/**
 * Check if a task is in a terminal state
 */
function isTaskTerminal(status) {
    return (status === "completed" || status === "failed" || status === "cancelled");
}
/**
 * Check if a task is actively being processed
 */
function isTaskActive(status) {
    return status === "processing" || status === "retrying";
}
/**
 * Check if a task is waiting to be processed
 */
function isTaskPending(status) {
    return status === "pending";
}
