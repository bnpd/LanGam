<script lang="ts" defer>
    let umami: any; // Umami is initialized in the +layout.svelte from script tag

    let deferredPrompt: any;
  
    let installButtonVisible = false;
    
    async function handleInstallClick() {
      window.umami?.track('Install Button');
      if (deferredPrompt) {
        // Show the install prompt
        deferredPrompt.prompt();
        // Wait for the user's response
        const { outcome } = await deferredPrompt.userChoice;
        window.umami?.track(`Install ${outcome}`);
        // Clear the deferred prompt variable
        deferredPrompt = null;
        // Hide the install button after the prompt
        installButtonVisible = false;
      }
    }

</script>
<svelte:window on:beforeinstallprompt={event=>{
    // Store the event so it can be triggered later
    deferredPrompt = event;
    installButtonVisible = true;
}} />
{#if installButtonVisible}
  <button id="btnInstall" on:click={handleInstallClick}>Install</button>  
{/if}