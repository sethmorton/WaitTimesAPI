<script lang="ts">
  import { onMount } from "svelte";
  import Fa from "svelte-fa";
  import {
    faCaretUp,
    faCaretDown,
    faQuestionCircle,
  } from "@fortawesome/free-solid-svg-icons";
  import { DateTime } from "luxon";
  import './styles.css';
  import type {
    LaneInfo,
    WaitTime,
    WaitTimes,
    PortInfo,
    BorderCrossingStats,
  } from "$lib/types";
  import { Tooltip } from "@svelte-plugins/tooltips";

  import { PORT_INFO, LANE_INFO } from "$lib/constants";

  let selectedPort: keyof typeof PORT_INFO = "sanYsidro";
  let previousPort: keyof typeof PORT_INFO = selectedPort;
  let isInitialLoad = true;
  let isLoadingPortSelection = false;
  import {
    createInitialWaitTime,
    createInitialBorderCrossingStats,
    formatDate,
    calculatePercentChange,
    calculateSixMonthAverage,
    calculatePreviousFiscalYearDates,
    calculateCrossings,
    formatNumber,
  } from "$lib/utils";
  import {
    fetchCurrentWaitTimes,
    fetchSixMonthData,
    fetchBTSData,
    constructWaitTimesApiUrl,
    constructBtsRequest,
  } from "$lib/api";
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

  const loadData = async (): Promise<void> => {
    isLoadingPortSelection = true;
    try {
      await Promise.all([
        fetchAndUpdateWaitTimes(),
        updateBorderCrossingStats(),
      ]);
    } finally {
      isLoadingPortSelection = false;
    }
  };

  const fetchAndUpdateWaitTimes = async (): Promise<void> => {
    try {
      const currentData = await fetchCurrentWaitTimes(PORT_INFO[selectedPort]);
      updateCurrentWaitTimes(currentData);
      const sixMonthData = await fetchSixMonthData(PORT_INFO[selectedPort]);
      updateWithSixMonthAverage(sixMonthData, currentData);
    } catch (error) {
      console.error("Error fetching wait times:", error);
      // Implement error handling UI update here
    }
  };

  const constructApiUrl = (startDate: DateTime, endDate: DateTime): string => {
    const baseUrl =
      "https://us-west1-ssp-all-sites.cloudfunctions.net/waitTimesData";
    const params = new URLSearchParams({
      startDate: startDate.toFormat("yyyy-MM-dd"),
      endDate: endDate.toFormat("yyyy-MM-dd"),
      portNum: PORT_INFO[selectedPort].number.toString(),
      rowCount: "1000000",
    });
    return `${baseUrl}?${params.toString()}`;
  };

  const updateCurrentWaitTimes = (data: any[]): void => {
    LANE_INFO.forEach((info) => {
      const currentData = data.find((item) => item.lane_type === info.laneType);
      if (currentData) {
        const waitTime = Math.round(currentData.delay_seconds / 60);
        waitTimes[info.key].duration = `${waitTime} minutes`;
        waitTimes[info.key].isDurationLoading = false;
        lastUpdated = DateTime.fromISO(currentData.date).toUTC().toFormat("h:mm a MM/dd/yy 'PST'");
        isLastUpdatedLoading = false;
      } else {
        waitTimes[info.key].duration = "N/A";
        waitTimes[info.key].isDurationLoading = false;
      }
    });
    waitTimes = { ...waitTimes };
  };

  const updateWithSixMonthAverage = (
    sixMonthData: any[],
    currentData: any[]
  ): void => {
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
  };

  const updateStatsUI = (stats: Record<string, number>): void => {
    Object.keys(borderCrossingStats).forEach((key) => {
      const statKey = key as keyof BorderCrossingStats;
      const value = stats[key];
      borderCrossingStats[statKey].value = formatNumber(value);
      borderCrossingStats[statKey].isLoading = false;
    });
    borderCrossingStats = { ...borderCrossingStats };
  };

  const updateBorderCrossingStats = async (): Promise<void> => {
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
  };

  const showBorderStatsErrorState = (): void => {
    Object.keys(borderCrossingStats).forEach((key) => {
      borderCrossingStats[key as keyof BorderCrossingStats] = {
        value: "Error",
        isLoading: false,
      };
    });
    fiscalYear = "Error";
    isFiscalYearLoading = false;
    borderCrossingStats = { ...borderCrossingStats };
  };
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
            <th class="comparison-header">
              <Tooltip content="Percentage change compared to the average wait time over the last 6 months.">
                <span class="tooltip-trigger">Comparison to Average <Fa icon={faQuestionCircle} /></span>
              </Tooltip>
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
</main>


<style>
  .tooltip-container {
    position: relative;
    display: inline-block;
    margin-left: 0.25rem;
  }
  
  .tooltip-trigger {
    cursor: help;
    display: inline-block;
  }
  
  .tooltip-content {
    position: fixed; /* Escape the DOM hierarchy of restrictive containers */
    top: 40%; /* Adjust this value as needed */
    left: 50%; /* Center horizontally */
    transform: translate(-50%, -50%);
    background-color: #000;
    color: #fff;
    text-align: left;
    border-radius: 6px;
    padding: 0.75rem;
    width: 250px;
    z-index: 9999; /* Ensure it's on top */
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition: opacity 0.3s ease-in-out, visibility 0.3s ease-in-out;
  }
  
  .tooltip-container:hover .tooltip-content {
    opacity: 1;
    visibility: visible;
  }
  
  .tooltip-arrow {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 0.5rem solid transparent;
    border-right: 0.5rem solid transparent;
    border-top: 0.5rem solid #000;
  }
  </style>