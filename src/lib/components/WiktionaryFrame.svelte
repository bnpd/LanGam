<script lang="ts">
	import { pushState } from "$app/navigation";
	import { targetLang } from "$lib/stores";
    import { onMount } from 'svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

    let iframe: HTMLIFrameElement;
    let wordHistory: string[] = []
    export let word: string | undefined
    
    $: if (word) injectContentIntoIframe(word);
    
    export const goBack = () => {
        if (wordHistory.length == 1) return false
        word = wordHistory.pop()
        return true
    }

    // Function to fetch content from Wiktionary API
    async function fetchWiktionaryPage(term: string): Promise<string> {
        const data = await (await fetch(`https://en.m.wiktionary.org/w/api.php?action=parse&page=${term}&mobileformat=true&format=json&origin=*`)).json();
        if (data?.parse?.text?.['*']) {
            return data.parse.text['*']; // Get the HTML content
        } else if (data?.error?.code == "missingtitle" && term.charAt(0).toUpperCase() == term.charAt(0)) {
            // page not found and term is capitalized. Try non-capitalized instead.
            const data2 = await (await fetch(`https://en.m.wiktionary.org/w/api.php?action=parse&page=${term.toLowerCase()}&mobileformat=true&format=json&origin=*`)).json();
            if (data2?.parse?.text?.['*']) {
                return data2.parse.text['*'];
            }
        }

        dispatch('wordNotFound');
        return 'No dictionary entry availabe, sorry.'
    }

    // Function to inject content into iframe via srcdoc
    async function injectContentIntoIframe(term: string): Promise<void> {
        const content = await fetchWiktionaryPage(term);

        // HTML content with link intercepting script
        const iframeContent = `
            <html>
            <head>
                <link rel="stylesheet" href="https://www.wiktionary.org/w/load.php?lang=en&amp;modules=ext.wikimediaBadges%7Cext.wikimediamessages.styles%7Cmediawiki.hlist%7Cmobile.init.styles%7Cskins.minerva.base.styles%7Cskins.minerva.categories.styles%7Cskins.minerva.codex.styles%7Cskins.minerva.content.styles.images%7Cskins.minerva.icons.wikimedia%7Cskins.minerva.mainMenu.icons%2Cstyles&amp;only=styles&amp;skin=minerva">
                <link rel="stylesheet" href="https://www.wiktionary.org/w/load.php?lang=en&amp;modules=ext.gadget.LanguagesAndScripts%2CPalette%2CSite&amp;only=styles&amp;skin=minerva">
                <link rel="stylesheet" href="https://www.wiktionary.org/w/load.php?lang=en&amp;modules=site.styles&amp;only=styles&amp;skin=minerva">
            </head>
            <body data-language="${$targetLang.nameEN}" class="mediawiki ltr sitedir-ltr mw-hide-empty-elt ns-0 ns-subject mw-editable page-tle rootpage-tle stable issues-group-B skin-minerva action-view skin--responsive mw-mf-amc-disabled mw-mf minerva-animations-ready">
                <div id="mw-mf-viewport">
                    <div id="mw-mf-page-center">
                        <main class="mw-body">
                            <div id="content" class="content">
                                ${content}
                            </div>
                        </main>
                        <footer id="main-footer" class="mw-footer minerva-footer" role="contentinfo">
                    </div>
                </div>
                <script src="scripts/iframe-script.js"></` + `script>
            </body>
            </html>
        `;

        // Set iframe srcdoc with the content
        if (iframe) {
            iframe.srcdoc = iframeContent;
        }
    }

    // Listen for postMessage from iframe
    function handleIframeMessage(event: MessageEvent): void {
        const { term, extractedCards } = event.data;
        if (term) {
            wordHistory.push(word)
            pushState('', {}) // just to enable go back button
            word = term
        }    
        if (extractedCards) {
            dispatch('extractedCards', {cards: extractedCards})
        }    
    }

    // onMount lifecycle hook to initialize
    onMount(() => {
        window.addEventListener('message', handleIframeMessage);
        wordHistory = [word]

        return () => {
            // Clean up the event listeners on destroy
            window.removeEventListener('message', handleIframeMessage);
        };
    });
</script>

<style>
    iframe {
        max-height: 75dvh;
		flex-grow: 1;
    }
</style>

<iframe bind:this={iframe} title="{word} - Wiktionary" on:popstate|stopPropagation></iframe>
