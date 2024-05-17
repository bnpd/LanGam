'use strict'
import DocumentC from './lib/DocumentC.js'
import { backendPost, backendGet, requestNotifications } from './lib/backend.js'
import TranslatableText from './lib/TranslatableText.js'

// debug in DEV browser: http://localhost/?u=pl1&tl=pl&nl=en

// register Service Worker for PWA
if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker.register('/sw.js')
		.then((reg) => {
			console.log('Service worker registered.', reg)
		})
	})
}
var divTask, emValidationError, answbtn, solutionField, loginbox, contentbox, iRating, btnSound
var currentTask=undefined
var phase = "promting" // or "solutionShown"
var failedWords = new Set()
const answbtnTxtWhilePrompting = "Show solution"
const answbtnTxtWhileSolutionShown = "Next question"
const answbtnTxtWhileDone = 'Learn new words'
const NON_CLICKABLE_POS_IDS = new Set([97, 99, 101])
let urlparams = new URLSearchParams(window.location.search)
var user = urlparams.get('u'), target_lang=urlparams.get('tl'), native_lang=urlparams.get('nl'), method=urlparams.get('mtd') // temporary solution only use url params for user languages
var voice = null
var sound = true
const TTS_SPEED = 0.8

// Initialize
window.addEventListener("load", init)
function init() {
	loginbox = document.getElementById("loginbox")
	contentbox = document.getElementById('contentbox')
	emValidationError = document.getElementById('emValidationError')
	if (!user) { // overwrite stored user if user provided in url
		user = localStorage.getItem('username')
		target_lang = localStorage.getItem('target_lang')
		native_lang = localStorage.getItem('native_lang')
		method = localStorage.getItem('method')
	} else {
		target_lang = target_lang.toLowerCase()
		native_lang = native_lang.toLowerCase()
		localStorage.setItem('username', user)
		localStorage.setItem('target_lang', target_lang)
		localStorage.setItem('native_lang', native_lang)
		localStorage.setItem('method', method)
	}
	document.getElementById("btnRetryConnection").addEventListener("click", () => { // submit on button press
		location.reload()
	})
	if (!user) {
		showLoginPrompt('Sorry, your link seems to be defective, please ask Benjamin for a new one 💥🔗')
		return
	}

	loginbox.style.display = 'none'
	contentbox.style.removeProperty('display')

	divTask = document.getElementById('divTask')
	answbtn = document.getElementById("answbtn")
	btnSound = document.getElementById('btnSound')
	solutionField = document.getElementById("solutionField")
	answbtn.className = 'loading-indicator'
	answbtn.addEventListener("click", () => {
		if (phase === "promting") {
			showSolution()
			if (sound) {
				try_speak((currentTask.title.text + '\n' + currentTask.text.text).replace(/\xa0/g, '')) // remove nbsp just in case its a problem
			}
		} else if (phase === "solutionShown") {
			divTask.style.visibility="hidden"
			solutionField.innerText = ''
			answbtn.className = 'loading-indicator'
			sendReview(failedWords)
			.then(() => {
				failedWords.clear()
				divTask.scrollTop = 0
				solutionField.scrollTop = 0
				getTask()
			})
		} else if (phase === "done") {
			answbtn.className = 'loading-indicator'
			requestNewWords()
		}
	})
	// Set sound variable and toggle icon from localStorage if previously saved
	sound = localStorage.getItem('sound') ? JSON.parse(localStorage.getItem('sound')) : sound
	btnSound.innerText = sound ? '🔊' : '🔈'
	btnSound.addEventListener('click', () => {
		sound = ! sound
		localStorage.setItem('sound', sound)
		btnSound.innerText = sound ? '🔊' : '🔈'
	})

	// run setVoice when voices are loaded (onvoiceschanged)
	if (
	  typeof speechSynthesis !== "undefined" &&
	  speechSynthesis.onvoiceschanged !== undefined
	) {
	  speechSynthesis.onvoiceschanged = setVoice
	}
	if (speechSynthesis.getVoices() && speechSynthesis.getVoices().length) {
		setVoice()  // if we were too slow and the voice has already been set before speechSynthesis.onvoiceschanged = setVoice, just call setVoice immediately
	}

	divTask.addEventListener('scroll', function() {
		syncScroll(divTask, solutionField);
	});

	
	getTask(urlparams.get('doc'))
}

function setVoice() {
	console.log(speechSynthesis.getVoices())
    const separator = speechSynthesis.getVoices()[0].lang.includes('-') ? '-' : '_'
	let voices_in_lang = speechSynthesis.getVoices().filter(voice=>{return voice.lang.split(separator)[0].big()===target_lang.big()})
	if (voices_in_lang.length!==0) {
		voice = voices_in_lang[0]
	}
}

function try_speak(str) {
	if (voice != null) {
		let utterance = new SpeechSynthesisUtterance(str)
		utterance.voice = voice
		utterance.lang = voice.lang
		utterance.rate = TTS_SPEED
		console.log(voice)
		speechSynthesis.speak(utterance)
	}
}


function showLoginPrompt(validation_error=false) {
	loginbox.style.display = 'block'
	contentbox.style.display = 'none'
	if (validation_error) {
		emValidationError.style.visibility = 'visible'
		emValidationError.innerText = validation_error
	} else {
		emValidationError.style.visibility = 'hidden'
	}
}


function showSolution() {
	solutionField.removeAttribute('style')
	phase = "solutionShown"
	answbtn.innerHTML = answbtnTxtWhileSolutionShown
}


/**
 * Set a document as the currently shown task
 * @param {DocumentC} doc Document cnotaining the task
 */
function setTask(doc) {
	currentTask = doc // save in global to be accessible in answbtn eventListener (for tts)


	divTask.textContent = '' // delete previous task
	divTask.style.visibility="visible"
	phase = "promting"
	answbtn.innerHTML = answbtnTxtWhilePrompting
	for (const translatableText of [doc.title, doc.text]) {
		let p = document.createElement('p')		
		let char_index = 0	
		for (const start_char in translatableText.tokens) {
			let span = document.createElement("span")
			while (char_index < start_char) { // insert whitespace and newlines
				if (translatableText.text[char_index] == '\n' && p.childElementCount > 0) {
					// next paragraph
					divTask.appendChild(p)
					p = document.createElement('p')
				} else {
					p.append(' ')
				}
				char_index++
			}
			// now we are where we should be, so can insert new span with token

			let token_obj = translatableText.tokens[char_index]
			let token_word = token_obj?.word
			if (!token_word) {
				console.log(char_index);
				console.log(translatableText.tokens);
			}

			if (!token_word.trim()) continue // only proceed if it wasn't only some kind of whitespace
			span.textContent = token_word
			//span.style.marginRight="0.5em"
			p.appendChild(span)
			char_index += token_word.length

			if (!NON_CLICKABLE_POS_IDS.has(token_obj.pos)) {
				span.className = 'pointer span-'+token_word
				span.addEventListener("click", () => {
					if (failedWords.has(token_word)) {
						failedWords.delete(token_word)
						Array.from(document.getElementsByClassName('span-'+token_word)).forEach(each => {
							each.style.color = ""
							Array.from(document.getElementsByClassName('a-'+token_word)).forEach(eachA => { // remove corresponding dictionary links for all occurrences of the word
								eachA.parentElement.removeChild(eachA)
							})
						})
					} else {
						if (sound) {
							try_speak(token_word)
						}
						failedWords.add(token_word)
						Array.from(document.getElementsByClassName('span-'+token_word)).forEach(each => {
							each.style.color = "red"
							let aDict = document.createElement('a')
							aDict.innerHTML = '📕'
							aDict.className = 'a-'+token_word
							aDict.addEventListener("click", () => {
								window.open('langki://word/?w='+token_word)
								//window.open('https://translate.google.com/?sl='+target_lang+'&tl='+native_lang+'&text='+token,'popup','width=600,height=800')
							})
							each.parentElement.insertBefore(aDict, each)
						})
					}
				})
			}
		}
		divTask.appendChild(p)
	}
}


function noTask() {
	phase = 'done'
	currentTask = null
	divTask.textContent = 'Done for today 🤓'
	divTask.style.visibility="visible"
	solutionField.innerText = ''
	answbtn.innerHTML = answbtnTxtWhileDone
}


function setSolution(solution) {
	solution = solution.replace('\r', '').replace('\n\n', '\n')
	answbtn.removeAttribute('disabled', '')
	solutionField.style.visibility="hidden"

	let row = 1
	solution.split('\n').map(paragraph => {
		if (!paragraph.trim()) return // if it was only some kind of whitespace, don't bother
		const p = document.createElement('p')
		p.style.gridRow = row
		p.innerText = paragraph
		solutionField.appendChild(p)
		row++
	});
}


/**
 * Send user marked words to backend
 * @param failedWords Words user marked in current task
 * @returns {Promise<unknown>} Promise that is resolved when send was successful
 */
function sendReview(failedWords){
	return new Promise((resolve, _reject) => {
		let review = {docId: currentTask.docId, failedTokens: [...failedWords]}
		backendPost('/review/'+user, review, resolve)
		// TODO: on reject or timeout, save review to localStorage an retry regularly and on next app open
	})
}


function getTask(docId){
	backendGet(docId ? `/task/${user}/${docId}` : `/due_task/${user}`, responseText => {
		answbtn.className = ''

		if (!responseText) {
			noTask()
		} else {
			let doc = null
			try { 
				let json = JSON.parse(responseText)
				console.log(json);
				doc = DocumentC.fromJson(json)
			} catch (error) {
				console.log(error)
			}

			setTask(doc)
			//getSolution()
			setSolution(doc.title.translations[native_lang] + '\n\n' + doc.text.translations[native_lang])
		}
	}, showLoginPrompt)
	if (!docId) {
		window.history.pushState({}, document.title, "/" ); // remove URL param docId since we are no longer in that document (otherwise would've been param to this function)
	}
}

function requestNewWords() {
	backendGet('/new_words/'+user, () => getTask(), showLoginPrompt)
}

// Push Notifications
var btnNotifications
window.addEventListener('load', function () {
    btnNotifications = document.getElementById('btnNotifications')
    if (Notification.permission === 'default') {
        btnNotifications.removeAttribute('hidden')
		document.getElementById('pNotifications').removeAttribute('hidden')
        btnNotifications.addEventListener('click', () => requestNotifications(user).then(() => btnNotifications.setAttribute('hidden', true)))
    } else if (Notification.permission === 'granted') {
		requestNotifications(user).then(() => btnNotifications.setAttribute('hidden', true))
	}
})


// scroll sync from divTask to solutionField

function syncScroll(source, target) {
	// find all paragraphs contained in the text in source and target
    var sourceParagraphs = source.querySelectorAll('p');
    var targetParagraphs = target.querySelectorAll('p');

    // Find the current paragraph index in the source div
    var currentIndex = findCurrentParagraphIndex(source.scrollTop, sourceParagraphs, source);

    // Scroll the target div to the same paragraph index
    target.scrollTop = targetParagraphs[currentIndex].offsetTop-targetParagraphs[0].offsetTop;
 }

// Function to find the index of the current paragraph based on scroll position
function findCurrentParagraphIndex(scrollTop, paragraphs, parentEl) {
    for (var i = 0; i < paragraphs.length; i++) {
      if (paragraphs[i].offsetTop-paragraphs[0].offsetTop >= scrollTop-0.5*parentEl.offsetHeight) {
        return i;
      }
    }
    return 0; // Default to the first paragraph if not found
}

