'use client'

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function MedicationAutocomplete({ value, onChange, placeholder }: Props) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const q = encodeURIComponent(query);
        const [res1, res2] = await Promise.all([
          fetch(`https://api.fda.gov/drug/label.json?search=openfda.brand_name:${q}&limit=5`),
          fetch(`https://api.fda.gov/drug/label.json?search=openfda.generic_name:${q}&limit=5`),
        ]);

        const names: string[] = [];

        const addNames = (data: any, field: string) => {
          data.results?.forEach((r: any) => {
            r.openfda?.[field]?.forEach((n: string) => {
              const formatted = n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
              if (!names.includes(formatted)) names.push(formatted);
            });
          });
        };

        if (res1.ok) addNames(await res1.json(), "brand_name");
        if (res2.ok) addNames(await res2.json(), "generic_name");

        setSuggestions(names.slice(0, 8));
        setOpen(names.length > 0);
      } catch {
        setSuggestions([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 400);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const select = (name: string) => {
    setQuery(name);
    onChange(name);
    setOpen(false);
    setSuggestions([]);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            onChange(e.target.value);
          }}
          placeholder={placeholder || "Search medication..."}
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-gray-400" />
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg dark:shadow-gray-950/50 max-h-52 overflow-y-auto">
          {suggestions.map((name, i) => (
            <button
              key={i}
              type="button"
              className="w-full text-left px-3 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-700 dark:hover:text-blue-300 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0"
              onMouseDown={() => select(name)}
            >
              {name}
            </button>
          ))}
          <p className="px-3 py-1.5 text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/60">Powered by OpenFDA</p>
        </div>
      )}
    </div>
  );
}
