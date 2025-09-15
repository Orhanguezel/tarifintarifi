// src/services/llm.service.ts

type Provider = "grok" | "groq";
type Msg = { role: "system" | "user"; content: string };

type ChatArgs = {
  provider?: Provider;
  model?: string;
  messages: Msg[];
  temperature?: number;
  /** When true, ask provider to return a strict JSON object. */
  forceJson?: boolean;
  /** Optional: number of total attempts (incl. first try). Default: 3 */
  maxRetries?: number;
};

export function extractJsonSafe(text: string): any {
  if (!text) throw new Error("Empty LLM response");
  const trimmed = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(trimmed);
  } catch {}

  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    const slice = trimmed.slice(first, last + 1);
    try {
      return JSON.parse(slice);
    } catch {}
  }
  throw new Error("LLM response is not valid JSON");
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseRetryAfterMs(msg?: string): number | undefined {
  if (!msg) return;
  const m = msg.match(/try again in\s+(\d+)(ms)?/i);
  if (m) return parseInt(m[1], 10);
  const s = msg.match(/(\d+(?:\.\d+)?)s/i);
  if (s) return Math.ceil(parseFloat(s[1]) * 1000);
  return;
}

async function postJSON(url: string, headers: Record<string, string>, body: any) {
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  const json: any = await resp.json().catch(() => ({}));
  return { resp, json };
}

export async function llmChat({
  provider = (process.env.LLM_PROVIDER as Provider) || "grok",
  model,
  messages,
  temperature = 0.7,
  forceJson = false,
  maxRetries,
}: ChatArgs): Promise<string> {
  if (!globalThis.fetch) throw new Error("fetch is not available in this Node runtime");

  const maxAttempts = typeof maxRetries === "number" && maxRetries > 0 ? maxRetries : 3;
  let attempt = 0;

  while (true) {
    attempt++;

    try {
      if (provider === "groq") {
        const key = process.env.GROQ_API_KEY;
        if (!key) throw new Error("GROQ_API_KEY missing");
        const m = model || process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

        const body: any = { model: m, messages, temperature };
        if (forceJson) body.response_format = { type: "json_object" };

        const { resp, json } = await postJSON(
          "https://api.groq.com/openai/v1/chat/completions",
          { Authorization: `Bearer ${key}` },
          body
        );

        if (!resp.ok) {
          // 429 ise basit backoff
          const code = json?.error?.code || json?.code;
          const msg = json?.error?.message || json?.message || "";
          if (resp.status === 429 || code === "rate_limit_exceeded") {
            const waitMs = parseRetryAfterMs(msg) ?? 1200;
            if (attempt < maxAttempts) {
              await sleep(waitMs);
              continue;
            }
          }
          throw new Error(`GROQ ${resp.status} ${JSON.stringify(json)}`);
        }
        return String(json?.choices?.[0]?.message?.content ?? "");
      }

      // xAI (Grok)
      const key = process.env.XAI_API_KEY;
      if (!key) throw new Error("XAI_API_KEY missing");
      const m = model || process.env.GROK_MODEL || "grok-2-mini";

      const body: any = { model: m, messages, temperature };
      if (forceJson) body.response_format = { type: "json_object" };

      const { resp, json } = await postJSON(
        "https://api.x.ai/v1/chat/completions",
        { Authorization: `Bearer ${key}` },
        body
      );

      if (!resp.ok) {
        if (resp.status === 429 && attempt < maxAttempts) {
          await sleep(1200);
          continue;
        }
        throw new Error(`GROK ${resp.status} ${JSON.stringify(json)}`);
      }
      return String(json?.choices?.[0]?.message?.content ?? "");
    } catch (err: any) {
      // Ağ/parse hataları için de retry dene
      if (attempt < maxAttempts) {
        await sleep(800);
        continue;
      }
      throw err;
    }
  }
}
