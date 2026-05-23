const cache = new Map<string, { allowed: boolean; checkedAt: number }>();

export async function isAllowedByRobots(
  url: string,
  userAgent = "ChardiTrialBot",
): Promise<boolean> {
  try {
    const origin = new URL(url).origin;
    const cached = cache.get(origin);
    if (cached && Date.now() - cached.checkedAt < 86400000) {
      return cached.allowed;
    }

    const robotsUrl = `${origin}/robots.txt`;
    const { ingestFetch } = await import("./http");
    const res = await ingestFetch(robotsUrl, {
      headers: { "User-Agent": userAgent },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      cache.set(origin, { allowed: true, checkedAt: Date.now() });
      return true;
    }
    const text = await res.text();
    const path = new URL(url).pathname;
    const lines = text.split("\n");
    let currentAgent = "*";
    const disallowed: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.toLowerCase().startsWith("user-agent:")) {
        currentAgent = trimmed.split(":")[1]?.trim() ?? "*";
      }
      if (
        (currentAgent === "*" || currentAgent === userAgent) &&
        trimmed.toLowerCase().startsWith("disallow:")
      ) {
        const p = trimmed.split(":").slice(1).join(":").trim();
        if (p) disallowed.push(p);
      }
    }

    const blocked = disallowed.some(
      (d) => d === "/" || (d.length > 0 && path.startsWith(d)),
    );
    cache.set(origin, { allowed: !blocked, checkedAt: Date.now() });
    return !blocked;
  } catch {
    return true;
  }
}
