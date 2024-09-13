<script lang="ts">
  import { waitTimes, lastUpdated, isLoadingWaitTimes } from "$lib/stores";
  import { laneInfo, portInfo } from "$lib/constants";
  import Fa from "svelte-fa";
  import {
    faCaretUp,
    faCaretDown,
    faQuestionCircle,
  } from "@fortawesome/free-solid-svg-icons";

  export let selectedPort: string;
</script>

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
        {#each laneInfo as { name, key }}
          <tr>
            <td>{portInfo[selectedPort].name} {name}</td>
            <td class="wait-time"
              >{$isLoadingWaitTimes ? "Loading..." : $waitTimes[key].time}</td
            >
            <td>
              {#if $isLoadingWaitTimes}
                Loading...
              {:else if $waitTimes[key].comparison !== "N/A"}
                <span
                  class="comparison {$waitTimes[key].comparison.startsWith('-')
                    ? 'decrease'
                    : 'increase'}"
                >
                  <Fa
                    icon={$waitTimes[key].comparison.startsWith("-")
                      ? faCaretDown
                      : faCaretUp}
                  />
                  {$waitTimes[key].comparison}
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
    Last Updated: {$isLoadingWaitTimes ? "Loading..." : $lastUpdated}
  </p>
</div>
