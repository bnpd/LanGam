<script lang="ts" defer>
    import { getLang, login, loginWithGoogle, newUserLang, signup } from '$lib/components/backend';
    import { goto } from '$app/navigation';
	import { failedWords, inlineChatHistory, nativeLang, reviews, targetLang, username } from '$lib/stores';
	import { ClientResponseError } from 'pocketbase';
	import TitleWithBackgroundImageComponent from './TitleWithBackgroundImageComponent.svelte';
	import { onMount } from 'svelte';
	import SignInWithGoogleButton from './SignInWithGoogleButton.svelte';
  
    export let isSignup: boolean
    let loading: boolean

    onMount(()=>{
        if ($username){
            goto('/options', {replaceState: true})
        }
    })
  
    async function onSubmit(event: SubmitEvent) {
        const formDataEntries = new FormData(event.target as HTMLFormElement);
        // if (isSignup && ! new Set(getDatalistOptions()).has(formDataEntries.get('native_lang')?.toString()!)) {
        //     showValidationError('native_lang', "Please choose one of the available app languages.", 1500);            
        // }
        if (isSignup && formDataEntries.get('password') !== formDataEntries.get('passwordConfirm')) {
            showValidationError('password', "Passwords do not match", 1500);
            return;
        }
        if (isSignup && !formDataEntries.get('acceptConditions')) {
            showValidationError('acceptConditions', "This is required.", 1500);
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

            try {umami.track((isSignup ? 'Signup' : 'Login'), {id: $username, method: 'password'})} catch (_undef) {}
            let advanceLevelAfterSignup = new URLSearchParams(window.location.search).get('advanceLevelAfterSignup')
            goto('/game?gameId=4sdspc36rwuf05e' + (advanceLevelAfterSignup ? `&advanceLevelAfterSignup=${advanceLevelAfterSignup}` : '')) //goto('/game') //goto('/catalog') // hardcoding gameId is kinda very risky
        } catch (e) {            
            if (!isSignup && e instanceof ClientResponseError) { // login was rejected
                showValidationError('password', 'Email or password are wrong.')
            } else if (isSignup && (e as Error).status === 409) {// signup email was rejected
                showValidationError('email', 'The email is invalid or already in use.')
            } else {   
                showValidationError('submit', 'Connection error, please try again.')
            }
        } finally {
            loading = false
        }
    }
  
    async function onLoginWithGoogle() {
        try {
            loading = true

            let oauthResult = await loginWithGoogle('b8vcwfwnqigh9yr'/*'en'*/)

            isSignup = oauthResult.meta!.isNew
            let user_obj = oauthResult.record
            if (user_obj.id != $username) {
                $failedWords = new Set()
                $reviews = []
                $inlineChatHistory = []
                $username = user_obj.id
            }
            $nativeLang = 'en'/*(await getLangById(user_obj.native_lang)).shortcode.toLowerCase()*/
            $targetLang = isSignup ? (await newUserLang('pl')).lang : await getLang('pl') // temporary solution until we figure out multilang

            try {umami.track((isSignup ? 'Signup' : 'Login'), {id: $username, method: 'google'})} catch (_undef) {}
            let advanceLevelAfterSignup = new URLSearchParams(window.location.search).get('advanceLevelAfterSignup')
            goto('/game?gameId=4sdspc36rwuf05e' + (advanceLevelAfterSignup ? `&advanceLevelAfterSignup=${advanceLevelAfterSignup}` : '')) //goto('/game') //goto('/catalog') // hardcoding gameId is kinda very risky
        } catch (e) {
            showValidationError('submit', 'Connection error, please try again.')
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

    // function getDatalistOptions() {
    //     const options = (document.getElementById('languages') as HTMLDataListElement)?.options;
    //     return Array.from(options).map(option => option.value);
    // }
  </script>

<style>
    label {font-size: small;}
    .loginButton {
        border-radius: 100px;
        background-color: white;
        font-weight: bold;
        color: black;
        box-shadow: none;
        border-color: black;
        border-width: 1px;
    }
</style>

<TitleWithBackgroundImageComponent height='40dvh'><h2 style="height: 15dvh; line-height: 20dvh; font-size: xxx-large; overflow: hidden;">
    {isSignup ? 'Welcome' : 'Welcome back'}
</h2></TitleWithBackgroundImageComponent>
<div style="text-align: center">
    <div class="card" style="--padding-card: 10%; margin-left: 5vw; margin-right: 5vw;">
        <form on:submit|preventDefault={onSubmit}>
            <input type="email" name="email" placeholder="Email" autocomplete="email" id="email" required />
            <br>
            <input type="password" name="password" placeholder="Password" autocomplete="new-password" id="password" required minlength="8"/>
            {#if isSignup}
                <br>
                <input type="password" name="passwordConfirm" placeholder="Confirm Password" autocomplete="new-password" required minlength="8"/><br>
                <!-- <input type="text" list="languages" name="native_lang" placeholder="Preferred Language" autocomplete="language" id="native_lang" required/><br> -->
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
                <div style="width: 190px; margin: auto;">
                    <input type="checkbox" name="acceptConditions" id="acceptConditions">
                    <label for="acceptConditions">I accept the <a href="/terms">Terms of Use</a> and the <a href="/privacy">Privacy Policy</a>.</label>
                </div>
            {/if}
            <br>
            <input class="loginButton" type="submit" value={isSignup ? "Register 🪄" : "Login 🪄"} disabled={loading}>
            {#if loading}
                <div class:loading/>
            {/if}
        </form>
    </div>
    <div style="margin: 4%;">or</div>
    <SignInWithGoogleButton on:click={onLoginWithGoogle}/>
    <div style="margin-top: 1em;">
        {#if isSignup}
            <p>Already registered?</p>
            <a href="/login" style:width="fit-content">Go to login</a>
        {:else}
            <p>New here?</p>
            <a href="/signup" style:width="fit-content">Register</a>
        {/if}
    </div>
</div>
