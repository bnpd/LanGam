<script lang="ts">
	import { username } from "$lib/stores";
	import { deleteAccount } from "./backend";
	import Popup from "./Popup.svelte";

    let isOpen = false
    let deleteConfirmText: string
</script>

<Popup bind:isOpen closeButtonText="Back">
    <!--Consider suspending your account if you want to keep your progress. Suspended accounts will always be free and we will delete all your data after two years of suspension, unless you log in.-->
    This cannot be undone! Type "delete" to confirm.
    <div>
        <input type="text" name="delete" bind:value={deleteConfirmText}>
        <button style="background-color: pink" disabled={deleteConfirmText?.trim()?.toLowerCase() !== 'delete'} on:click={async ()=>{await deleteAccount($username); localStorage.clear(); window.location.replace('/login')}}>Delete</button>
        <!--<button>Suspend</button>-->
    </div>
</Popup>
{#if !isOpen}
    <button on:click={()=>isOpen = true} style="margin-top: 0;">
        Delete Account
    </button>
{/if}