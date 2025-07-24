<script lang="ts" defer>
import { onMount } from 'svelte';
import { requestNotifications } from './backend';
import { loadingTask, username } from '$lib/stores';
	import { goto } from '$app/navigation';

let notificationPermission: NotificationPermission;
let done = false;
$: if (!$loadingTask && notificationPermission === 'granted' && !done) requestNotifications()

onMount(async () => {
  notificationPermission = Notification.permission
});
</script>

{#if notificationPermission === 'default'}
  <button id="btnNotifications" on:click={() => {
    if (!$username) {
      goto('/signup')
      return
    }
    requestNotifications().then(() => {
      notificationPermission = Notification.permission; 
      done = true
    })}
  }>
    <slot>Reminder</slot>
  </button>
{/if}