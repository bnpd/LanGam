<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<script>
    export let text;
    export let tooltip = '';
    export let htmlClass = undefined;
    let showTooltip = false;
  
  function toggleTooltip() {
    const tmp = showTooltip
    setTimeout(() => { // timeout avoids mouseenter & click events cancelling each other out on touch screens
      showTooltip = !tmp;        
    }, 10);
  }
  </script>
  
  <style>
    .badge {
      display: inline-block;
      position: relative;
      font-size: x-small;
    }
    .badge-style {
      padding: 0.5em 1em;
      color: white;
      border-radius: 1em;
      cursor: pointer;
      transform: translateY(-0.25em);
      box-shadow: var(--box-shadow-light);
      background-color: #007bff;
    }
  
    .tooltip {
      visibility: hidden;
      background-color: black;
      color: #fff;
      text-align: center;
      border-radius: 0.25em;
      padding: 0.5em;
      position: absolute;
      z-index: 100;
      top: 125%; /* Position the tooltip above the badge */
      left: 50%;
      margin-left: -50px;
      width: 200px;
      opacity: 0;
      transition: opacity 0.3s;
    }
  
    .badge:hover .tooltip, .badge:focus .tooltip, .badge:active .tooltip {
      visibility: visible;
      opacity: 1;
    }
  </style>
  
  <div 
    class={"badge " + (htmlClass ?? "badge-style")}
    on:mouseenter={toggleTooltip} 
    on:mouseleave={toggleTooltip}
    on:click={toggleTooltip}
  >
    {text}
    {#if showTooltip}
      <div class="tooltip">
        {tooltip}
      </div>
    {/if}
  </div>