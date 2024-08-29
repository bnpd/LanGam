<script lang="ts" defer>
    import WebPushSubscription from './WebPushSubscription.svelte';
    import { user } from '$lib/stores';
	import { goto } from '$app/navigation';
	import Install from './Install.svelte';
	import NavbarComponent from './NavbarComponent.svelte';
	import FeedbackComponent from './FeedbackComponent.svelte';
	import ReadNChatComponent from './ReadNChatComponent.svelte';
	import TtsComponent from './TtsComponent.svelte';
	import TitleWithBackgroundImageComponent from './TitleWithBackgroundImageComponent.svelte';

    let tts: TtsComponent
</script>

<TitleWithBackgroundImageComponent>Automated Language Learning AI</TitleWithBackgroundImageComponent>
<ReadNChatComponent tts={tts}></ReadNChatComponent>
<NavbarComponent>
    <button on:click={()=>goto("/catalog")}>Texts</button>
    <TtsComponent bind:this={tts}/>
    <Install/>
    <FeedbackComponent />
    {#if $user}
        <button on:click={()=>goto("/lists")}>My vocab</button>
        <WebPushSubscription/>
    {:else}
        <button on:click={()=>goto("/signup")}><b>Sign up 👤</b></button>
    {/if}
</NavbarComponent>