<script lang="ts">
    import '../global.css';
    import { login, newUserLang, signup } from '$lib/components/backend';
    import { goto } from '$app/navigation';
	import { nativeLang, targetLang, user } from '$lib/stores';
  
    let title = '';
    let body = '';
    let question = '';
  
    async function onSubmit(event: SubmitEvent) {
        const formDataEntries = new FormData(event.target as HTMLFormElement);
        if (formDataEntries.get('password') !== formDataEntries.get('passwordConfirm')) {
            alert("Passwords do not match");
            return;
        }
        try {
            await signup(formDataEntries.get('email')?.toString(), formDataEntries.get('password')?.toString(), formDataEntries.get('native_lang')?.toString())
            $user = (await login(formDataEntries.get('email')?.toString(), formDataEntries.get('password')?.toString())).record.id
            $nativeLang = formDataEntries.get('native_lang')?.toString()
            await newUserLang('pl')
            $targetLang = 'pl'
        
            goto('/catalog')
        } catch (e) {
            console.error(e)
        }
    }
  </script>

<form class="boxBig" on:submit|preventDefault={onSubmit}>
	<h2>Sign Up</h2>
	<input type="email" name="email" placeholder="Email" autocomplete="email" required />
	<input type="password" name="password" placeholder="Password" autocomplete="new-password" required minlength="8"/>
	<input type="password" name="passwordConfirm" placeholder="Confirm Password" autocomplete="new-password" required minlength="8"/>
	<input type="text" list="languages" name="native_lang" placeholder="Preferred Language" autocomplete="language" required/>
    <br>
    <input type="submit">

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
</form>
