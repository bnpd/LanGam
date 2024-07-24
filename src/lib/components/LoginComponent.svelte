<script lang="ts">
    import { getLangById, login, newUserLang, signup } from '$lib/components/backend';
    import { goto } from '$app/navigation';
	import { nativeLang, targetLang, user } from '$lib/stores';
	import { ClientResponseError } from 'pocketbase';
  
    export let isSignup: boolean
  
    async function onSubmit(event: SubmitEvent) {
        const formDataEntries = new FormData(event.target as HTMLFormElement);
        if (isSignup && ! new Set(getDatalistOptions()).has(formDataEntries.get('native_lang')?.toString()!)) {
            showValidationError('native_lang', "Please choose one of the available app languages.", 1500);            
        }
        if (isSignup && formDataEntries.get('password') !== formDataEntries.get('passwordConfirm')) {
            showValidationError('password', "Passwords do not match", 1500);
            return;
        }
        try {
            if (isSignup) {
                await signup(formDataEntries.get('email')?.toString()!, formDataEntries.get('password')?.toString()!, formDataEntries.get('native_lang')?.toString()!)
            }
            let user_obj = (await login(formDataEntries.get('email')?.toString()!, formDataEntries.get('password')?.toString()!)).record
            $user = user_obj.id
            $nativeLang = (await getLangById(user_obj.native_lang)).shortcode.toLowerCase()
            $targetLang = 'pl'
            if (isSignup) {
                await newUserLang('pl')
            }

            goto('/catalog')
        } catch (e) {
            if (!isSignup && e instanceof ClientResponseError) { // login was rejected
                showValidationError('password', 'Email or password are wrong.')
            } else if (isSignup && (e as Error).message.includes('validation_invalid_email')) {// signup email was rejected
                showValidationError('email', 'The email is invalid or already in use.')
            } else {                
                console.error(e)
            }
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

<form class="boxBig" on:submit|preventDefault={onSubmit}>
	<h2>
        {isSignup ? 'Welcome :)' : 'Welcome back =)'}
    </h2>
    <a href={isSignup ? "/login" : "signup"}>{isSignup ? "Already registered? Login here" : "New here? Sign up"}</a>
    <br><br>
	<input type="email" name="email" placeholder="Email" autocomplete="email" id="email" required />
	<input type="password" name="password" placeholder="Password" autocomplete="new-password" id="password" required minlength="8"/>
    {#if isSignup}
        <input type="password" name="passwordConfirm" placeholder="Confirm Password" autocomplete="new-password" required minlength="8"/>
        <input type="text" list="languages" name="native_lang" placeholder="Preferred Language" autocomplete="language" id="native_lang" required/>
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
    <input type="submit" value={isSignup ? "Register" : "Login"}>
</form>
