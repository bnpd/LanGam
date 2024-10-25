<script lang="ts">
	import { dictionaryWord } from "$lib/stores";
    import { onMount } from 'svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

    let iframe: HTMLIFrameElement;

    $: if ($dictionaryWord) injectContentIntoIframe($dictionaryWord);

    // Function to fetch content from Wiktionary API
    async function fetchWiktionaryPage(term: string): Promise<string> {
        const response = await fetch(`https://en.m.wiktionary.org/w/api.php?action=parse&page=${term}&mobileformat=true&format=json&origin=*`);
        const data = await response.json();
        if (data?.parse?.text?.['*']) {
            return data.parse.text['*']; // Get the HTML content
        } else {
            dispatch('wordNotFound');
            return 'No dictionary entry availabe, sorry.'
        }
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
            <body class="mediawiki ltr sitedir-ltr mw-hide-empty-elt ns-0 ns-subject mw-editable page-tle rootpage-tle stable issues-group-B skin-minerva action-view skin--responsive mw-mf-amc-disabled mw-mf minerva-animations-ready">
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

        extractedData(content);
    }

    // Listen for postMessage from iframe
    function handleIframeMessage(event: MessageEvent): void {
        const { term, extractedCards } = event.data;
        if (term) {
            $dictionaryWord = term
        }    
        if (extractedCards) {
            dispatch('extractedCards', {cards: extractedCards})
        }    
    }

    function extractedData(html:string) {
        
    }

    // onMount lifecycle hook to initialize
    onMount(() => {
        window.addEventListener('message', handleIframeMessage);

        return () => {
            // Clean up the event listener on destroy
            window.removeEventListener('message', handleIframeMessage);
        };
    });
</script>

<style>
    iframe {
        height: 75vh;
		flex-grow: 1;
    }
</style>

<iframe bind:this={iframe} title="{$dictionaryWord} - Wiktionary"></iframe>
