import { DateTime } from "luxon";
import type { Luxon } from "luxon";
import type { WaitTime, BorderCrossingStats } from "./types";

export function formatDate(timestamp: Luxon.DateTime): string {
  console.log(timestamp);
  // const date = DateTime.fromJSDate(timestamp).setZone("America/New_York");
  // return date.toFormat("h:mm a MM/dd/yy 'PST'");
  return timestamp.toFormat("h:mm a MM/dd/yy 'PST'");
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
    totalTravelers: [
      "Pedestrians",
      "Personal Vehicle Passengers",
      "Bus Passengers",
    ],
    vehicles: ["Personal Vehicles", "Buses"],
    cargoTrucks: ["Truck Containers Full", "Truck Containers Empty"],
  };

  return Object.entries(measures).reduce((acc, [key, measureList]) => {
    acc[key] = measureList.reduce(
      (sum, measure) =>
        sum +
        data
          .filter((el) => el.measure === measure)
          .reduce((total, el) => total + Number(el.value || 0), 0),
      0
    );
    return acc;
  }, {} as Record<string, number>);
}

export function formatNumber(num: number | undefined): string {
  if (num === undefined) return "N/A";
  if (isNaN(num)) return "Invalid";
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)} million`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return num.toString();
}

export function createInitialWaitTime(): WaitTime {
  return {
    duration: "Loading...",
    isDurationLoading: true,
    comparison: "Loading...",
    isComparisonLoading: true,
  };
}

export function createInitialBorderCrossingStats(): BorderCrossingStats {
  return {
    totalTravelers: { value: "Loading...", isLoading: true },
    vehicles: { value: "Loading...", isLoading: true },
    cargoTrucks: { value: "Loading...", isLoading: true },
  };
}
