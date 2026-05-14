const DEFAULT_API_URL = "https://test-site-rinae.flodev.ca/api/v1";

function normalizePath(value) {
  const raw = Array.isArray(value) ? value.join("/") : value || "";
  return String(raw).replace(/^\/+/, "");
}

export default async function handler(req, res) {
  const apiUrl = (process.env.SQUAREFLO_API_URL || DEFAULT_API_URL).replace(/\/$/, "");
  const apiKey = process.env.SQUAREFLO_API_KEY || process.env.SQUAREFLO_DRAFT_KEY;
  const path = normalizePath(req.query.path);

  if (!apiKey) {
    res.status(500).json({ error: "Squareflo API key is not configured." });
    return;
  }

  if (!path || path.includes("..")) {
    res.status(400).json({ error: "Invalid Squareflo path." });
    return;
  }

  const target = new URL(`${apiUrl}/${path}`);
  Object.entries(req.query).forEach(([key, value]) => {
    if (key === "path") return;
    if (Array.isArray(value)) {
      value.forEach((item) => target.searchParams.append(key, item));
      return;
    }
    if (value != null) target.searchParams.set(key, String(value));
  });

  const method = req.method || "GET";
  const hasBody = method !== "GET" && method !== "HEAD";
  const response = await fetch(target.toString(), {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: hasBody ? JSON.stringify(req.body || {}) : undefined,
  });

  const contentType = response.headers.get("content-type") || "application/json";
  const payload = await response.text();
  res.status(response.status);
  res.setHeader("Content-Type", contentType);
  res.send(payload);
}
