import { useCallback, useSyncExternalStore } from "react";

import { classifyOccurrence } from "./catalog";
import { createDemoOccurrences } from "./demo";
import type { Occurrence, OccurrenceLocation, OccurrenceMedia } from "./types";

const STORAGE_KEY = "cityos-occurrences-v1";

let occurrences: Occurrence[] | null = null;
const listeners = new Set<() => void>();

function read(): Occurrence[] {
  if (occurrences) return occurrences;

  if (typeof window === "undefined") {
    occurrences = [];
    return occurrences;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (raw) {
      occurrences = JSON.parse(raw) as Occurrence[];
      return occurrences;
    }
  } catch {
    /* ignora storage inválido */
  }

  occurrences = createDemoOccurrences();
  persist();

  return occurrences;
}

function persist() {
  if (typeof window === "undefined" || !occurrences) return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(occurrences));
  } catch {
    /* storage indisponível */
  }
}

function emit() {
  persist();
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function nextProtocol(list: Occurrence[]) {
  const year = new Date().getFullYear();
  const sequence = list.length + 1;

  return `#${year}-${String(sequence).padStart(6, "0")}`;
}

export type NewOccurrenceInput = {
  typeId: string;
  description: string;
  media: OccurrenceMedia | null;
  location: OccurrenceLocation;
};

export function addOccurrence(input: NewOccurrenceInput): Occurrence {
  const list = read();
  const classification = classifyOccurrence({
    typeId: input.typeId,
    description: input.description,
  });

  const occurrence: Occurrence = {
    id: `occ-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
    protocol: nextProtocol(list),
    typeId: input.typeId,
    description: input.description.trim(),
    media: input.media,
    location: input.location,
    priority: classification.priority,
    agency: classification.agency,
    status: "recebida",
    confirmations: 0,
    createdAt: new Date().toISOString(),
    demo: false,
  };

  occurrences = [occurrence, ...list];
  emit();

  return occurrence;
}

export function confirmOccurrence(id: string) {
  const list = read();

  occurrences = list.map((item) =>
    item.id === id ? { ...item, confirmations: item.confirmations + 1 } : item,
  );

  emit();
}

const EMPTY: Occurrence[] = [];

export function useOccurrences(): Occurrence[] {
  return useSyncExternalStore(
    subscribe,
    () => read(),
    () => EMPTY,
  );
}

export function useAddOccurrence() {
  return useCallback((input: NewOccurrenceInput) => addOccurrence(input), []);
}
