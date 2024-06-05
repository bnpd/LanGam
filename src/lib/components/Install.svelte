<script lang="ts">
	import { onMount } from "svelte";

    let deferredPrompt: any;
  
    let installButtonVisible = false;
    
    async function handleInstallClick() {
      if (deferredPrompt) {
        // Show the install prompt
        deferredPrompt.prompt();
        // Wait for the user's response
        const { outcome } = await deferredPrompt.userChoice;
        // Clear the deferred prompt variable
        deferredPrompt = null;
        // Hide the install button after the prompt
        installButtonVisible = false;
        // Log the user's response
        console.log(`User response to the install prompt: ${outcome}`);
      }
    }

</script>
<svelte:window on:beforeinstallprompt={event=>{
    // Store the event so it can be triggered later
    deferredPrompt = event;
    installButtonVisible = true;
}} />
<button id="btnInstall" hidden={!installButtonVisible} on:click={handleInstallClick}>Install as app</button>