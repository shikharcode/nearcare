const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
const MAGENTA = "\x1b[35m";

function statusColor(status: number) {
  if (status < 300) return GREEN;
  if (status < 400) return YELLOW;
  return RED;
}

function methodColor(method: string) {
  switch (method) {
    case "GET": return CYAN;
    case "POST": return GREEN;
    case "PATCH":
    case "PUT": return YELLOW;
    case "DELETE": return RED;
    default: return MAGENTA;
  }
}

export function logRequest(method: string, path: string, params?: Record<string, unknown>) {
  const ts = new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm
  const mc = methodColor(method);
  const paramsStr = params && Object.keys(params).length
    ? `  ${DIM}${JSON.stringify(params)}${RESET}`
    : "";
  console.log(`${DIM}[${ts}]${RESET} ${mc}${BOLD}${method.padEnd(6)}${RESET} ${path}${paramsStr}`);
}

export function logResponse(
  method: string,
  path: string,
  status: number,
  durationMs: number,
  data?: unknown
) {
  const ts = new Date().toISOString().slice(11, 23);
  const sc = statusColor(status);
  const mc = methodColor(method);
  const dataStr = data !== undefined
    ? `  ${DIM}${JSON.stringify(data).slice(0, 200)}${RESET}`
    : "";
  console.log(
    `${DIM}[${ts}]${RESET} ${mc}${BOLD}${method.padEnd(6)}${RESET} ${path}` +
    `  ${sc}${BOLD}${status}${RESET}  ${DIM}${durationMs}ms${RESET}${dataStr}`
  );
}

// Wrap a Next.js route handler with automatic req/res logging
export function withLogging(
  method: string,
  path: string,
  handler: (req: Request, ctx?: unknown) => Promise<Response>
): (req: Request, ctx?: unknown) => Promise<Response> {
  return async (req, ctx) => {
    const start = Date.now();
    let body: unknown;
    try {
      const cloned = req.clone();
      const text = await cloned.text();
      if (text) body = JSON.parse(text);
    } catch { /* non-JSON body */ }

    const qs = new URL(req.url).search;
    const fullPath = path + (qs || "");
    logRequest(method, fullPath, body as Record<string, unknown> | undefined);

    const res = await handler(req, ctx);
    const duration = Date.now() - start;

    let resData: unknown;
    try {
      const cloned = res.clone();
      const text = await cloned.text();
      if (text) resData = JSON.parse(text);
    } catch { /* non-JSON */ }

    logResponse(method, fullPath, res.status, duration, resData);
    return res;
  };
}
