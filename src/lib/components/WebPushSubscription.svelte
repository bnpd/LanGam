<script lang="ts">
import { onMount } from 'svelte';
import { requestNotifications } from './backend';
import { user } from '$lib/stores';

let notificationPermission: NotificationPermission;

onMount(() => {
  notificationPermission = Notification.permission
  if (notificationPermission === 'granted') {
          requestNotifications()
    }
});
</script>

{#if notificationPermission === 'default'}
  <button id="btnNotifications" on:click={() => requestNotifications().then(() => {notificationPermission = Notification.permission})}>
    Reminder
  </button>
{/if}