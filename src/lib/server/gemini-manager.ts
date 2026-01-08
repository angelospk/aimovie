/**
 * Gemini API Model Manager
 * 
 * Implements load balancing and automatic failover between multiple Gemini models
 * based on rate limits (RPD/RPM).
 */

export interface ModelConfig {
    name: string;
    rpd: number; // Requests Per Day
    rpm: number; // Requests Per Minute
    provider: 'gemini' | 'openrouter';
}

interface ModelUsage {
    dailyCount: number;
    minuteWindow: { timestamp: number; count: number }[];
    lastDailyReset: number;
    temporarilyExhausted: boolean;
    permanentlyDisabled: boolean; // Model doesn't exist (404)
}

// Model configuration with priority order (configurable limits)
export const MODEL_CONFIG: ModelConfig[] = [
    { name: 'gemini-2.5-flash', rpd: 20, rpm: 5, provider: 'gemini' },
    { name: 'google/gemma-3-27b-it:free', rpd: 14400, rpm: 30, provider: 'openrouter' },
    { name: 'xiaomi/mimo-v2-flash:free', rpd: 1000, rpm: 20, provider: 'openrouter' },
    { name: 'gemini-2.5-flash-lite', rpd: 20, rpm: 10, provider: 'gemini' }
];

// In-memory usage tracking (resets on server restart)
const modelUsage: Map<string, ModelUsage> = new Map();

// Initialize usage tracking for all models
function initializeUsage(): void {
    const now = Date.now();
    for (const model of MODEL_CONFIG) {
        if (!modelUsage.has(model.name)) {
            modelUsage.set(model.name, {
                dailyCount: 0,
                minuteWindow: [],
                lastDailyReset: now,
                temporarilyExhausted: false,
                permanentlyDisabled: false
            });
        }
    }
}

// Clean up minute window entries older than 60 seconds
function cleanMinuteWindow(usage: ModelUsage): void {
    const oneMinuteAgo = Date.now() - 60000;
    usage.minuteWindow = usage.minuteWindow.filter((entry) => entry.timestamp > oneMinuteAgo);
}

// Reset daily count if a new day has started (UTC)
function checkDailyReset(usage: ModelUsage): void {
    const now = Date.now();
    const lastResetDate = new Date(usage.lastDailyReset).toUTCString().split(' ').slice(0, 4).join(' ');
    const currentDate = new Date(now).toUTCString().split(' ').slice(0, 4).join(' ');

    if (lastResetDate !== currentDate) {
        usage.dailyCount = 0;
        usage.lastDailyReset = now;
        usage.temporarilyExhausted = false;
        console.log('[GeminiManager] Daily reset triggered');
    }
}

// Get the current minute request count
function getMinuteCount(usage: ModelUsage): number {
    cleanMinuteWindow(usage);
    return usage.minuteWindow.reduce((sum, entry) => sum + entry.count, 0);
}

/**
 * Get the first available model that is within its rate limits
 * @returns Model config or null if all models are exhausted
 */
export function getAvailableModel(): ModelConfig | null {
    initializeUsage();

    for (const model of MODEL_CONFIG) {
        const usage = modelUsage.get(model.name)!;
        checkDailyReset(usage);
        cleanMinuteWindow(usage);

        const minuteCount = getMinuteCount(usage);
        const withinDailyLimit = usage.dailyCount < model.rpd;
        const withinMinuteLimit = minuteCount < model.rpm;
        const notExhausted = !usage.temporarilyExhausted;
        const notDisabled = !usage.permanentlyDisabled;

        if (withinDailyLimit && withinMinuteLimit && notExhausted && notDisabled) {
            console.log(`[GeminiManager] Selected model: ${model.name} (${model.provider}) (daily: ${usage.dailyCount}/${model.rpd}, minute: ${minuteCount}/${model.rpm})`);
            return model;
        }
    }

    console.error('[GeminiManager] All models exhausted');
    return null;
}

/**
 * Record successful usage of a model
 */
export function recordUsage(modelName: string): void {
    const usage = modelUsage.get(modelName);
    if (!usage) {
        console.warn(`[GeminiManager] Unknown model: ${modelName}`);
        return;
    }

    usage.dailyCount++;
    usage.minuteWindow.push({ timestamp: Date.now(), count: 1 });
    console.log(`[GeminiManager] Recorded usage for ${modelName} (daily: ${usage.dailyCount})`);
}

/**
 * Handle rate limit error (429) by marking model as temporarily exhausted
 */
export function handleRateLimit(modelName: string): void {
    const usage = modelUsage.get(modelName);
    if (!usage) {
        console.warn(`[GeminiManager] Unknown model: ${modelName}`);
        return;
    }

    usage.temporarilyExhausted = true;
    console.log(`[GeminiManager] Model ${modelName} marked as temporarily exhausted due to 429`);

    // Reset exhausted flag after 1 minute
    setTimeout(() => {
        const u = modelUsage.get(modelName);
        if (u) {
            u.temporarilyExhausted = false;
            console.log(`[GeminiManager] Model ${modelName} reset from temporary exhaustion`);
        }
    }, 60000);
}

/**
 * Handle model not found error (404) by permanently disabling the model
 */
export function handleModelNotFound(modelName: string): void {
    const usage = modelUsage.get(modelName);
    if (!usage) {
        console.warn(`[GeminiManager] Unknown model: ${modelName}`);
        return;
    }

    usage.permanentlyDisabled = true;
    console.log(`[GeminiManager] Model ${modelName} permanently disabled due to 404 (not found)`);
}

/**
 * Get the base URL for a specific model
 */
export function getModelApiUrl(modelName: string): string {
    return `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
}

/**
 * Get usage stats for debugging/monitoring
 */
export function getUsageStats(): Record<string, { dailyCount: number; minuteCount: number; exhausted: boolean }> {
    initializeUsage();
    const stats: Record<string, { dailyCount: number; minuteCount: number; exhausted: boolean }> = {};

    for (const model of MODEL_CONFIG) {
        const usage = modelUsage.get(model.name)!;
        cleanMinuteWindow(usage);
        stats[model.name] = {
            dailyCount: usage.dailyCount,
            minuteCount: getMinuteCount(usage),
            exhausted: usage.temporarilyExhausted
        };
    }

    return stats;
}
