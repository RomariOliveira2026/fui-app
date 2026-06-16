/**
 * ADDRESS AUTOCOMPLETE COMPONENT
 *
 * Autocomplete com histórico e endereços salvos integrados ao dropdown —
 * visíveis apenas com foco + texto digitado.
 */

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { filterDemoPlaces, findDemoPlaceByPlaceId, findDemoPlaceByText } from "@shared/demoMaps";
import type { AddressHistoryItem } from "@/lib/addressHistory";
import {
  filterHistoryByQuery,
  filterSavedAddresses,
  savedAddressTitle,
  type SavedAddressLike,
} from "@/lib/addressSuggestions";
import { Bookmark, Briefcase, History, Home, Loader2, MapPin, Star, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddressResult {
  description: string;
  placeId: string;
  mainText: string;
  secondaryText: string;
}

type FlatSuggestion =
  | {
      type: "saved";
      key: string;
      title: string;
      address: string;
      label?: string;
    }
  | {
      type: "history";
      key: string;
      address: string;
      placeId?: string;
    }
  | {
      type: "place";
      key: string;
      result: AddressResult;
    };

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: { address: string; placeId: string; lat?: number; lng?: number }) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Chamado ao sair do campo com texto válido (≥3 caracteres). */
  onConfirm?: (value: string) => void;
  /** Histórico local — exibido no dropdown ao digitar. */
  historyItems?: AddressHistoryItem[];
  /** Endereços salvos — exibidos no dropdown ao digitar. */
  savedAddresses?: SavedAddressLike[];
  /** Viés regional para sugestões (lat/lng do usuário). */
  locationBias?: { lat: number; lng: number } | null;
}

function savedIcon(label?: string) {
  if (label === "home") return <Home className="w-4 h-4 mt-0.5 text-[#F39200] shrink-0" />;
  if (label === "work") return <Briefcase className="w-4 h-4 mt-0.5 text-[#F39200] shrink-0" />;
  if (label === "other") return <Star className="w-4 h-4 mt-0.5 text-[#F39200] shrink-0" />;
  return <Bookmark className="w-4 h-4 mt-0.5 text-[#F39200] shrink-0" />;
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Digite um endereço...",
  icon,
  className,
  inputClassName,
  disabled = false,
  autoFocus = false,
  onConfirm,
  historyItems = [],
  savedAddresses = [],
  locationBias = null,
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipBlurConfirmRef = useRef(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const handleInputChange = useCallback(
    (newValue: string) => {
      setQuery(newValue);
      onChange(newValue);
      setSelectedIndex(-1);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      if (newValue.trim().length >= 3) {
        debounceRef.current = setTimeout(() => {
          setDebouncedQuery(newValue);
        }, 300);
      } else {
        setDebouncedQuery("");
      }
    },
    [onChange]
  );

  const { data: mapsConfigured } = trpc.maps.isConfigured.useQuery(undefined, {
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const locationBiasParam =
    locationBias && Number.isFinite(locationBias.lat) && Number.isFinite(locationBias.lng)
      ? `${locationBias.lat},${locationBias.lng}`
      : undefined;

  const useDemoPlacesCatalog = mapsConfigured === false;

  const { data: suggestions, isLoading: isLoadingApi } = trpc.maps.autocomplete.useQuery(
    { input: debouncedQuery, location: locationBiasParam },
    {
      enabled: !useDemoPlacesCatalog && debouncedQuery.trim().length >= 3,
      staleTime: 30000,
      refetchOnWindowFocus: false,
      retry: false,
    }
  );

  const isLoading = useDemoPlacesCatalog ? false : isLoadingApi;

  const apiResults: AddressResult[] = (suggestions || []).map((s: any) => ({
    description: s.description,
    placeId: s.place_id,
    mainText: s.structured_formatting?.main_text || s.description.split(",")[0],
    secondaryText:
      s.structured_formatting?.secondary_text || s.description.split(",").slice(1).join(","),
  }));

  const useDemoPlaces = useDemoPlacesCatalog;

  const demoResults: AddressResult[] = useDemoPlaces
    ? filterDemoPlaces(debouncedQuery).map((p) => ({
        description: p.description,
        placeId: p.placeId,
        mainText: p.mainText,
        secondaryText: p.secondaryText,
      }))
    : [];

  const placeResults: AddressResult[] = useDemoPlacesCatalog
    ? demoResults
    : apiResults.length > 0
      ? apiResults
      : demoResults;

  const trimmedQuery = query.trim();
  const filteredSaved = useMemo(
    () => filterSavedAddresses(savedAddresses, trimmedQuery),
    [savedAddresses, trimmedQuery]
  );
  const filteredHistory = useMemo(
    () => filterHistoryByQuery(historyItems, trimmedQuery),
    [historyItems, trimmedQuery]
  );

  const flatSuggestions = useMemo((): FlatSuggestion[] => {
    const seen = new Set<string>();
    const out: FlatSuggestion[] = [];

    for (const item of filteredSaved) {
      const key = item.address.trim().toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        type: "saved",
        key: `saved-${item.id}`,
        title: savedAddressTitle(item),
        address: item.address,
        label: item.label,
      });
    }

    for (const item of filteredHistory) {
      const key = item.address.trim().toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        type: "history",
        key: `history-${key}`,
        address: item.address,
        placeId: item.placeId,
      });
    }

    if (debouncedQuery.trim().length >= 3) {
      for (const result of placeResults) {
        const key = result.description.trim().toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ type: "place", key: `place-${result.placeId}`, result });
      }
    }

    return out;
  }, [filteredSaved, filteredHistory, placeResults, debouncedQuery]);

  const showDropdown =
    isFocused &&
    trimmedQuery.length > 0 &&
    (flatSuggestions.length > 0 || (debouncedQuery.trim().length >= 3 && isLoading));

  const showEmptyState =
    isFocused &&
    trimmedQuery.length > 0 &&
    debouncedQuery.trim().length >= 3 &&
    !isLoading &&
    flatSuggestions.length === 0;

  const handleSelectResult = useCallback(
    (result: AddressResult) => {
      skipBlurConfirmRef.current = true;
      setQuery(result.description);
      onChange(result.description);
      setDebouncedQuery("");

      const demoPlace = findDemoPlaceByPlaceId(result.placeId);
      onSelect({
        address: result.description,
        placeId: result.placeId,
        lat: demoPlace?.lat,
        lng: demoPlace?.lng,
      });

      window.setTimeout(() => {
        skipBlurConfirmRef.current = false;
      }, 200);
    },
    [onChange, onSelect]
  );

  const handleSelectFlat = useCallback(
    (item: FlatSuggestion) => {
      skipBlurConfirmRef.current = true;

      if (item.type === "place") {
        handleSelectResult(item.result);
        return;
      }

      const address = item.address;
      const exact = findDemoPlaceByText(address);
      const partial = exact ?? filterDemoPlaces(address)[0];
      const placeId =
        item.type === "history" && item.placeId
          ? item.placeId
          : partial?.placeId ?? "";

      setQuery(address);
      onChange(address);
      setDebouncedQuery("");
      onSelect({
        address,
        placeId,
        lat: partial?.lat,
        lng: partial?.lng,
      });

      window.setTimeout(() => {
        skipBlurConfirmRef.current = false;
      }, 200);
    },
    [handleSelectResult, onChange, onSelect]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showDropdown || flatSuggestions.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, flatSuggestions.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        e.preventDefault();
        handleSelectFlat(flatSuggestions[selectedIndex]!);
      } else if (e.key === "Escape") {
        setIsFocused(false);
      }
    },
    [showDropdown, flatSuggestions, selectedIndex, handleSelectFlat]
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">{icon}</div>}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            window.setTimeout(() => {
              if (skipBlurConfirmRef.current) return;
              setIsFocused(false);
              const trimmed = query.trim();
              if (trimmed.length >= 3) {
                onConfirm?.(trimmed);
              }
            }, 0);
          }}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className={cn(
            "w-full py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:border-[#F39200] focus:outline-none transition-colors text-sm",
            icon ? "pl-9 pr-10" : "pl-4 pr-10",
            inputClassName
          )}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              onChange("");
              setDebouncedQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {isLoading && debouncedQuery.trim().length >= 3 && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 animate-spin text-[#F39200]" />
          </div>
        )}
      </div>

      {showDropdown && flatSuggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden max-h-[300px] overflow-y-auto"
        >
          {flatSuggestions.map((item, index) => {
            const prev = flatSuggestions[index - 1];
            const showHeader = !prev || prev.type !== item.type;
            const sectionLabel =
              item.type === "saved"
                ? "Salvos"
                : item.type === "history"
                  ? "Recentes"
                  : "Sugestões";

            return (
              <div key={item.key}>
                {showHeader ? (
                  <p className="px-4 pt-2 pb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {sectionLabel}
                  </p>
                ) : null}
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelectFlat(item)}
                  className={cn(
                    "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors",
                    index === selectedIndex
                      ? "bg-[#F39200]/10 text-foreground"
                      : "text-muted-foreground hover:bg-accent"
                  )}
                >
                  {item.type === "saved" ? (
                    savedIcon(item.label)
                  ) : item.type === "history" ? (
                    <History className="w-4 h-4 mt-0.5 text-[#F39200] shrink-0" />
                  ) : (
                    <MapPin className="w-4 h-4 mt-0.5 text-[#F39200] shrink-0" />
                  )}
                  <div className="min-w-0">
                    {item.type === "saved" ? (
                      <>
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.address}</p>
                      </>
                    ) : item.type === "history" ? (
                      <p className="text-sm font-medium truncate">{item.address}</p>
                    ) : (
                      <>
                        <p className="text-sm font-medium truncate">{item.result.mainText}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {item.result.secondaryText}
                        </p>
                      </>
                    )}
                  </div>
                </button>
              </div>
            );
          })}
          {debouncedQuery.trim().length >= 3 ? (
            <div className="px-4 py-2 border-t border-border">
              <p className="text-[10px] text-muted-foreground/50 text-right">
                {useDemoPlacesCatalog || (demoResults.length > 0 && apiResults.length === 0)
                  ? mapsConfigured === false
                    ? "Sugestões via OpenStreetMap"
                    : "Sugestões locais — Itabaiana/SE"
                  : "Powered by Google"}
              </p>
            </div>
          ) : null}
        </div>
      )}

      {showEmptyState && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-2xl z-50 p-4 text-center"
        >
          <p className="text-sm text-muted-foreground">Nenhum endereço encontrado</p>
        </div>
      )}
    </div>
  );
}

export default AddressAutocomplete;
