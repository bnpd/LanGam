<script lang="ts" defer>
    import '../global.css';
	import TitleWithBackgroundImageComponent from '$lib/components/TitleWithBackgroundImageComponent.svelte';
	import NavbarComponent from '$lib/components/NavbarComponent.svelte';
	import { isGrammarHighlightingOn, srShowGenus, srShowIPA, ttsSpeed } from '$lib/stores';
	import AccountDeletionComponent from '$lib/components/AccountDeletionComponent.svelte';
	import { getUserData } from '$lib/components/backend';
	import FeedbackComponent from '$lib/components/FeedbackComponent.svelte';
    import { isLoggedIn } from '$lib/components/backend';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { PUBLIC_POCKETBASE_URL } from '$env/static/public';

onMount(() => {
// Check if the user is logged in
if (!isLoggedIn()) {
    setTimeout(() => {
        // Wait for 0.1 second before redirecting
        goto('/login');
    }, 100);
}
});
</script>

<svelte:head>
    <title>Options - LanGam CYOA - language learning "choose you own adventure" game</title>
    <meta name="description" content='Options for LanGam CYOA - language learning "choose you own adventure" game.'>
    <link rel="preconnect" href={PUBLIC_POCKETBASE_URL}>
</svelte:head>

<TitleWithBackgroundImageComponent>Options</TitleWithBackgroundImageComponent>
<div style="overflow-y: auto; border-radius: 1em;">
    <div class="card">
        <h4>Account</h4>
        <div class="setting">
            <label for="email">Email</label>&nbsp;&nbsp;
            <input type="email" name="email" id="email" disabled value={getUserData()?.email}>
        </div>
        <div class="setting">
            <AccountDeletionComponent />
            <button on:click={()=>{localStorage.clear(); window.location.replace('/login')}}>Log Out</button>
        </div>
    </div>
    <div class="card">
        <h4>Speech</h4>
        <div class="setting">
            <label for="ttsSpeed">Speech Output Pace</label>
            <span class="slider">
                <label for="ttsSpeed">{$ttsSpeed}</label>
                <input type="range" name="ttsSpeed" id="ttsSpeed" min=0.25 max=1.5 step=0.125 list="ttsSpeedValues" bind:value={$ttsSpeed} on:input={e=>{onInput(e.currentTarget)}}>
            </span>
        </div>
    </div>
    <div class="card">
        <h4>Grammar</h4>
        <div class="setting">
            <input type="checkbox" name="isGrammarHighlightingOn" id="isGrammarHighlightingOn" bind:checked={$isGrammarHighlightingOn}>&nbsp;
            <label for="isGrammarHighlightingOn">Highlight current grammar concept in the text</label>
        </div>
    </div>
    <div class="card">
        <h4>Spaced Repetition</h4>
        <div class="setting">
            <input type="checkbox" name="srShowIPA" id="srShowIPA" bind:checked={$srShowIPA}>&nbsp;
            <label for="srShowIPA">Show pronunciation 🗣 on cards</label>
        </div>
        <div class="setting">
            <input type="checkbox" name="srShowGenus" id="srShowGenus" bind:checked={$srShowGenus}>&nbsp;
            <label for="srShowGenus">Show noun's gender on cards</label>
        </div>
    </div>
    <div class="card">
        <h4>About</h4>
        <div>
            ©2024 Benjamin Paddags <br>
            Contact: ben@langam.app
        </div>
        
        <a href="https://blog.langam.app">LanGam Blog</a><br>
        <a href="/terms">Terms</a><br>
        <a href="/privacy">Privacy Policy</a>
    </div>
</div>
<NavbarComponent>
    <button on:click={()=>{history.back()}}>◄ Back</button>
    <FeedbackComponent/>
</NavbarComponent>

<datalist id="ttsSpeedValues">
    <option value=0.25></option>
    <option value=0.5></option>
    <option value=0.75></option>
    <option value=1></option>
    <option value=1.25></option>
    <option value=1.5></option>
</datalist>

<style>
    hr {
        margin: 1.5em 0;
    }
    .setting {
        margin: 1.5em 0;
    }
    .setting:has(> input[type="text"]) {
        display: flex;
        align-items: baseline;
    }
    .slider {
        display: inline-block;
        display: inline-flex;
        flex-grow: 1;
    }
    .slider input {
        flex-grow: 1;
        margin-top: 0;
    }
    .slider label {
        display: inline-block;
        font-weight: bold;
        padding: 0 5px;
        width: 2.5em;
        text-align: end;
    }
</style>
