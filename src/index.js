'use strict'
import config from './config.js'
import DocumentC from './DocumentC.js'
import TranslatableText from './TranslatableText.js'

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
var currentTask=''
var phase = "promting" // or "solutionShown"
var failedWords = new Set()
const answbtnTxtWhilePrompting = "Show solution"
const answbtnTxtWhileSolutionShown = "Next question"
const answbtnTxtWhileDone = 'Learn new words'
const preprocessingRegex = /[^\p{L}\p{N}']/gu
let urlparams = new URLSearchParams(window.location.search)
var user = urlparams.get('u'), target_lang=urlparams.get('tl'), native_lang=urlparams.get('nl'), method=urlparams.get('mtd') // temporary solution only use url params for user languages
var voice = null
var sound = true

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

	if (method === 'single') {
		document.getElementById('pMethodExplanation').innerHTML = 'Please tap the current word if you do not know it yet or cannot remember what it means. <span class="out-of-focus">Opaque</span> words are only for context.'
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
				try_speak(currentTask)
			}
		} else if (phase === "solutionShown") {
			divTask.style.visibility="hidden"
			solutionField.innerText = ''
			answbtn.className = 'loading-indicator'
			Promise.all(currentTask.split(' ').map(word => {
				word = word.toLowerCase().replace(preprocessingRegex, '') // preprocess word to remove e.g. adjacent commas and lowercase it. Only unicode letters + ' allowed
				return sendReview(word, failedWords.has(word) ? 1 : 4) // TODO: allow all qualities 0-5
			})).then(() => {
				failedWords.clear()
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

	console.log(native_lang)
	getTask()
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
	let task = doc.title.text + '\n' + doc.text.text
	task = task.replace(/\xa0/g, '') // remove nbsp just in case its a problem here too
	currentTask = task // save in global to be accessible in answbtn eventListener
	divTask.textContent = '' // delete previous task
	divTask.style.visibility="visible"
	phase = "promting"
	answbtn.innerHTML = answbtnTxtWhilePrompting
	let row = 1
	task.split('\n').map(paragraph =>{
		if (!paragraph.trim()) return // if it was only some kind of whitespace, don't bother
		const p = document.createElement('p')		
		paragraph.split(' ').map(word => {
			if (!word.trim()) return // if it was only some kind of whitespace, don't bother
			let span = document.createElement("span")
			span.innerHTML = word+' '
			span.style.marginRight="0.5em"
			p.appendChild(span)
			p.style.gridRow = row
			word = word.toLowerCase().replace(preprocessingRegex, '') // preprocess word to remove e.g. adjacent commas and lowercase it. Only unicode letters + ' allowed

			span.className = 'pointer span-'+word
			span.addEventListener("click", () => {
				if (failedWords.has(word)) {
					failedWords.delete(word)
					Array.from(document.getElementsByClassName('span-'+word)).forEach(each => {
						each.style.color = ""
						Array.from(document.getElementsByClassName('a-'+word)).forEach(eachA => { // remove corresponding dictionary links for all occurrences of the word
							eachA.parentElement.removeChild(eachA)
						})
					})
				} else {
					if (sound) {
						try_speak(word)
					}
					failedWords.add(word)
					Array.from(document.getElementsByClassName('span-'+word)).forEach(each => {
						each.style.color = "red"
						let aDict = document.createElement('a')
						aDict.innerHTML = '📕'
						aDict.className = 'a-'+word
						aDict.addEventListener("click", () => {
							window.open('https://translate.google.com/?sl='+target_lang+'&tl='+native_lang+'&text='+word,'popup','width=600,height=800')
						})
						each.parentElement.insertBefore(aDict, each)
					})
				}
			})
		})
		divTask.appendChild(p)
		row++
	})

}


function noTask() {
	phase = 'done'
	currentTask = ''
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
 * Send reults of user reviewing a word
 * @param word Word that was reviewed
 * @param quality Quality of recall
 * @returns {Promise<unknown>} Promise that is resolved when send was successful
 */
function sendReview(word, quality){
	return new Promise((resolve, _reject) => {
		backendGet('/review/'+user+'/'+word+'/'+quality, resolve, "Error sending your results")
	})
}


// function getSolution(){
// 	solutionField.className = 'loading-indicator'
// 	answbtn.setAttribute('disabled', "")
// 	backendGet('/current_solution/'+user, responseText => {
// 		let translation = null
// 		try { // for single word method where a word in the task has to be focused
// 			let json = JSON.parse(responseText)
// 			translation = json.title + '\n\n' + json.text
// 		} catch (error) {
// 			console.log(error)
// 		}
// 		console.log(translation)
// 		setSolution(translation)
// 	}, 'Error loading the solution')
// }


function getTask(){
	backendGet('/due_task/'+user, responseText => {
		answbtn.className = ''

		if (!responseText) {
			noTask()
		} else {
			let doc = null
			try { // for single word method where a word in the task has to be focused
				let json = JSON.parse(responseText)
				doc = DocumentC.fromJson(json)
			} catch (error) {
				console.log(error)
			}

			setTask(doc)
			//getSolution()
			setSolution(doc.title.translations[native_lang] + '\n\n' + doc.text.translations[native_lang])
		}
	}, "Error loading the task")
}

function requestNewWords() {
	backendGet('/new_words/'+user, () => getTask(), "Sorry, there was an error while looking for new words for you")
}


function backendGet(path, callback, error_msg) {
	var xhr = new XMLHttpRequest()
	xhr.onreadystatechange = function xhrHandler() {
		if (xhr.readyState != 4) {
			return
		}
		if (xhr.status == 200) {
			callback(xhr.responseText)
		} else if (xhr.responseText.includes('User does not exist')) {
			showLoginPrompt('Sorry, user seems not to exist 😶‍🌫')
		} else {
			try { // backend returned 404
				showLoginPrompt('Sorry, there is a network communications problem 🗣️🙉\nTry again in a sec')
			} catch (Exception) { // backend return other error
				if (error_msg) {
					window.alert(error_msg + ': ' + xhr.responseText)
				}
			}
		}
	}
	xhr.open("GET", config.backend + path, true)
	xhr.send(null)
}


// Push Notifications
var btnNotifications
window.addEventListener('load', function () {
    btnNotifications = document.getElementById('btnNotifications')
    if (Notification.permission === 'default') {
        btnNotifications.removeAttribute('hidden')
		document.getElementById('pNotifications').removeAttribute('hidden')
        btnNotifications.addEventListener('click', requestNotifications)
    } else if (Notification.permission === 'granted') {
		requestNotifications()
	}
})

function requestNotifications(evt) {
    subscribeUserToPush().then(subscription => sendSubscriptionToBackEnd(subscription, user)).then(()=>
  	btnNotifications.setAttribute('hidden', true))
}

function subscribeUserToPush() {
  return navigator.serviceWorker.ready
    .then(registration => {
      const subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: config.webpush_public_key,
      }
      return registration.pushManager.subscribe(subscribeOptions)
    })
    .then(pushSubscription => {
      console.log(
        'Received PushSubscription: ',
        JSON.stringify(pushSubscription),
      )
      return pushSubscription
    })
}

function sendSubscriptionToBackEnd(subscription, username) {
  return fetch(config.backend+'/api/webpush-subscribe/'+username, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(subscription),
  }).then(function (response) {
    if (!response.ok) {
      throw new Error('Server error.')
    }
	return true
  })
}

