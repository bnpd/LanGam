'use strict'
import config from './config.js'

// register Service Worker for PWA
if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker.register('/sw.js')
		.then((reg) => {
			console.log('Service worker registered.', reg)
		})
	})
}
var divTask, divBottombar, labelSurveyQuestion, emValidationError, answbtn, solutionField, loginbox, contentbox, iRating
var currentTask=''
var phase = "promting" // or "solutionShown"
var failedWords = new Set()
var currentMetric=''
var surveys_available = {
	interestingness: 'The tasks are interesting',
	enjoyability: 'I am enjoying this',
	flow: 'I am in the flow',
	learning: 'I am learning a lot',
	callengingness: 'This is challenging',
	confusion: 'I am confused'
}
const answbtnTxtWhilePrompting = "Show solution"
const answbtnTxtWhileSolutionShown = "Next question"
const answbtnTxtWhileDone = 'Learn new words'
const preprocessingRegex = /[^\p{L}\p{N}']/gu
let urlparams = new URLSearchParams(window.location.search)
var user = urlparams.get('u'), target_lang=urlparams.get('tl'), native_lang=urlparams.get('nl'), method=urlparams.get('mtd') // temporary solution only use url params for user languages
var voice = null

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
		init()
	})
	if (!user) {
		showLoginPrompt('Sorry, your link seems to be defective, please ask Benjamin for a new one 💥🔗')
		return
	}

	if (method === 'focus') {
		document.getElementById('pMethodExplanation').innerHTML = 'Please tap the current word if you do not know it yet or cannot remember what it means. <span class="out-of-focus">Opaque</span> words are only for context.'
	}

	loginbox.style.display = 'none'
	contentbox.style.display = 'block'

	divTask = document.getElementById('divTask')
	answbtn = document.getElementById("answbtn")
	iRating = document.getElementById('iRating')
	divBottombar = document.getElementById('divBottombar')
	labelSurveyQuestion = document.getElementById('labelSurveyQuestion')
	solutionField = document.getElementById("solutionField")
	answbtn.className = 'loading-indicator'
	answbtn.addEventListener("click", () => {
		if (phase === "promting") {
			showSolution()
			try_speak(currentTask)
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
	iRating.addEventListener('input', () => {
		labelSurveyQuestion.innerText = 'Thanks!'
	})
	for (const event of ['touchend', 'mouseup']) {
		iRating.addEventListener(event, () => {
			replySurvey(iRating.value)
		})
	}

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
	solutionField.style.visibility="visible"
	phase = "solutionShown"
	answbtn.innerHTML = answbtnTxtWhileSolutionShown
}


function setTask(task, focused_word=null) {
	task = task.replace(/\xa0/g, '') // remove nbsp just in case its a problem here too
	focused_word = focused_word ? focused_word.replace(/\xa0/g, '') : focused_word // remove nbsp just in case its a problem here too
	currentTask = focused_word ? focused_word : task // save in global to be accessible in answbtn eventListener
	divTask.textContent = '' // delete previous task
	divTask.style.visibility="visible"
	phase = "promting"
	answbtn.innerHTML = answbtnTxtWhilePrompting
	task.split(' ').map(word => {
		let span = document.createElement("span")
		span.innerHTML = word
		span.style.marginRight="0.5em"
		divTask.appendChild(span)

		word = word.toLowerCase().replace(preprocessingRegex, '') // preprocess word to remove e.g. adjacent commas and lowercase it. Only unicode letters + ' allowed
		if (focused_word && word !== focused_word) {
			span.className = 'out-of-focus'
			return // no need to make clickable and implement fail_word logic if not relevant
		}

		span.className = 'pointer span-'+word
		span.addEventListener("click", () => {
			if (failedWords.has(word)) {
				failedWords.delete(word)
				Array.from(document.getElementsByClassName('span-'+word)).map(each => {
					each.style.color = ""
					Array.from(document.getElementsByClassName('a-'+word)).map(eachA => { // remove corresponding dictionary links for all occurrences of the word
						divTask.removeChild(eachA)
					})
				})
			} else {
				try_speak(word)
				failedWords.add(word)
				Array.from(document.getElementsByClassName('span-'+word)).map(each => {
					each.style.color = "red"
					let aDict = document.createElement('a')
					aDict.innerHTML = '📕'
					aDict.className = 'a-'+word
					aDict.addEventListener("click", () => {
						window.open('https://translate.google.com/?sl='+target_lang+'&tl='+native_lang+'&text='+word,'popup','width=600,height=800')
					})
					divTask.insertBefore(aDict, each)
				})
			}
		})
	})
}


function noTask() {
	phase = 'done'
	currentTask = ''
	divTask.textContent = 'Done for today 🤓'
	divTask.style.visibility="visible"
	solutionField.className = ''
	solutionField.innerText = ''
	answbtn.innerHTML = answbtnTxtWhileDone
}


function setSolution(solution, word_translation=null) {
	answbtn.removeAttribute('disabled', '')
	solutionField.style.visibility="hidden"
	solutionField.className = ''
	if (word_translation && solution.toLowerCase().includes(word_translation.toLowerCase())) {
		solutionField.innerHTML = '<span class="out-of-focus">' + solution.replace(new RegExp(word_translation, "ig"), '</span>' + word_translation + '<span class="out-of-focus">') + '</span>'
	} else {
		solutionField.innerHTML = solution
	}
}

function showSurvey() {
	let keys = Object.keys(surveys_available)
	if (keys.length===0) return
	iRating.value = 3  // reset value to neutral
	currentMetric = keys[Math.floor(Math.random()*keys.length)]
	labelSurveyQuestion.innerText = surveys_available[currentMetric]
	delete surveys_available[currentMetric]
	divBottombar.className = 'visible'
}


function replySurvey(rating) {
	divBottombar.className = 'hidden'
	backendGet('/rate/'+user+'/'+currentMetric+'/'+rating, ()=>{}, null)
}

/**
 * Send reults of user reviewing a word
 * @param word Word that was reviewed
 * @param quality Quality of recall
 * @returns {Promise<unknown>} Promise that is resolved when send was successful
 */
function sendReview(word, quality){
	return new Promise((resolve, _reject) => {
		if (Math.random()<0.25) {
			showSurvey()
		}
		backendGet('/review/'+user+'/'+word+'/'+quality, resolve, "Error sending your results")
	})
}


function getSolution(){
	solutionField.className = 'loading-indicator'
	answbtn.setAttribute('disabled', "")
	backendGet('/current_solution/'+user, responseText => {
		let task = null
		let word = null
		try { // for single word method where a word in the task has to be focused
			let json = JSON.parse(responseText)
			task = json.task
			if (json.hasOwnProperty('word')) {
				word = json.word
			}
		} catch (error) {
			console.log(error)
		}
		console.log(task)
		console.log(word)
		setSolution(task, word)
	}, 'Error loading the solution')
}


function getTask(){
	backendGet('/due_task/'+user, responseText => {
		answbtn.className = ''

		let task = null
		let word = null
		try { // for single word method where a word in the task has to be focused
			let json = JSON.parse(responseText)
			task = json.task
			if (json.hasOwnProperty('word')) {
				word = json.word
			}
		} catch (error) {
			console.log(error)
		}

		if (!task) {
			noTask()
			showSurvey()
		} else {
			setTask(task, word)
			getSolution()
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
    }
})

function requestNotifications(evt) {
    subscribeUserToPush().then(subscription => sendSubscriptionToBackEnd(subscription, user)).then(()=>
  	evt.srcElement.setAttribute('hidden', true))
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

