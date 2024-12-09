<script lang="ts">
	import { goto } from "$app/navigation";
	import { getUserData, sendFeedback } from "$lib/components/backend";
	import NavbarComponent from "$lib/components/NavbarComponent.svelte";
	import TitleWithBackgroundImageComponent from "$lib/components/TitleWithBackgroundImageComponent.svelte";
	import Toast from "$lib/components/Toast.svelte";
    import '../global.css'

    let feedbackText = ''
    let contactConsent: boolean = true
    let email: string = getUserData()?.email
    let toast: string
    let submittedCurrentInput: boolean = !email

    async function submit() {
        if (!navigator.onLine) {
            toast = 'Cannot send, offline.'
            return
        }        
        return sendFeedback(feedbackText, contactConsent ? email : undefined)
        .then(()=>{
            toast = 'Feedback sent! Thanks!'
            submittedCurrentInput = true
            feedbackText = ''
        }).catch(e=>{
            if (e.data?.data?.email?.code == 'validation_invalid_email') {
                toast = 'Email address is not valid.'
            }
        })
    }
</script>

<TitleWithBackgroundImageComponent>
    LanGam language requests and mailing list
</TitleWithBackgroundImageComponent>
<form class="card" style="background-color: wheat; display: flex; flex-direction: column;">
    <div style="position: relative;">
        <label for="iFeedback">Comment (optional)</label>
        <div 
            contenteditable 
            id="iFeedback" 
            data-placeholder="... want to request a language or a feature? I'd love to hear it!" 
            bind:innerText={feedbackText}
            on:input={()=>submittedCurrentInput=false}
        />
    </div>
    <br>
    <div>
        <input name="iContactConsent" bind:checked={contactConsent} type="checkbox" on:click={()=>submittedCurrentInput=false}> 
        <label for="iContactConsent">I would like to be notified about new languages and features.</label>
    </div>
    {#if contactConsent}
        <br>
        <input type="text" bind:value={email} placeholder="email@email.com" on:input={()=>submittedCurrentInput=false}>
    {/if}
    <button on:click={submit} disabled={submittedCurrentInput || (!feedbackText.trim().length && !contactConsent)}>Submit</button>
</form>
<Toast bind:message={toast}/>
<NavbarComponent>
  <button on:click={()=>goto('/game')}>◄ Back to LanGam</button>
</NavbarComponent>