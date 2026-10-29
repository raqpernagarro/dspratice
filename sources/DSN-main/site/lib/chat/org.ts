import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGateway, type LanguageModel } from 'ai';
import { ServiceError } from '@/lib/prototype/service';

/**
 * Company key: one shared, quota-managed key for signed-in Nagarro users.
 * Off until the site is hosted with sign-in. Configure with env:
 *   ORG_AI_PROVIDER  gateway | anthropic | openai
 *   ORG_AI_KEY       the shared key (server-only)
 *   ORG_AI_MODEL     model id for that provider
 *   ORG_AI_DAILY_TOKENS  per-user daily budget (default 200000)
 */

export interface OrgUser {
  id: string;
  email: string;
}

/** No sign-in exists yet. The hosting phase replaces this with the real session lookup. */
export async function getOrgUser(_req: Request): Promise<OrgUser | null> {
  return null;
}

export const orgConfigured = () => !!(process.env.ORG_AI_PROVIDER && process.env.ORG_AI_KEY && process.env.ORG_AI_MODEL);

export function getOrgModel(): LanguageModel {
  const provider = process.env.ORG_AI_PROVIDER;
  const apiKey = process.env.ORG_AI_KEY;
  const model = process.env.ORG_AI_MODEL;
  if (!provider || !apiKey || !model) throw new ServiceError(503, 'The company key is not configured on this server yet.');
  switch (provider) {
    case 'gateway':
      return createGateway({ apiKey })(model);
    case 'anthropic':
      return createAnthropic({ apiKey })(model);
    case 'openai':
      return createOpenAI({ apiKey })(model);
    default:
      throw new ServiceError(503, `Unknown ORG_AI_PROVIDER "${provider}".`);
  }
}

// ─── Quota ───────────────────────────────────────────────────────────────────

export interface Quota {
  /** Tokens left today; throws ServiceError(429) when none remain. */
  check(userId: string): Promise<number>;
  record(userId: string, tokens: number): Promise<void>;
}

const dailyBudget = () => Number(process.env.ORG_AI_DAILY_TOKENS) || 200_000;
const today = () => new Date().toISOString().slice(0, 10);

/** Local file quota (site/.data/usage). A hosted deploy swaps in a durable store. */
class FileQuota implements Quota {
  constructor(private dir: string) {}

  private file(userId: string) {
    return path.join(this.dir, `${today()}-${Buffer.from(userId).toString('base64url')}.json`);
  }

  private async used(userId: string) {
    try {
      return (JSON.parse(await fs.readFile(this.file(userId), 'utf8')) as { tokens: number }).tokens;
    } catch {
      return 0;
    }
  }

  async check(userId: string) {
    const left = dailyBudget() - (await this.used(userId));
    if (left <= 0) throw new ServiceError(429, 'You have used today’s company-key quota. It resets at midnight UTC.');
    return left;
  }

  async record(userId: string, tokens: number) {
    await fs.mkdir(this.dir, { recursive: true });
    await fs.writeFile(this.file(userId), JSON.stringify({ tokens: (await this.used(userId)) + tokens }));
  }
}

let quota: Quota | null = null;
export const getQuota = (): Quota => (quota ??= new FileQuota(path.join(/*turbopackIgnore: true*/ process.cwd(), '.data', 'usage')));
