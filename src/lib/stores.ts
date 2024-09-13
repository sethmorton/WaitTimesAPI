import { writable } from "svelte/store";
import type { WaitTimes, BorderCrossingStats } from "./types";

export const selectedPort = writable("sanYsidro");
export const waitTimes = writable<WaitTimes>({
  allTraffic: { time: "Loading...", comparison: "Loading..." },
  sentri: { time: "Loading...", comparison: "Loading..." },
  readyLane: { time: "Loading...", comparison: "Loading..." },
});
export const lastUpdated = writable("Loading...");
export const borderCrossingStats = writable<BorderCrossingStats>({
  totalTravelers: "Loading...",
  vehicles: "Loading...",
  cargoTrucks: "Loading...",
});
export const fiscalYear = writable("Loading...");
export const isLoadingWaitTimes = writable(true);
export const isLoadingPortSelection = writable(false);
export const isLoadingBorderStats = writable(true);
