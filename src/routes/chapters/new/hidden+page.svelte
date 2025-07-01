<script lang="ts">
  import AddChapterComponent from '$lib/components/AddChapterComponent.svelte';
  import { page } from '$app/stores';

  let selectedGame = '';

  $: if ($page.url.searchParams.has('game')) {
    selectedGame = $page.url.searchParams.get('game');
  }
</script>

<AddChapterComponent bind:selectedGame />