<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { selectedPort, isLoadingPortSelection } from "$lib/stores";
  import { portInfo } from "$lib/constants";

  const dispatch = createEventDispatcher();

  function handlePortChange() {
    isLoadingPortSelection.set(true);
    dispatch("portChange", { port: $selectedPort });
  }
</script>

<div class="card">
  <h2>Select Location</h2>
  <select
    bind:value={$selectedPort}
    on:change={handlePortChange}
    disabled={$isLoadingPortSelection}
  >
    {#each Object.entries(portInfo) as [value, { name }]}
      <option {value}>{name}</option>
    {/each}
  </select>
</div>
