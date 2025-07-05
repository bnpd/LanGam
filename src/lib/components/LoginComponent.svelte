<script lang="ts" defer>
    import { getGamesByLang, getLang, getLangById, login, loginWithGoogle, newUserLang, signup } from '$lib/components/backend';
    import { goto } from '$app/navigation';
	import { failedWords, inlineChatHistory, nativeLang, reviews, targetLang, username } from '$lib/stores';
	import { ClientResponseError } from 'pocketbase';
	import TitleWithBackgroundImageComponent from './TitleWithBackgroundImageComponent.svelte';
	import { onMount } from 'svelte';
	import SignInWithGoogleButton from './SignInWithGoogleButton.svelte';
  
    export let isSignup: boolean
    let loading: boolean
    let loginWithGoogleMode = false
    let formElement: HTMLFormElement

    onMount(()=>{
        if ($username){
            goto('/options', {replaceState: true})
        }
    })
  
    async function onSubmit(_event: SubmitEvent) {
        const formDataEntries = new FormData(formElement);
        let nl = formDataEntries.get('native_lang')?.toString() || ''
        let tl = getTargetLangFromSubdomain()
        
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
                    formDataEntries.get('password')?.toString()!,
                    nl
                )
            }
            let user_obj = (await login(formDataEntries.get('email')?.toString()!, formDataEntries.get('password')?.toString()!)).record
            if (user_obj.id != $username) {
                $failedWords = new Set()
                $reviews = []
                $inlineChatHistory = []
                $username = user_obj.id
            }
            $nativeLang = nl || (await getLangById(user_obj.native_lang)).shortcode
            $targetLang = isSignup ? (await newUserLang(tl)).lang : await getLang(tl)

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
        const formDataEntries = new FormData(formElement);
        if (isSignup && !formDataEntries.get('acceptConditions')) {
            showValidationError('acceptConditions', "This is required.", 1500);
            return;
        }
        let nl = formDataEntries.get('native_lang')?.toString() || ''
        let tl = getTargetLangFromSubdomain()
        try {
            loading = true

            let oauthResult = await loginWithGoogle((await getLang(nl)).id)

            isSignup = oauthResult.meta!.isNew
            let user_obj = oauthResult.record
            if (user_obj.id != $username) {
                $failedWords = new Set()
                $reviews = []
                $inlineChatHistory = []
                $username = user_obj.id
            }
            $nativeLang = nl || (await getLangById(user_obj.native_lang)).shortcode
            $targetLang = isSignup ? (await newUserLang(tl)).lang : await getLang(tl)

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

    // function getDatalistOptions() {
    //     const options = (document.getElementById('languages') as HTMLDataListElement)?.options;
    //     return Array.from(options).map(option => option.value);
    // }
  

	function getTargetLangFromSubdomain() {
		let tl = location?.host.split('.')[0]
        if (tl?.length != 2) {
            tl = 'en'
        }
        return tl
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
            {#if !isSignup || !loginWithGoogleMode}
                <input type="email" name="email" placeholder="Email" autocomplete="email" id="email" required />
                <br>
                <input type="password" name="password" placeholder="Password" autocomplete="new-password" id="password" required minlength="8"/>
            {/if}
            {#if isSignup}
                {#if !loginWithGoogleMode}
                    <br>
                    <input type="password" name="passwordConfirm" placeholder="Confirm Password" autocomplete="new-password" required minlength="8"/><br>
                {/if}
                <input type="text" list="languages" name="native_lang" placeholder="See translations in:" autocomplete="language" id="native_lang" required/><br>
                <datalist id="languages">
                    <option value="en">English</option>
                    <option value="th">Thai</option>
                    <option value="pl">Polish</option>
                    <!--<option value="de">German</option>
                    <option value="fr">French</option>
                    <option value="es">Spanish</option>
                    <option value="it">Italian</option>
                    <option value="pt">Portuguese</option>
                    <option value="ru">Russian</option>
                    <option value="zh">Chinese</option>
                    <option value="ja">Japanese</option>
                    <option value="ko">Korean</option>
                    <option value="ar">Arabic</option>
                    <option value="hi">Hindi</option>
                    <option value="bn">Bengali</option>
                    <option value="tr">Turkish</option>
                    <option value="vi">Vietnamese</option>
                    <option value="id">Indonesian</option>
                    <option value="nl">Dutch</option>
                    <option value="sv">Swedish</option>
                    <option value="no">Norwegian</option>
                    <option value="fi">Finnish</option>
                    <option value="da">Danish</option>
                    <option value="hu">Hungarian</option>
                    <option value="cs">Czech</option>
                    <option value="ro">Romanian</option>
                    <option value="el">Greek</option>
                    <option value="bg">Bulgarian</option>
                    <option value="uk">Ukrainian</option>
                    <option value="he">Hebrew</option>
                    <option value="fa">Persian</option>
                    <option value="ur">Urdu</option>
                    <option value="sw">Swahili</option>
                    <option value="tl">Tagalog</option>
                    <option value="ms">Malay</option>
                    <option value="ta">Tamil</option>
                    <option value="te">Telugu</option>
                    <option value="ml">Malayalam</option>
                    <option value="kn">Kannada</option>
                    <option value="gu">Gujarati</option>
                    <option value="pa">Punjabi</option>
                    <option value="mr">Marathi</option>
                    <option value="bn">Bengali</option>
                    <option value="si">Sinhala</option>
                    <option value="my">Burmese</option>
                    <option value="km">Khmer</option>
                    <option value="lo">Lao</option>
                    <option value="mn">Mongolian</option>
                    <option value="hy">Armenian</option>
                    <option value="az">Azerbaijani</option>
                    <option value="kk">Kazakh</option>
                    <option value="uz">Uzbek</option>
                    <option value="tg">Tajik</option>
                    <option value="ky">Kyrgyz</option>
                    <option value="tk">Turkmen</option>
                    <option value="ps">Pashto</option>
                    <option value="sd">Sindhi</option>
                    <option value="ne">Nepali</option>
                    <option value="as">Assamese</option>
                    <option value="or">Odia</option>-->
                </datalist>
                <div style="width: 190px; margin: auto;">
                    <input type="checkbox" name="acceptConditions" id="acceptConditions">
                    <label for="acceptConditions">I accept the <a href="/terms">Terms of Use</a> and the <a href="/privacy">Privacy Policy</a>.</label>
                </div>
            {/if}
            <br>
            {#if isSignup && loginWithGoogleMode}
                <SignInWithGoogleButton on:click={onLoginWithGoogle}/>
            {:else}
                <input class="loginButton" type="submit" value={isSignup ? "Register 🪄" : "Login 🪄"} disabled={loading}>
            {/if}
            {#if loading}
                <div class:loading/>
            {/if}
        </form>
    </div>
    {#if isSignup && !loginWithGoogleMode}
        <div style="margin: 4%;">or</div>
        <SignInWithGoogleButton on:click={() => loginWithGoogleMode = true}/>
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
