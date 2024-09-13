<script lang="ts">
  import { onMount } from "svelte";
  import Fa from "svelte-fa";
  import {
    faCaretUp,
    faCaretDown,
    faQuestionCircle,
  } from "@fortawesome/free-solid-svg-icons";
  import { DateTime } from "luxon";

  import type {
    LaneInfo,
    WaitTime,
    WaitTimes,
    PortInfo,
    BorderCrossingStats,
  } from "$lib/types";

  const PORT_INFO: Record<string, PortInfo> = {
    sanYsidro: { name: "San Ysidro", number: 250401 },
    calexicoEast: { name: "Calexico East", number: 250301 },
    otayMesa: { name: "Otay Mesa", number: 250601 },
  };

  const LANE_INFO: LaneInfo[] = [
    { name: "All Traffic", laneType: 0, key: "allTraffic" },
    { name: "Sentri", laneType: 1, key: "sentri" },
    { name: "Ready Lane", laneType: 2, key: "readyLane" },
  ];

  let selectedPort: keyof typeof PORT_INFO = "sanYsidro";
  let previousPort: keyof typeof PORT_INFO = selectedPort;
  let isInitialLoad = true;
  let isLoadingPortSelection = false;

  let waitTimes: WaitTimes = {
    allTraffic: createInitialWaitTime(),
    sentri: createInitialWaitTime(),
    readyLane: createInitialWaitTime(),
  };

  let lastUpdated = "Loading...";
  let isLastUpdatedLoading = true;
  let borderCrossingStats: BorderCrossingStats =
    createInitialBorderCrossingStats();
  let fiscalYear = "Loading...";
  let isFiscalYearLoading = true;

  onMount(async () => {
    await loadData();
    isInitialLoad = false;
  });

  $: {
    if (!isInitialLoad && selectedPort !== previousPort) {
      // Reset loading states
      isLastUpdatedLoading = true;
      isFiscalYearLoading = true;
      waitTimes = {
        allTraffic: createInitialWaitTime(),
        sentri: createInitialWaitTime(),
        readyLane: createInitialWaitTime(),
      };
      borderCrossingStats = createInitialBorderCrossingStats();

      loadData();
      previousPort = selectedPort;
    }
  }

  async function loadData(): Promise<void> {
    isLoadingPortSelection = true;
    try {
      await Promise.all([
        fetchAndUpdateWaitTimes(),
        updateBorderCrossingStats(),
      ]);
    } finally {
      isLoadingPortSelection = false;
    }
  }

  async function fetchAndUpdateWaitTimes(): Promise<void> {
    try {
      const currentData = await fetchCurrentWaitTimes();
      updateCurrentWaitTimes(currentData);
      const sixMonthData = await fetchSixMonthData();
      updateWithSixMonthAverage(sixMonthData, currentData);
    } catch (error) {
      console.error("Error fetching wait times:", error);
      // Implement error handling UI update here
    }
  }

  async function fetchCurrentWaitTimes(): Promise<any[]> {
    const apiUrl =
      "https://us-west1-ssp-all-sites.cloudfunctions.net/waitTimesData";
    const response = await fetch(apiUrl);
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data.data.filter(
      (item: any) => item.port_num === PORT_INFO[selectedPort].number
    );
  }

  async function fetchSixMonthData(): Promise<any[]> {
    const endDate = DateTime.now();
    const startDate = endDate.minus({ months: 6 });
    const apiUrl = constructApiUrl(startDate, endDate);
    const response = await fetch(apiUrl);
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data.data;
  }

  function constructApiUrl(startDate: DateTime, endDate: DateTime): string {
    const baseUrl =
      "https://us-west1-ssp-all-sites.cloudfunctions.net/waitTimesData";
    const params = new URLSearchParams({
      startDate: startDate.toFormat("yyyy-MM-dd"),
      endDate: endDate.toFormat("yyyy-MM-dd"),
      portNum: PORT_INFO[selectedPort].number.toString(),
      rowCount: "1000000",
    });
    return `${baseUrl}?${params.toString()}`;
  }

  function updateCurrentWaitTimes(data: any[]): void {
    LANE_INFO.forEach((info) => {
      const currentData = data.find((item) => item.lane_type === info.laneType);
      if (currentData) {
        const waitTime = Math.round(currentData.delay_seconds / 60);
        waitTimes[info.key].duration = `${waitTime} minutes`;
        waitTimes[info.key].isDurationLoading = false;
        lastUpdated = formatDate(new Date(currentData.daterecorded));
        isLastUpdatedLoading = false;
      } else {
        waitTimes[info.key].duration = "N/A";
        waitTimes[info.key].isDurationLoading = false;
      }
    });
    waitTimes = { ...waitTimes };
  }

  function updateWithSixMonthAverage(
    sixMonthData: any[],
    currentData: any[]
  ): void {
    LANE_INFO.forEach((info) => {
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
        waitTimes[info.key].comparison =
          `${Math.abs(Math.round(percentChange))}%`;
      } else {
        waitTimes[info.key].comparison = "N/A";
      }
      waitTimes[info.key].isComparisonLoading = false;
    });
    waitTimes = { ...waitTimes };
  }

  function calculateSixMonthAverage(data: any[]): number | null {
    if (data.length === 0) return null;
    const sum = data.reduce((acc, item) => acc + item.delay_seconds, 0);
    return Math.round(sum / data.length);
  }

  function formatDate(timestamp: Date): string {
    const date = DateTime.fromJSDate(timestamp).toUTC();
    return date.toFormat("h:mm a MM/dd/yy");
  }

  function calculatePercentChange(
    averageValue: number,
    currentValue: number
  ): number {
    return averageValue !== 0
      ? ((currentValue - averageValue) / averageValue) * 100
      : 0;
  }

  function calculatePreviousFiscalYearDates(): {
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

  async function fetchBTSData(
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

  function calculateCrossings(data: any[]): Record<string, number> {
    const measures: Record<string, string[]> = {
      totalTravelers: [
        "Pedestrians",
        "Personal Vehicle Passengers",
        "Bus Passengers",
      ],
      vehicles: ["Personal Vehicles", "Buses"],
      cargoTrucks: ["Truck Containers Full", "Truck Containers Empty"],
    };

    return Object.entries(measures).reduce(
      (acc, [key, measureList]) => {
        acc[key] = measureList.reduce(
          (sum, measure) =>
            sum +
            data
              .filter((el) => el.measure === measure)
              .reduce((total, el) => total + Number(el.value || 0), 0),
          0
        );
        return acc;
      },
      {} as Record<string, number>
    );
  }

  function formatNumber(num: number | undefined): string {
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

  function updateStatsUI(stats: Record<string, number>): void {
    Object.keys(borderCrossingStats).forEach((key) => {
      const statKey = key as keyof BorderCrossingStats;
      const value = stats[key];
      borderCrossingStats[statKey].value = formatNumber(value);
      borderCrossingStats[statKey].isLoading = false;
    });
    borderCrossingStats = { ...borderCrossingStats };
  }

  async function updateBorderCrossingStats(): Promise<void> {
    try {
      const {
        startDate,
        endDate,
        fiscalYear: fy,
      } = calculatePreviousFiscalYearDates();
      fiscalYear = fy;
      isFiscalYearLoading = false;

      const data = await fetchBTSData(startDate, endDate);
      if (!data || !Array.isArray(data)) {
        throw new Error("Invalid data received from BTS API");
      }
      const stats = calculateCrossings(data);
      updateStatsUI(stats);
    } catch (error) {
      console.error("Error fetching border crossing stats:", error);
      showBorderStatsErrorState();
    }
  }

  function showBorderStatsErrorState(): void {
    Object.keys(borderCrossingStats).forEach((key) => {
      borderCrossingStats[key as keyof BorderCrossingStats] = {
        value: "Error",
        isLoading: false,
      };
    });
    fiscalYear = "Error";
    isFiscalYearLoading = false;
    borderCrossingStats = { ...borderCrossingStats };
  }

  function createInitialWaitTime(): WaitTime {
    return {
      duration: "Loading...",
      isDurationLoading: true,
      comparison: "Loading...",
      isComparisonLoading: true,
    };
  }

  function createInitialBorderCrossingStats(): BorderCrossingStats {
    return {
      totalTravelers: { value: "Loading...", isLoading: true },
      vehicles: { value: "Loading...", isLoading: true },
      cargoTrucks: { value: "Loading...", isLoading: true },
    };
  }
</script>

<main>
  <h1>Border Wait Times</h1>

  <div class="card">
    <h2>Select Location</h2>
    <select bind:value={selectedPort} disabled={isLoadingPortSelection}>
      {#each Object.entries(PORT_INFO) as [value, { name }]}
        <option {value}>{name}</option>
      {/each}
    </select>
  </div>

  <div class="card">
    <h2>Current Wait Times</h2>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Lane Type</th>
            <th>Wait Time</th>
            <th>
              Comparison to Average
              <span
                class="tooltip"
                title="Percentage change compared to the average wait time over the last 6 months."
              >
                <Fa icon={faQuestionCircle} />
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {#each LANE_INFO as { name, key }}
            <tr>
              <td>{PORT_INFO[selectedPort].name} {name}</td>
              <td class="wait-time">
                {#if waitTimes[key].isDurationLoading}
                  Loading...
                {:else}
                  {waitTimes[key].duration}
                {/if}
              </td>
              <td>
                {#if waitTimes[key].isComparisonLoading}
                  Loading...
                {:else if waitTimes[key].comparison !== "N/A"}
                  <span
                    class="comparison {waitTimes[key].comparison.startsWith('-')
                      ? 'decrease'
                      : 'increase'}"
                  >
                    <Fa
                      icon={waitTimes[key].comparison.startsWith("-")
                        ? faCaretDown
                        : faCaretUp}
                    />
                    {waitTimes[key].comparison}
                  </span>
                {:else}
                  N/A
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p class="last-updated">
      Last Updated: {isLastUpdatedLoading ? "Loading..." : lastUpdated}
    </p>
  </div>

  <div class="card">
    <h2>
      FY {isFiscalYearLoading ? "Loading..." : fiscalYear} Border Crossing Statistics
    </h2>
    <div class="stats-grid">
      {#each Object.entries(borderCrossingStats) as [key, { value, isLoading }]}
        <div class="stat-item">
          <p class="stat-label">{key.replace(/([A-Z])/g, " $1").trim()}</p>
          <p class="stat-value">
            {isLoading ? "Loading..." : value}
          </p>
        </div>
      {/each}
    </div>
  </div>
</main>

<style>
  :global(body) {
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    background-color: #f9fafb;
    color: #1f2937;
    line-height: 1.5;
    margin: 0;
    padding: 0;
  }

  main {
    max-width: 1000px;
    margin: 2rem auto;
    padding: 0 1rem;
  }

  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    text-align: center;
    color: #111827;
    margin-bottom: 2rem;
  }

  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 1rem;
  }

  .card {
    background-color: white;
    border-radius: 8px;
    box-shadow:
      0 1px 3px rgba(0, 0, 0, 0.1),
      0 1px 2px rgba(0, 0, 0, 0.06);
    padding: 1.5rem;
    margin-bottom: 2rem;
  }

  select {
    width: 100%;
    padding: 0.5rem;
    font-size: 1rem;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    background-color: white;
    appearance: none;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
    background-position: right 0.5rem center;
    background-repeat: no-repeat;
    background-size: 1.5em 1.5em;
  }

  .table-container {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
  }

  th,
  td {
    padding: 0.75rem 1rem;
    text-align: left;
  }

  th {
    background-color: #f3f4f6;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.75rem;
    color: #6b7280;
  }

  tr:nth-child(even) {
    background-color: #f9fafb;
  }

  .wait-time {
    font-weight: 600;
  }

  .comparison {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.5rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .comparison.increase {
    background-color: #fee2e2;
    color: #991b1b;
  }

  .comparison.decrease {
    background-color: #d1fae5;
    color: #065f46;
  }

  .tooltip {
    cursor: help;
  }

  .last-updated {
    font-size: 0.875rem;
    color: #6b7280;
    margin-top: 1rem;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .stat-item {
    background-color: #f3f4f6;
    padding: 1rem;
    border-radius: 8px;
  }

  .stat-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    margin-bottom: 0.25rem;
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
  }

  @media (max-width: 640px) {
    .stats-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
