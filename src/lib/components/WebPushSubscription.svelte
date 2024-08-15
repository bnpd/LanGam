<script lang="ts">
import { onMount } from 'svelte';
import { requestNotifications } from './backend';
import { loadingTask } from '$lib/stores';

let notificationPermission: NotificationPermission;
let done = false;
$: if (!$loadingTask && notificationPermission === 'granted' && !done) requestNotifications()

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