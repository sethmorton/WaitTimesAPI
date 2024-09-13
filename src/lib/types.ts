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

export interface LaneInfo {
  name: string;
  laneType: number;
  key: keyof WaitTimes;
}
