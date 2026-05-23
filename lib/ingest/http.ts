import {
  Agent,
  fetch as undiciFetch,
  type RequestInit as UndiciRequestInit,
} from "undici";

const USER_AGENT =
  process.env.SCRAPER_USER_AGENT ??
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";

let insecureDispatcher: Agent | undefined;
let warnedInsecureTls = false;

function getInsecureDispatcher() {
  if (!insecureDispatcher) {
    insecureDispatcher = new Agent({ connect: { rejectUnauthorized: false } });
  }
  return insecureDispatcher;
}

function isTlsCertError(err: unknown): boolean {
  const code = (err as { cause?: { code?: string } })?.cause?.code;
  return (
    code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE" ||
    code === "CERT_HAS_EXPIRED" ||
    code === "SELF_SIGNED_CERT_IN_CHAIN"
  );
}

function shouldSkipTlsVerify(): boolean {
  return process.env.INGEST_TLS_SKIP_VERIFY === "true";
}

async function fetchWithUndici(
  url: string,
  options: RequestInit,
  insecure: boolean,
): Promise<Response> {
  const init: UndiciRequestInit = {
    method: options.method,
    body: options.body as UndiciRequestInit["body"],
    signal: options.signal as UndiciRequestInit["signal"],
    dispatcher: insecure ? getInsecureDispatcher() : undefined,
    headers: options.headers as Record<string, string>,
  };
  const res = await undiciFetch(url, init);
  return res as unknown as Response;
}

export async function ingestFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const headers = {
    "User-Agent": USER_AGENT,
    ...(options.headers as Record<string, string>),
  };
  const init = { ...options, headers };

  if (shouldSkipTlsVerify()) {
    return fetchWithUndici(url, init, true);
  }

  try {
    return await fetch(url, init);
  } catch (err) {
    if (!isTlsCertError(err)) throw err;

    if (!warnedInsecureTls) {
      warnedInsecureTls = true;
      console.warn(
        "[ingest] TLS certificate verification failed for a government API. " +
          "Retrying with relaxed TLS (dev only). Set INGEST_TLS_SKIP_VERIFY=true in .env to silence this, " +
          "or fix CA trust via Node --use-system-ca / corporate proxy settings.",
      );
    }
    return fetchWithUndici(url, init, true);
  }
}

export async function fetchJson<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await ingestFetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.headers as Record<string, string>),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} for ${url}: ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
