<script>
	import CatalogComponent from '$lib/components/CatalogComponent.svelte';
  import '../global.css';
  import config from '../../config.js';
</script>

<svelte:head>
	<title>Catalog - Automated Language Learning AI</title>
  <meta name="description" content="Catalog of all our texts - learn languages the fun way: talk about texts with AI.">
  <link rel="preconnect" href={config.backend}>
</svelte:head>

<CatalogComponent />
