<script lang="ts" defer>
    import { login, loginWithGoogle, newUserLang, signup } from '$lib/components/backend';
    import { goto } from '$app/navigation';
	import { reviews, nativeLang, username } from '$lib/stores';
	import { ClientResponseError } from 'pocketbase';
	import TitleWithBackgroundImageComponent from './TitleWithBackgroundImageComponent.svelte';
	import { onMount } from 'svelte';
	import SignInWithGoogleButton from './SignInWithGoogleButton.svelte';
    import { PUBLIC_LANG } from '$env/static/public';
    import { page } from '$app/stores';
    let umami: any; // Umami is initialized in the +layout.svelte from script tag
  
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
                $username = user_obj.id
                if (user_obj.native_lang) {
                    $nativeLang = user_obj.native_lang
                } else {
                    $nativeLang = undefined
                }
            } else if (!$nativeLang && user_obj.native_lang) { // same user, but his lang preference was lost
                $nativeLang = user_obj.native_lang
            }
            if (isSignup) await newUserLang(PUBLIC_LANG)

            window.umami?.track((isSignup ? 'Signup' : 'Login'), {id: $username, method: 'password'})
            let advanceLevelAfterSignup = new URLSearchParams(window.location.search).get('advanceLevelAfterSignup')
            goto('/game' + (advanceLevelAfterSignup ? `?advanceLevelAfterSignup=${advanceLevelAfterSignup}` : ''))
        } catch (e) {
            if (!isSignup && e instanceof ClientResponseError) { // login was rejected
                showValidationError('password', 'Email or password are wrong.')
            } else if (isSignup && (e as ClientResponseError).data?.data?.email?.code === 'validation_is_email') {// signup email was rejected
                showValidationError('email', 'This is not a valid email.')
            } else if (isSignup && (e as ClientResponseError).status === 409) {// signup email was rejected
                showValidationError('email', 'The email is already in use.')
            } else {   
                showValidationError('submit', 'Connection error, please try again.')
            }
        } finally {
            loading = false
        }
    }
  
    async function onLoginWithGoogle() {
        // Add a focus event listener in case user does not complete the login (cause loginWithGoogle will not return immediately)
        const unsetLoadingOnFocusReturn = () => {
            if (loading) loading = false;
            window.removeEventListener('focus', unsetLoadingOnFocusReturn);
        };

        try {
            loading = true
            window.addEventListener('focus', unsetLoadingOnFocusReturn);

            let oauthResult = await loginWithGoogle();

            window.removeEventListener('focus', unsetLoadingOnFocusReturn);


            isSignup = oauthResult.meta!.isNew
            let user_obj = oauthResult.record
            if (user_obj.id != $username) { // switched user
                $reviews = []
                $username = user_obj.id
                if (user_obj.native_lang) {
                    $nativeLang = user_obj.native_lang
                } else {
                    $nativeLang = undefined
                }
            } else if (!$nativeLang && user_obj.native_lang) { // same user, but his lang preference was lost
                $nativeLang = user_obj.native_lang
            }
            if (isSignup) await newUserLang(PUBLIC_LANG)

            window.umami?.track((isSignup ? 'Signup' : 'Login'), {id: $username, method: 'google'})
            let advanceLevelAfterSignup = new URLSearchParams(window.location.search).get('advanceLevelAfterSignup')
            goto('/game' + (advanceLevelAfterSignup ? `?advanceLevelAfterSignup=${advanceLevelAfterSignup}` : ''))
        } catch (e) {
            window.removeEventListener('focus', unsetLoadingOnFocusReturn);
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

<TitleWithBackgroundImageComponent height='40dvh'><span style="height: 15dvh; line-height: 20dvh; font-size: xxx-large; overflow: hidden;">
    {isSignup ? 'Welcome' : 'Welcome back'}
</span></TitleWithBackgroundImageComponent>
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
