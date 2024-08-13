<script lang="ts">
import { onMount } from 'svelte';
import { requestNotifications } from './backend';

let notificationPermission: NotificationPermission;
let done = false;
export let loading: boolean;
$: if (!loading && notificationPermission === 'granted' && !done) requestNotifications()

onMount(async () => {
  notificationPermission = Notification.permission
});
</script>

{#if notificationPermission === 'default'}
  <button id="btnNotifications" on:click={() => requestNotifications().then(() => {
    notificationPermission = Notification.permission; 
    done = true
  })}>
    Reminder
  </button>
{/if}