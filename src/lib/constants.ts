/**
 * @typedef {Object} Port
 * @property {number[]} value - The port number(s)
 */

/**
 * @type {Object.<string, number[]>}
 */
export const PORTS = {
    "San Ysidro": [250401],
    "Otay Mesa": [250601],
    "Calexico East": [250301],
    Andrade: [250201],
    Tecate: [250501],
    Calexico: [250302],
  };
  
  /**
   * @type {number[]}
   */
  export const CALIPORTS = Object.values(PORTS).flat();
  
  /**
   * @type {string[]}
   */
  export const CALINAMES = Object.keys(PORTS);
  
  /**
   * @type {Array<{label: string, value: number[]}>}
   */
  export const dropperPorts = [
    { label: "Calexico East", value: PORTS["Calexico East"] },
    { label: "San Ysidro", value: PORTS["San Ysidro"] },
    { label: "Otay Mesa", value: PORTS["Otay Mesa"] },
    { label: "Cali-Baja", value: CALIPORTS },
  ];
  
  /**
   * @type {string[]}
   */
  export const PASSENGERS = [
    "Personal Vehicle Passengers",
    "Train Passengers",
    "Bus Passengers",
  ];
  
  /**
   * @type {string[]}
   */
  export const VEHICLES = ["Personal Vehicles", "Buses", "Trains"];
  
  /**
   * @type {string[]}
   */
  export const PEDESTRIANS = ["Pedestrians"];
  
  /**
   * @type {string[]}
   */
  export const TRUCKS = ["Trucks"];

  import type { PortInfo, LaneInfo } from './types';

export const portInfo: Record<string, PortInfo> = {
  sanYsidro: { name: "San Ysidro", number: 250401 },
  calexicoEast: { name: "Calexico East", number: 250301 },
  otayMesa: { name: "Otay Mesa", number: 250601 },
};

export const laneInfo: LaneInfo[] = [
  { name: "All Traffic", laneType: 0, key: "allTraffic" },
  { name: "Sentri", laneType: 1, key: "sentri" },
  { name: "Ready Lane", laneType: 2, key: "readyLane" },
];