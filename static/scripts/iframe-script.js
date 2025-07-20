let language = document?.body?.dataset?.language; // Get language from body data attribute set by WiktionaryFrame as data-language attr
const FOOTER_HTML = `
<div class="post-content footer-content">
    <div class="minerva-footer-logo"><img src="https://www.wiktionary.org/static/images/mobile/copyright/wiktionary-wordmark-en.svg" alt="Wiktionary" width="107" height="19" style="width: 6.6875em; height: 1.1875em;"></div>
    <ul id="footer-info" class="footer-info hlist hlist-separated">
        <li id="footer-info-lastmod"> This page was last edited on 3 October 2024, at 21:51.</li>
        <li id="footer-info-copyright">Definitions and other content are available under <a class="external" rel="nofollow" href="https://creativecommons.org/licenses/by-sa/4.0/deed.en">CC BY-SA 4.0</a> unless otherwise noted.</li>
    </ul>
    <ul id="footer-places" class="footer-places hlist hlist-separated">
        <li id="footer-places-privacy"><a href="https://foundation.wikimedia.org/wiki/Special:MyLanguage/Policy:Privacy_policy">Privacy policy</a></li>
        <li id="footer-places-about"><a href="/wiki/Wiktionary:About">About&nbsp;Wiktionary</a></li>
        <li id="footer-places-disclaimers"><a href="/wiki/Wiktionary:General_disclaimer">Disclaimers</a></li>
        <li id="footer-places-wm-codeofconduct"><a href="https://foundation.wikimedia.org/wiki/Special:MyLanguage/Policy:Universal_Code_of_Conduct">Code of Conduct</a></li>
        <li id="footer-places-developers"><a href="https://developer.wikimedia.org">Developers</a></li>
        <li id="footer-places-statslink"><a href="https://stats.wikimedia.org/#/en.wiktionary.org">Statistics</a></li>
        <li id="footer-places-cookiestatement"><a href="https://foundation.wikimedia.org/wiki/Special:MyLanguage/Policy:Cookie_statement">Cookie statement</a></li>
        <li id="footer-places-terms-use"><a href="https://foundation.m.wikimedia.org/wiki/Special:MyLanguage/Policy:Terms_of_Use">Terms of Use</a></li>
        <li id="footer-places-desktop-toggle"><a id="mw-mf-display-toggle" href="//en.wiktionary.org/w/index.php?title=tle&amp;mobileaction=toggle_view_desktop" data-event-name="switch_to_desktop">Desktop</a></li>
    </ul>
</div>
`

// remove everything that's not the section for the targetLang
const section = findNextSectionAfter(document.getElementById(language)) // id = h2-text = NameENOfLang
document.getElementById('content').setHTMLUnsafe(section.outerHTML)
document.getElementById('main-footer').setHTMLUnsafe(FOOTER_HTML)

function findNextSectionAfter(element) {
    let currentElement = element;
    while (currentElement) {
      // Check the next siblings of the current element or its ancestors
      while (currentElement.nextElementSibling) {
        currentElement = currentElement.nextElementSibling;
        if (currentElement.tagName.toLowerCase() === 'section') {
          return currentElement; // Found the next <section>
        }
      }
      // Move to the parent element and repeat the process
      currentElement = currentElement.parentElement;
    }
    // If no <section> is found, return null
    return null;
}

// adapt links to send a message to WiktionaryFrame instead of going to the link target
document.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', function(event) {
        event.preventDefault();
        const newTerm = link.getAttribute('title');
        if (newTerm) {
            parent.postMessage({ term: newTerm }, '*');
        }
    });
});

// extract SrCards and send to WiktionaryFrame by message
parent.postMessage({ extractedCards: extractCards() }, '*');


// extract cards and send them up to WiktionaryFrame
function extractCards() {
    let meanings = []

    for (const ol of document.getElementsByTagName('ol')) {
        // find translation, which is the ol which is next sibling of next sibling of part of speach (POS)
        if (!ol?.previousElementSibling?.previousElementSibling?.firstElementChild)
            continue
        let json = {}
        json.pos = ol.previousElementSibling.previousElementSibling.firstElementChild.innerText
        json.meaning = ol.innerText
        json.flexion = 
            ol.nextElementSibling?.nextElementSibling?.nextElementSibling?.classList.contains('inflection-table') // verbs: third sibiling is the table. nouns/adjectives: second sibling has table as child
            ? ol.nextElementSibling.nextElementSibling.nextElementSibling?.outerHTML
            : ol.nextElementSibling?.nextElementSibling?.querySelector('.inflection-table')?.outerHTML
            ?? '';
        // find element with the gender and plural, which is the ol's previous sibling
        json.genus = ol.previousElementSibling.querySelector('.gender')?.innerText
        json.word = ol.previousElementSibling.querySelector('.headword')?.innerText
        for (const child of ol.previousElementSibling.children) { // alternatively just add the whole previousElementSibling as flexion. No more problems with language specific entries
            // find child with the current word (because user might have navigated to a word other than the popup's currentMatch)
            // find child with plural
            if (child.innerText.includes("plural") && child.nextElementSibling && child.nextElementSibling.innerText) {
                json.flexion+="pl: "+child.nextElementSibling.innerText+"\\n"
            }
            // find child with feminine
            if (child.innerText=="feminine" && child.nextElementSibling && child.nextElementSibling.innerText) {
                json.flexion+="fem: "+child.nextElementSibling.innerText
            }
            // find child with comparative
            if (child.innerText.includes("comparative") && child.nextElementSibling && child.nextElementSibling.innerText) {
                json.flexion+="comp: "+child.nextElementSibling.innerText+"\\n"
            }
            // find child with superlative
            if (child.innerText.includes("superlative") && child.nextElementSibling && child.nextElementSibling.innerText) {
                json.flexion+="sup: "+child.nextElementSibling.innerText+"\\n"
            }
        }
        if (json.flexion.length >= 1) {
            json.flexion=json.flexion.substr(0, json.flexion.length-1) // remove last 4 chars, = trailing newline char
        }
        // add all IPA tags in the whole section to every meaning
        let pronunciations = []
        for (const ipa of document.getElementsByClassName('IPA')) {
            if (ipa?.parentElement?.firstChild?.innerText == 'IPA') {
                pronunciations.push(ipa?.innerText?.replaceAll('/', ''))
            }
        }
        json.pronunciation=pronunciations.join('\n')
        meanings.push(json)
    }
    for (const child of document.children) {
        if (child?.previousElementSibling?.innerText?.includes('Etymology')) {
            meanings.forEach(json => {
                json['Etymology']=child.innerText
            })
        }
    }
    return meanings
}

// Remove possibly copyrighted citations from Wiktionary in case it is not fair use
setTimeout(() => removeElementsByClassName('HQToggle'), 500) // timeout because these elements are not loaded immediately
// Remove edit icons from Wiktionary for less clutter
removeElementsByClassName('mw-editsection')

function removeElementsByClassName(className){
    const elements = document.getElementsByClassName(className);
    while(elements.length > 0){
        elements[0].parentNode.removeChild(elements[0]);
    }
}
