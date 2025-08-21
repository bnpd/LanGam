<script lang="ts" defer>
	import { player } from "$lib/stores";
	import { createEventDispatcher } from 'svelte';
	import { updatePlayer } from "./backend";
	import Popup from './Popup.svelte';
    let umami: any; // Umami is initialized in the +layout.svelte from script tag

    let isOpen = false

    const dispatch = createEventDispatcher();

    function toggleIsOpen() {
        isOpen = !isOpen
    }


	function usePower(power: string) {
        //TODO: disable if power already active, disable where not applicable (eg super_memory on a level without chat), keep active for a level forever, not just until nextTask is called)
        $player.powers[power] -= 1
        updatePlayer($player)
		dispatch('use_power', {power})
        toggleIsOpen()
	}
</script>

<Popup closeButtonText="Done" bind:isOpen={isOpen} on:closed={() => {window.umami?.track('Powers closed')}}>
    <h1>Stats and Powers</h1>
    <table>
        <tr><th>Stat</th><th>Strength</th></tr>
        {#if Object.keys($player.stats).length}
            {#each Object.keys($player.stats) as stat}
                {#if !stat.includes('_approval') && !stat.includes('_suspicion')} <!-- We do not want to show secret stats (?) -->
                    <tr>
                        <td>{stat}</td>
                        <td>{$player.stats[stat]}</td>
                        {#if stat == 'magic' && $player.stats[stat] > 0}
                            <td><button>Specialize</button></td>
                        {/if}
                    </tr>
                {/if}
            {/each}
        {:else}
            <em>- None yet -</em>
        {/if}
        <tr><th>Power</th><th>Uses available</th></tr>
        {#if Object.keys($player.powers).length}
            {#each Object.keys($player.powers) as power}
                <tr>
                    <td>{power}</td>
                    <td>{$player.powers[power]}</td>
                    <td>
                        {#if $player.powers[power] > 0}
                        <button on:click={()=>usePower(power)}>Use</button>
                        {/if}
                    </td>
                </tr>
            {/each}
        {:else}
            <em>- None yet -</em>
        {/if}
    </table>
    <br>
</Popup>
{#if !isOpen && (Object.keys($player?.stats ?? {}).length || Object.keys($player?.powers ?? {}).length)}
    <button class="gameNavBtn" on:click={toggleIsOpen} data-umami-event="Powers opened">
        🪄
    </button>
{/if}
