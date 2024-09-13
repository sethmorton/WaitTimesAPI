import { DateTime } from "luxon";
import type { WaitTimes, LaneInfo } from "./types";

export function formatDate(timestamp: Date): string {
  const date = DateTime.fromJSDate(timestamp).toUTC();
  return date.toFormat("h:mm a MM/dd/yy");
}

export function calculatePercentChange(
  averageValue: number,
  currentValue: number
): number {
  return averageValue !== 0
    ? ((currentValue - averageValue) / averageValue) * 100
    : 0;
}

export function calculateSixMonthAverage(data: any[]): number | null {
  if (data.length === 0) return null;
  const sum = data.reduce((acc, item) => acc + item.delay_seconds, 0);
  return Math.round(sum / data.length);
}

export function updateCurrentWaitTimes(
  data: any[],
  laneInfo: LaneInfo[]
): WaitTimes {
  const waitTimes: WaitTimes = {
    allTraffic: { time: "N/A", comparison: "N/A" },
    sentri: { time: "N/A", comparison: "N/A" },
    readyLane: { time: "N/A", comparison: "N/A" },
  };

  laneInfo.forEach((info) => {
    const currentData = data.find((item) => item.lane_type === info.laneType);
    if (currentData) {
      const waitTime = Math.round(currentData.delay_seconds / 60);
      waitTimes[info.key].time = `${waitTime} minutes`;
    }
  });

  return waitTimes;
}

export function updateWithSixMonthAverage(
  sixMonthData: any[],
  currentData: any[],
  laneInfo: LaneInfo[],
  waitTimes: WaitTimes
): WaitTimes {
  laneInfo.forEach((info) => {
    const laneData = sixMonthData.filter(
      (item) => item.lane_type === info.laneType
    );
    const currentLaneData = currentData.find(
      (item) => item.lane_type === info.laneType
    );
    const sixMonthAverageData = calculateSixMonthAverage(laneData);

    if (currentLaneData && sixMonthAverageData) {
      const percentChange = calculatePercentChange(
        sixMonthAverageData,
        currentLaneData.delay_seconds
      );
      waitTimes[info.key].comparison = `${Math.abs(
        Math.round(percentChange)
      )}%`;
    }
  });

  return waitTimes;
}

export function calculatePreviousFiscalYearDates(): {
  startDate: string;
  endDate: string;
  fiscalYear: string;
} {
  const currentDate = DateTime.now();
  let fyEnd = DateTime.local(currentDate.year - 1, 9, 30);
  let fyStart = fyEnd.minus({ years: 1 }).plus({ days: 1 });

  if (currentDate.month > 9) {
    fyEnd = fyEnd.plus({ years: 1 });
    fyStart = fyStart.plus({ years: 1 });
  }

  return {
    startDate: fyStart.toFormat("yyyy-MM-dd"),
    endDate: fyEnd.toFormat("yyyy-MM-dd"),
    fiscalYear: fyEnd.year.toString(),
  };
}

export function calculateCrossings(data: any[]): Record<string, number> {
  const measures: Record<string, string[]> = {
    "Total Travelers": [
      "Pedestrians",
      "Personal Vehicle Passengers",
      "Bus Passengers",
    ],
    Vehicles: ["Personal Vehicles", "Buses"],
    "Cargo Trucks": ["Truck Containers Full", "Truck Containers Empty"],
  };

  return Object.entries(measures).reduce((acc, [key, measureList]) => {
    acc[key] = measureList.reduce(
      (sum, measure) =>
        sum +
        data
          .filter((el) => el.measure === measure)
          .reduce((total, el) => total + Number(el.value), 0),
      0
    );
    return acc;
  }, {} as Record<string, number>);
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)} million`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return num.toString();
}
