<script lang="ts" defer>
    import { getGamesByLang, getLangById, login, loginWithGoogle, newUserLang, signup } from '$lib/components/backend';
    import { goto } from '$app/navigation';
	import { inlineChatHistory, reviews, targetLang, nativeLang, username } from '$lib/stores';
	import { ClientResponseError } from 'pocketbase';
	import TitleWithBackgroundImageComponent from './TitleWithBackgroundImageComponent.svelte';
	import { onMount } from 'svelte';
	import SignInWithGoogleButton from './SignInWithGoogleButton.svelte';
    import { PUBLIC_LANG } from '$env/static/public';
  
    export let isSignup: boolean
    let loading: boolean
    let formElement: HTMLFormElement

    onMount(()=>{
        if ($username){
            goto('/options', {replaceState: true})
        }
    })
  
    async function onSubmit(_event: SubmitEvent) {
        const formDataEntries = new FormData(formElement);
        
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
                await signup(
                    formDataEntries.get('email')?.toString()!,
                    formDataEntries.get('password')?.toString()!
                )
            }
            let user_obj = (await login(formDataEntries.get('email')?.toString()!, formDataEntries.get('password')?.toString()!)).record
            if (user_obj.id != $username) { // switched user
                $reviews = []
                $inlineChatHistory = []
                $username = user_obj.id
                if (user_obj.native_lang) {
                    $nativeLang = user_obj.native_lang
                } else {
                    $nativeLang = undefined
                }
            } else if (!$nativeLang && user_obj.native_lang) { // same user, but his lang preference was lost
                $nativeLang = user_obj.native_lang
            }
            $targetLang = isSignup ? (await newUserLang(PUBLIC_LANG)).expand.target_lang : await getLangById(PUBLIC_LANG)

            try {umami.track((isSignup ? 'Signup' : 'Login'), {id: $username, method: 'password'})} catch (_undef) {}
            let advanceLevelAfterSignup = new URLSearchParams(window.location.search).get('advanceLevelAfterSignup')
            goto('/game?gameId=' + (await getGamesByLang($targetLang.id))[0].id + (advanceLevelAfterSignup ? `&advanceLevelAfterSignup=${advanceLevelAfterSignup}` : ''))
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

            let oauthResult = await loginWithGoogle()

            isSignup = oauthResult.meta!.isNew
            let user_obj = oauthResult.record
            if (user_obj.id != $username) { // switched user
                $reviews = []
                $inlineChatHistory = []
                $username = user_obj.id
                if (user_obj.native_lang) {
                    $nativeLang = user_obj.native_lang
                } else {
                    $nativeLang = undefined
                }
            } else if (!$nativeLang && user_obj.native_lang) { // same user, but his lang preference was lost
                $nativeLang = user_obj.native_lang
            }
            $targetLang = isSignup ? (await newUserLang(PUBLIC_LANG)).expand.target_lang : await getLangById(PUBLIC_LANG)

            try {umami.track((isSignup ? 'Signup' : 'Login'), {id: $username, method: 'google'})} catch (_undef) {}
            let advanceLevelAfterSignup = new URLSearchParams(window.location.search).get('advanceLevelAfterSignup')
            goto('/game?gameId=' + (await getGamesByLang($targetLang.id))[0].id + (advanceLevelAfterSignup ? `&advanceLevelAfterSignup=${advanceLevelAfterSignup}` : ''))
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
        <form on:submit|preventDefault={onSubmit} bind:this={formElement}>
                <input type="email" name="email" placeholder="Email" autocomplete="email" id="email" required />
                <br>
                <input type="password" name="password" placeholder="Password" autocomplete="new-password" id="password" required minlength="8"/>
            {#if isSignup}
                <br>
                <input type="password" name="passwordConfirm" placeholder="Confirm Password" autocomplete="new-password" required minlength="8"/><br>
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
    {#if isSignup}
        <div style="margin: 4%;">or</div>
        <SignInWithGoogleButton on:click={onLoginWithGoogle}/>
    {:else if !isSignup}
        <div style="margin: 4%;">or</div>
        <SignInWithGoogleButton on:click={onLoginWithGoogle}/>
    {/if}
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
