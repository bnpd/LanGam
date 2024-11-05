<script lang="ts" defer>
    import { getLang, login, newUserLang, signup } from '$lib/components/backend';
    import { goto } from '$app/navigation';
	import { failedWords, inlineChatHistory, nativeLang, reviews, targetLang, username } from '$lib/stores';
	import { ClientResponseError } from 'pocketbase';
	import TitleWithBackgroundImageComponent from './TitleWithBackgroundImageComponent.svelte';
  
    export let isSignup: boolean
    let loading: boolean
  
    async function onSubmit(event: SubmitEvent) {
        const formDataEntries = new FormData(event.target as HTMLFormElement);
        // if (isSignup && ! new Set(getDatalistOptions()).has(formDataEntries.get('native_lang')?.toString()!)) {
        //     showValidationError('native_lang', "Please choose one of the available app languages.", 1500);            
        // }
        if (isSignup && formDataEntries.get('password') !== formDataEntries.get('passwordConfirm')) {
            showValidationError('password', "Passwords do not match", 1500);
            return;
        }
        try {
            loading = true
            if (isSignup) {
                await signup(formDataEntries.get('email')?.toString()!, formDataEntries.get('password')?.toString()!, 'en'/*formDataEntries.get('native_lang')?.toString()!*/)
            }
            let user_obj = (await login(formDataEntries.get('email')?.toString()!, formDataEntries.get('password')?.toString()!)).record
            if (user_obj.id != $username) {
                $failedWords = new Set()
                $reviews = []
                $inlineChatHistory = []
                $username = user_obj.id
            }
            $nativeLang = 'en'/*(await getLangById(user_obj.native_lang)).shortcode.toLowerCase()*/
            $targetLang = isSignup ? (await newUserLang('pl')).lang : await getLang('pl') // temporary solution until we figure out multilang

            goto('/game') //goto('/catalog')
        } catch (e) {
            if (!isSignup && e instanceof ClientResponseError) { // login was rejected
                showValidationError('password', 'Email or password are wrong.')
            } else if (isSignup && (e as Error).message.includes('validation_invalid_email')) {// signup email was rejected
                showValidationError('email', 'The email is invalid or already in use.')
            } else if (isSignup && (e as Error).message.includes('validation_is_email')) {// signup email format invalid
                showValidationError('email', 'Please check the format of this email address.')
            } else {   
                showValidationError('submit', 'Connection error, please try again.')
            }
        } finally {
            loading = false
        }
    }

    function showValidationError(elementId: string, errorMessage: string, duration: number = 2000) {
            // Set a custom validation message (while it is defined, validation counts as failed)
            let mailEl = (document.getElementById(elementId) as HTMLInputElement)
            mailEl?.setCustomValidity(errorMessage);
            mailEl?.reportValidity();
            setTimeout(() => { // reset to possibly valid validity
                mailEl?.setCustomValidity('');
            }, duration);        
    }

    function getDatalistOptions() {
        const options = (document.getElementById('languages') as HTMLDataListElement)?.options;
        return Array.from(options).map(option => option.value);
    }
  </script>

<TitleWithBackgroundImageComponent>{isSignup ? 'Welcome :)' : 'Welcome back =)'}</TitleWithBackgroundImageComponent>
<div style="text-align: center">
    <form class="card" on:submit|preventDefault={onSubmit}>
        <input type="email" name="email" placeholder="Email" autocomplete="email" id="email" required />
        <br>
        <input type="password" name="password" placeholder="Password" autocomplete="new-password" id="password" required minlength="8"/>
        {#if isSignup}
            <br>
            <input type="password" name="passwordConfirm" placeholder="Confirm Password" autocomplete="new-password" required minlength="8"/>
            <!-- <input type="text" list="languages" name="native_lang" placeholder="Preferred Language" autocomplete="language" id="native_lang" required/> -->
            <datalist id="languages">
                <option value="en">English</option>
                <!--
                <option value="ar">Arabic</option>
                <option value="zh">Chinese</option>
                <option value="nl">Dutch</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="hi">Hindi</option>
                <option value="it">Italian</option>
                <option value="ja">Japanese</option>
                <option value="ko">Korean</option>
                <option value="pl">Polish</option>
                <option value="pt">Portuguese</option>
                <option value="ru">Russian</option>
                <option value="es">Spanish</option>
                <option value="tr">Turkish</option>
                -->
            </datalist>
        {/if}
        <br>
        <input id="submit" type="submit" value={isSignup ? "Register" : "Login"} disabled={loading}>
        {#if loading}
            <div class:loading/>
        {/if}
    </form>
    <br>
    {#if isSignup}
        <p>Already registered?</p>
        <a href="/login" style:width="fit-content">Go to login</a>
    {:else}
        <p>New here?</p>
        <a href="/signup" style:width="fit-content">Register</a>
    {/if}
</div>
