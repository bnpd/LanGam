<script lang="ts" defer>
    import '../global.css';
	import config from '../../config';
	import TitleWithBackgroundImageComponent from '$lib/components/TitleWithBackgroundImageComponent.svelte';
	import NavbarComponent from '$lib/components/NavbarComponent.svelte';
	import { srShowGenus, srShowIPA, ttsSpeed } from '$lib/stores';
	import AccountDeletionComponent from '$lib/components/AccountDeletionComponent.svelte';
	import { getUserData } from '$lib/components/backend';

    function onInput(el: HTMLInputElement) {

    }
</script>

<svelte:head>
    <title>Options - LanGam CYOA - language learning "choose you own adventure" game</title>
    <meta name="description" content='Options for LanGam CYOA - language learning "choose you own adventure" game.'>
    <link rel="preconnect" href={config.pocketbase}>
</svelte:head>

<TitleWithBackgroundImageComponent>Options</TitleWithBackgroundImageComponent>
<div class="card">
    <h4>Speech</h4>
    <div class="setting">
        <label for="ttsSpeed">Speech Output Pace</label>
        <span class="slider">
            <label for="ttsSpeed">{$ttsSpeed}</label>
            <input type="range" name="ttsSpeed" id="ttsSpeed" min=0.25 max=1.5 step=0.125 list="ttsSpeedValues" bind:value={$ttsSpeed} on:input={e=>{onInput(e.currentTarget)}}>
        </span>
    </div>
    <hr>
    <h4>Spaced Repetition</h4>
    <div class="setting">
        <input type="checkbox" name="srShowIPA" id="srShowIPA" bind:checked={$srShowIPA}>&nbsp;
        <label for="srShowIPA">Show pronunciation 🗣 on cards</label>
    </div>
    <div class="setting">
        <input type="checkbox" name="srShowGenus" id="srShowGenus" bind:checked={$srShowGenus}>&nbsp;
        <label for="srShowGenus">Show noun's gender on cards</label>
    </div>
    <hr>
    <h4>Account</h4>
    <div class="setting">
        <label for="email">Email</label>&nbsp;&nbsp;
        <input type="email" name="email" id="email" disabled value={getUserData()?.email}>
    </div>
    <div class="setting">
        <AccountDeletionComponent />
    </div>
    <hr>
    <h4>About</h4>
    <div>
        ©2024 Benjamin Paddags <br>
        Contact: ben@langam.app
    </div>
    <a href="/terms">Terms</a><br>
    <a href="/privacy">Privacy Policy</a>

</div>
<NavbarComponent>
    <button on:click={()=>{history.back()}}>◄ Back</button>
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
        display: flex;
        align-items: baseline;
        margin: 1.5em 0;
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
