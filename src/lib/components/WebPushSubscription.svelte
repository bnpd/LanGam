<script>
import { onMount } from 'svelte';
import { requestNotifications } from './backend';

let notificationSupported = false;
let notificationPermission = 'default';
  
export let user;

onMount(() => {
  if (Notification.permission === 'granted') {
          requestNotifications(user)
    }
});
</script>

{#if notificationPermission === 'default'}
  <button id="btnNotifications" on:click={() => requestNotifications(user)}>
    Set a reminder
  </button>
{/if}