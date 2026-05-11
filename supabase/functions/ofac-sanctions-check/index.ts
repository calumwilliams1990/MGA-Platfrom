const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SDN_URL = "https://www.treasury.gov/ofac/downloads/sdn.csv";
const ALT_URL = "https://www.treasury.gov/ofac/downloads/alt.csv";

type SdnRow = { id: string; name: string; type: string; program: string };

let cache: { rows: SdnRow[]; alts: SdnRow[]; loadedAt: number } | null = null;
const TTL_MS = 1000 * 60 * 60 * 12; // 12h

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') { inQ = false; }
      else cur += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") { out.push(cur); cur = ""; }
      else cur += c;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim().replace(/^"|"$/g, ""));
}

async function loadLists() {
  if (cache && Date.now() - cache.loadedAt < TTL_MS) return cache;
  const [sdnRes, altRes] = await Promise.all([fetch(SDN_URL), fetch(ALT_URL)]);
  const sdnText = await sdnRes.text();
  const altText = await altRes.text();
  const rows: SdnRow[] = sdnText.split(/\r?\n/).filter(Boolean).map((l) => {
    const c = parseCsvLine(l);
    return { id: c[0], name: c[1] || "", type: c[2] || "", program: c[3] || "" };
  });
  const alts: SdnRow[] = altText.split(/\r?\n/).filter(Boolean).map((l) => {
    const c = parseCsvLine(l);
    // alt.csv: ent_num, alt_num, alt_type, alt_name, alt_remarks
    return { id: c[0], name: c[3] || "", type: c[2] || "alias", program: "" };
  });
  cache = { rows, alts, loadedAt: Date.now() };
  return cache;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}

function tokens(s: string): string[] {
  return normalize(s).split(" ").filter((t) => t.length > 1);
}

function scoreMatch(query: string, candidate: string): number {
  const q = normalize(query);
  const c = normalize(candidate);
  if (!q || !c) return 0;
  if (c === q) return 1;
  if (c.includes(q) || q.includes(c)) return 0.9;
  const qt = new Set(tokens(query));
  const ct = new Set(tokens(candidate));
  if (qt.size === 0 || ct.size === 0) return 0;
  let inter = 0;
  for (const t of qt) if (ct.has(t)) inter++;
  return inter / Math.max(qt.size, ct.size);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { name } = await req.json();
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return new Response(JSON.stringify({ error: "Name required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { rows, alts } = await loadLists();
    const all = [...rows, ...alts];
    const matches = all
      .map((r) => ({ ...r, score: scoreMatch(name, r.name) }))
      .filter((r) => r.score >= 0.7)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    return new Response(
      JSON.stringify({
        query: name,
        matchCount: matches.length,
        matches,
        source: "OFAC SDN + Alternates",
        checkedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});