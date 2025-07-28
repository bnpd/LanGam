<script context="module" lang="ts">
	import { PUBLIC_UMAMI_URL } from '$env/static/public';
	import { PUBLIC_UMAMI_WEBSITE_ID } from '$env/static/public';
	import { PUBLIC_UMAMI_SCRIPT_INTEGRITY } from '$env/static/public';
	export declare const umami: any; 
</script>

<svelte:head>
	<script async defer src={`${PUBLIC_UMAMI_URL}/script.js`} data-website-id={PUBLIC_UMAMI_WEBSITE_ID} integrity={PUBLIC_UMAMI_SCRIPT_INTEGRITY} crossorigin="anonymous"></script>
</svelte:head>

<slot default/>
