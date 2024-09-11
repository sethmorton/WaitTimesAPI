<script>
  import { onMount } from "svelte";
  import SwaggerUI from "swagger-ui";
  import "swagger-ui/dist/swagger-ui.css";
  import { spec } from "$lib/swaggerSpec.js";

  /** @type {HTMLElement} */
  let swaggerUIContainer;

  onMount(() => {
    SwaggerUI({
      spec: spec,
      domNode: swaggerUIContainer,
      deepLinking: true,
      presets: [SwaggerUI.presets.apis, SwaggerUI.SwaggerUIStandalonePreset],
      layout: "BaseLayout",
      syntaxHighlight: {
        activated: true,
        theme: "agate",
      },
    });
  });
</script>

<div class="container">
  <div bind:this={swaggerUIContainer}></div>
</div>
