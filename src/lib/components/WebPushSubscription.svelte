<script lang="ts">
import { onMount } from 'svelte';
import { requestNotifications } from './backend';
import { user } from '$lib/stores';

let notificationPermission: NotificationPermission;

onMount(() => {
  notificationPermission = Notification.permission
  if (notificationPermission === 'granted') {
          requestNotifications($user)
    }
});
</script>

{#if notificationPermission === 'default'}
  <button id="btnNotifications" on:click={() => requestNotifications($user).then(() => {notificationPermission = Notification.permission})}>
    Set a reminder
  </button>
{/if}