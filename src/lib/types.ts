export interface PortInfo {
  name: string;
  number: number;
}

export interface WaitTime {
  duration: string;
  isDurationLoading: boolean;
  comparison: string;
  isComparisonLoading: boolean;
}

export interface WaitTimes {
  allTraffic: WaitTime;
  sentri: WaitTime;
  readyLane: WaitTime;
}

export interface BorderCrossingStat {
  value: string;
  isLoading: boolean;
}

export interface BorderCrossingStats {
  totalTravelers: BorderCrossingStat;
  vehicles: BorderCrossingStat;
  cargoTrucks: BorderCrossingStat;
}


export interface  WaitTimeData {
  lane_type: string; // Lane type associated with the data.
  port_num: number; // Port number associated with the data.
  date: string; // ISO 8601 date string indicating when the data was recorded.
  wait_time: number; // Wait time value (e.g., in minutes).
  daterecorded: string; // ISO 8601 date string indicating when the data was recorded.
}

export type LatestWaitTimes = Record<string, WaitTimeData | null>; // Maps lane keys to the latest WaitTimeData or null if no data is found.
