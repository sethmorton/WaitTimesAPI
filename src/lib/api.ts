import { DateTime } from "luxon";
import type { PortInfo, LatestWaitTimes, WaitTimeData  } from "./types";
import { LANE_INFO } from "./constants";

export const fetchCurrentWaitTimes = async (
  portInfo: PortInfo
): Promise<(WaitTimeData | null)[]> => {
  const apiUrl =
    "https://us-west1-ssp-all-sites.cloudfunctions.net/waitTimesData";

  try {
    // Fetch data from the API
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    const { data, error }: { data: WaitTimeData[]; error?: string } = await response.json();

    if (error) {
      throw new Error(`API Error: ${error}`);
    }

    // Extract latest wait time data per lane
    const latestWaitTimes = LANE_INFO.map((lane) => {
      // Filter data relevant to the current lane and port
      const relevantItems = data.filter(
        (item) => item.lane_type === lane.laneType && item.port_num === portInfo.number
      );

      // Find the most recent entry or return null if none exist
      return relevantItems.reduce<WaitTimeData | null>((latest, current) => {
        return !latest ||
          DateTime.fromISO(current.daterecorded) > DateTime.fromISO(latest.daterecorded)
          ? current
          : latest;
      }, null);
    });

    return latestWaitTimes;
  } catch (error) {
    console.error("Error fetching wait times:", error instanceof Error ? error.message : error);
    throw error;
  }
};

export const fetchSixMonthData = async (portInfo: PortInfo): Promise<any[]> => {
  const endDate = DateTime.now();
  const startDate = endDate.minus({ months: 6 });
  const apiUrl = constructWaitTimesApiUrl(startDate, endDate, portInfo);
  const response = await fetch(apiUrl);
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data.data;
};

export const constructWaitTimesApiUrl = (
  startDate: DateTime,
  endDate: DateTime,
  portInfo: PortInfo
): string => {
  const baseUrl =
    "https://us-west1-ssp-all-sites.cloudfunctions.net/waitTimesData";
  const params = new URLSearchParams({
    startDate: startDate.toFormat("yyyy-MM-dd"),
    endDate: endDate.toFormat("yyyy-MM-dd"),
    portNum: portInfo.number.toString(),
    rowCount: "1000000",
  });
  return `${baseUrl}?${params.toString()}`;
};

export const fetchBTSData = async (
  startDate: string,
  endDate: string
): Promise<any[]> => {
  const url = constructBtsRequest(startDate, endDate);
  const response = await fetch(url);
  return response.json();
};

export const constructBtsRequest = (
  startDate: string,
  endDate: string
): string => {
  const baseUrl = "https://data.bts.gov/id/keg4-3bc2.json";
  const whereClause = `date between '${startDate}T00:00:00.000' and '${endDate}T00:00:00.000'`;
  const queryParams = new URLSearchParams({
    $limit: "100000",
    $where: whereClause,
    border: "US-Mexico Border",
    state: "California",
  });

  return `${baseUrl}?${queryParams.toString()}`;
};
