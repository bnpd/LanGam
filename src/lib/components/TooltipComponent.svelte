<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<script lang="ts">
    let visible = false;

    function toggleVisible(newValue: boolean = !visible) {
        setTimeout(() => { // timeout avoids mouseenter & click events cancelling each other out on touch screens
            visible = newValue;
        }, 10);        
    }
</script>

<style>  
    .tooltip-container {
      position: relative;
    }
    .tooltip {
        font-size: x-small;
        background-color: black;
        opacity: 0.8;
        color: #fff;
        text-align: center;
        border-radius: 0.25em;
        padding: 0.5em;
        position: absolute;
        z-index: 100;
        top: 125%; /* Position the tooltip above the badge */
        left: 50%;
        margin-left: -50px;
        width: 150px;
    }
  
</style>

<div class='tooltip-container' on:click|capture={()=>toggleVisible()} on:mouseenter|capture={()=>toggleVisible(true)} on:mouseleave|capture={()=>toggleVisible(false)}>
    <slot name='anchor'/>
    <div class="tooltip" hidden={!visible}>
        <slot name='tooltip'/>
    </div>
</div>