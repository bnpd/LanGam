<script lang="ts" defer>
	import Popup from "./Popup.svelte";
	import { player } from "$lib/stores";

    let isOpen = false

    function toggleIsOpen() {
        isOpen = !isOpen
    }
</script>

{#if isOpen}
    <Popup on:closed={toggleIsOpen} closeButtonText="Done">
        <h1>Stats and Powers</h1>
        <table>
            <tr><th>Stat</th><th>Strength</th></tr>
            {#each Object.keys($player.stats) as stat}
                {#if !stat.includes('_approval')} <!-- We do not want to show secret stats (?) -->
                    <tr>
                        <td>{stat}</td>
                        <td>{$player.stats[stat]}</td>
                        {#if stat == 'magic' && $player.stats[stat] > 0}
                            <td><button>Specialize</button></td>
                        {/if}
                    </tr>
                {/if}
            {/each}
            <tr><th>Power</th><th>Uses available</th></tr>
            {#each Object.keys($player.powers) as power}
                <tr><td>{power}</td><td>{$player.powers[power]}</td><td><button>Use</button></td></tr>
            {/each}
        </table>
        <br>
    </Popup>
{:else}
    <button id="btnPowers" on:click={toggleIsOpen}>
        🪄
    </button>
{/if}
