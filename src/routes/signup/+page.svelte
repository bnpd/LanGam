<script lang="ts">
    import '../global.css';
    import { signup } from '$lib/components/backend';
    import { goto } from '$app/navigation';
  
    let title = '';
    let body = '';
    let question = '';
  
    async function onSubmit(event: SubmitEvent) {
        const formDataEntries = new FormData(event.target as HTMLFormElement);
        if (formDataEntries.get('password') !== formDataEntries.get('passwordConfirm')) {
            alert("Passwords do not match");
            return;
        }
        signup(formDataEntries.get('email')?.toString(), formDataEntries.get('password')?.toString())

        goto('/catalog')
    }
  </script>

<form class="boxBig" on:submit|preventDefault={onSubmit}>
	<h2>Sign Up</h2>
	<input type="email" name="email" placeholder="Email" autocomplete="email" required />
	<input type="password" name="password" placeholder="Password" autocomplete="new-password" required />
	<input type="password" name="passwordConfirm" placeholder="Confirm Password" autocomplete="new-password" required />
    <input type="submit">
</form>
