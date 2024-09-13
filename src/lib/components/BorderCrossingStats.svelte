<script lang="ts">
  import {
    borderCrossingStats,
    fiscalYear,
    isLoadingBorderStats,
  } from "$lib/stores";
</script>

<div class="card">
  <h2>
    FY {$isLoadingBorderStats ? "Loading..." : $fiscalYear} Border Crossing Statistics
  </h2>
  <div class="stats-grid">
    {#each Object.entries($borderCrossingStats) as [key, value]}
      <div class="stat-item">
        <p class="stat-label">{key.replace(/([A-Z])/g, " $1").trim()}</p>
        <p class="stat-value">{$isLoadingBorderStats ? "Loading..." : value}</p>
      </div>
    {/each}
  </div>
</div>
