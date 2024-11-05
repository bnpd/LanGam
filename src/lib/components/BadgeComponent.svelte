<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<script>
	import TooltipComponent from "./TooltipComponent.svelte";

    export let text;
    export let tooltip = '';
    export let backgroundColor = '#007bff'
  </script>
  
  <style>
    .badge {
      padding: 0.5em 1em;
      color: white;
      border-radius: 1em;
      cursor: pointer;
      box-shadow: var(--box-shadow-light);
      background-color: #007bff;
      font-size: x-small;
    }

    .badge-container {
      display: inline-block;
      transform: translateY(-0.15em);
    }
  </style>

<div class='badge-container'>
  {#if tooltip}
  <TooltipComponent>
    <span slot='anchor' class="badge" style={'background-color: '+backgroundColor}>{text}</span>
    <span slot='tooltip'>{tooltip}</span>
  </TooltipComponent>
  {:else}
  <span class="badge" style={'background-color: '+backgroundColor}>{text}</span>
  {/if}
</div>
