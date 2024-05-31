<script lang="ts">
import { onMount } from 'svelte';
import { requestNotifications } from './backend';

let notificationSupported = false;
let notificationPermission: NotificationPermission;
  
export let user;

onMount(() => {
  notificationPermission = Notification.permission
  if (notificationPermission === 'granted') {
          requestNotifications(user)
    }
});
</script>

{#if notificationPermission === 'default'}
  <button id="btnNotifications" on:click={() => requestNotifications(user).then(() => {notificationPermission = Notification.permission})}>
    Set a reminder
  </button>
{/if}