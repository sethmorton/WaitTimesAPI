import { DateTime } from "luxon";
import type { PortInfo } from "./types";

export async function fetchCurrentWaitTimes(
  portNumber: number
): Promise<any[]> {
  const apiUrl =
    "https://us-west1-ssp-all-sites.cloudfunctions.net/waitTimesData";
  const response = await fetch(apiUrl);
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data.data.filter((item: any) => item.port_num === portNumber);
}

export async function fetchSixMonthData(portNumber: number): Promise<any[]> {
  const endDate = DateTime.now();
  const startDate = endDate.minus({ months: 6 });
  const apiUrl = constructApiUrl(startDate, endDate, portNumber);
  const response = await fetch(apiUrl);
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data.data;
}

function constructApiUrl(
  startDate: DateTime,
  endDate: DateTime,
  portNumber: number
): string {
  const baseUrl =
    "https://us-west1-ssp-all-sites.cloudfunctions.net/waitTimesData";
  const params = new URLSearchParams({
    startDate: startDate.toFormat("yyyy-MM-dd"),
    endDate: endDate.toFormat("yyyy-MM-dd"),
    portNum: portNumber.toString(),
    rowCount: "1000000",
  });
  return `${baseUrl}?${params.toString()}`;
}

export async function fetchBTSData(
  startDate: string,
  endDate: string
): Promise<any[]> {
  const url = constructBtsRequest(startDate, endDate);
  const response = await fetch(url);
  return response.json();
}

function constructBtsRequest(startDate: string, endDate: string): string {
  const baseUrl = "https://data.bts.gov/id/keg4-3bc2.json";
  const whereClause = `date between '${startDate}T00:00:00.000' and '${endDate}T00:00:00.000'`;
  const queryParams = new URLSearchParams({
    $limit: "100000",
    $where: whereClause,
    border: "US-Mexico Border",
    state: "California",
  });

  return `${baseUrl}?${queryParams.toString()}`;
}
