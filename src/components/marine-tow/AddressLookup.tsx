import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface AddressParts {
  street: string;
  city: string;
  postcode: string;
}

interface NominatimResult {
  display_name: string;
  address?: {
    house_number?: string;
    road?: string;
    pedestrian?: string;
    cycleway?: string;
    footway?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    hamlet?: string;
    municipality?: string;
    county?: string;
    state?: string;
    postcode?: string;
  };
}

function toParts(r: NominatimResult): AddressParts {
  const a = r.address ?? {};
  const street = [a.house_number, a.road ?? a.pedestrian ?? a.footway ?? a.cycleway]
    .filter(Boolean)
    .join(" ");
  const city =
    a.city ?? a.town ?? a.village ?? a.hamlet ?? a.suburb ?? a.municipality ?? a.county ?? "";
  return {
    street,
    city,
    postcode: a.postcode ?? "",
  };
}

interface Props {
  countryCode: "gb" | "us";
  street: string;
  city: string;
  postcode: string;
  onChange: (parts: AddressParts) => void;
}

export function AddressLookup({ countryCode, street, city, postcode, onChange }: Props) {
  const [query, setQuery] = useState(street);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const skipNextSearch = useRef(false);

  // Sync external street -> input
  useEffect(() => {
    setQuery(street);
  }, [street]);

  // Debounced search
  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }
    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const url = new URL("https://nominatim.openstreetmap.org/search");
        url.searchParams.set("q", q);
        url.searchParams.set("format", "json");
        url.searchParams.set("addressdetails", "1");
        url.searchParams.set("limit", "6");
        url.searchParams.set("countrycodes", countryCode);
        const res = await fetch(url.toString(), {
          signal: ctrl.signal,
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error("Lookup failed");
        const data = (await res.json()) as NominatimResult[];
        setResults(data);
        setOpen(true);
        setHighlight(-1);
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => {
      ctrl.abort();
      clearTimeout(timer);
    };
  }, [query, countryCode]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (r: NominatimResult) => {
    const parts = toParts(r);
    skipNextSearch.current = true;
    setQuery(parts.street);
    onChange(parts);
    setOpen(false);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2 relative" ref={containerRef}>
        <Label htmlFor="addressStreet">Street address</Label>
        <div className="relative">
          <Input
            id="addressStreet"
            value={query}
            placeholder="Start typing… we'll suggest matches"
            autoComplete="off"
            onChange={(e) => {
              setQuery(e.target.value);
              onChange({ street: e.target.value, city, postcode });
            }}
            onFocus={() => results.length > 0 && setOpen(true)}
            onKeyDown={(e) => {
              if (!open || results.length === 0) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setHighlight((h) => Math.min(h + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlight((h) => Math.max(h - 1, 0));
              } else if (e.key === "Enter" && highlight >= 0) {
                e.preventDefault();
                select(results[highlight]);
              } else if (e.key === "Escape") {
                setOpen(false);
              }
            }}
          />
          {loading && (
            <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        {open && results.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full max-h-64 overflow-auto rounded-md border bg-popover shadow-md">
            {results.map((r, i) => (
              <li key={`${r.display_name}-${i}`}>
                <button
                  type="button"
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => select(r)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm flex items-start gap-2 hover:bg-accent",
                    highlight === i && "bg-accent",
                  )}
                >
                  <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{r.display_name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-muted-foreground">
          Suggestions powered by OpenStreetMap. Select one to fill all fields.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="addressCity">City / Town</Label>
          <Input
            id="addressCity"
            value={city}
            onChange={(e) => onChange({ street: query, city: e.target.value, postcode })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="addressPostcode">
            {countryCode === "gb" ? "Postcode" : "ZIP code"}
          </Label>
          <Input
            id="addressPostcode"
            value={postcode}
            onChange={(e) =>
              onChange({ street: query, city, postcode: e.target.value })
            }
          />
        </div>
      </div>
    </div>
  );
}