<script lang="ts">
	import Popup from "./Popup.svelte";
    import { getUserData, sendFeedback } from '$lib/components/backend'
	import Toast from "./Toast.svelte";

    let isOpen = false
    let feedbackText = ''
    let contactConsent: boolean = getUserData()?.email?.length
    let email: string = getUserData()?.email
    let toast: string
    let textRejectOffline: string

    async function onPopupClosed() {
        if (!navigator.onLine) {
            toast = ''
            textRejectOffline = ''
            toast = 'Cannot send, offline.'
            textRejectOffline = 'Close.'
            return
        }
        isOpen = !isOpen
        if (feedbackText) {
            await sendFeedback(feedbackText, email)
            toast = 'Feedback sent! Thanks!'
            feedbackText = ''
        }        
    }
</script>

{#if isOpen}
    <Popup on:closed={onPopupClosed} closeButtonText={feedbackText ? 'Submit' : 'Close'}>
        <h1>The future of this app is in your hands. Thanks!</h1>
        <div contenteditable id="iFeedback" data-placeholder="Best app ever, but here are 99 things I hate: ...." bind:innerText={feedbackText}/>
        <input name="iContactConsent" bind:checked={contactConsent} type="checkbox"> <label for="iContactConsent">I would like to get a response to my feedback.</label>
        {#if contactConsent}
            <br>
            <input type="text" bind:value={email} placeholder="email@email.com">
        {/if}
        <br>
    </Popup>
{:else}
    <button id="btnFeedback" on:click={() => {isOpen = !isOpen}}>
        Feedback
    </button>
{/if}
<Toast message={toast} textReject={textRejectOffline} onReject={()=> isOpen = false}/>