'use strict';
import config from './config.js'

// register Service Worker for PWA
if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker.register('/sw.js')
		.then((reg) => {
			console.log('Service worker registered.', reg);
		});
	});
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
var user = new URLSearchParams(window.location.search).get('u')

// Initialize
window.addEventListener("load", init)
function init() {
	loginbox = document.getElementById("loginbox")
	contentbox = document.getElementById('contentbox')
	emValidationError = document.getElementById('emValidationError')
	if (!user) {
		showLoginPrompt()
		const iUsername = document.getElementById('iUsername')
		document.getElementById("btnLogin").addEventListener("click", () => { // submit on button press
			user = iUsername.value
			init()
		})
		iUsername.addEventListener("keyup", ({key}) => { // submit on enter
			if (key === "Enter") {
				user = iUsername.value
				init()
			}
		})
		return
	}
	loginbox.style.display = 'none'
	contentbox.style.display = 'block'

	divTask = document.getElementById('divTask')
	answbtn = document.getElementById("answbtn")
	iRating = document.getElementById('iRating')
	divBottombar = document.getElementById('divBottombar')
	labelSurveyQuestion = document.getElementById('labelSurveyQuestion')
	solutionField = document.getElementById("solutionField")
	answbtn.addEventListener("click", () => {
		if (phase == "promting") {
			showSolution()
		} else if (phase == "solutionShown") {
			solutionField.style.visibility="hidden"
			Promise.all(currentTask.split(' ').map(word => {
				return sendReview(word, failedWords.has(word) ? 1 : 4) // TODO: allow all qualities 0-5
			})).then(() => {
				failedWords.clear()
				getTask()
			})
		} else if (phase == "done") {
			requestNewWords()
		}
	})
	iRating.addEventListener('change', () => {
		replySurvey(iRating.value)
	})
	getTask()
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


function setTask(task) {
	currentTask = task  // save in global to be accessible in answbtn eventListener
	divTask.textContent = '' // delete previous task
	phase = "promting"
	answbtn.innerHTML = answbtnTxtWhilePrompting
	task.split(' ').map(word => {
		let span = document.createElement("span")
		span.innerHTML = word
		span.className = 'pointer span-'+word
		span.style.marginRight="0.5em"
		divTask.appendChild(span)
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
				failedWords.add(word)
				Array.from(document.getElementsByClassName('span-'+word)).map(each => {
					each.style.color = "red"
					let aDict = document.createElement('a')
					aDict.innerHTML = '📕'
					aDict.className = 'a-'+word
					aDict.addEventListener("click", () => {
						window.open('https://translate.google.com/?sl=da&tl=en&text='+word,'popup','width=600,height=800')
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
	answbtn.innerHTML = answbtnTxtWhileDone
}


function setSolution(solution) {
	solutionField.innerHTML = solution
}

function showSurvey() {
	let keys = Object.keys(surveys_available)
	if (keys.length===0) return
	currentMetric = keys[Math.floor(Math.random()*keys.length)]
	labelSurveyQuestion.innerText = surveys_available[currentMetric]
	delete surveys_available[currentMetric]
	divBottombar.style.visibility = 'visible'
}


function replySurvey(rating) {
	divBottombar.style.visibility = 'hidden'
	backendGet('/rate/'+user+'/'+currentMetric+'/'+rating, ()=>{}, null)
}


function sendReview(word, quality){
	return new Promise((resolve, _reject) => {
		if (Math.random()<0.25) {
			showSurvey()
		}
		backendGet('/review/'+user+'/'+word+'/'+quality, resolve, "Error sending your results")
	})
}


function getSolution(){
	backendGet('/current_solution/'+user, responseText => setSolution(responseText), 'Error loading the solution')
}


function getTask(){
	backendGet('/due_task/'+user, responseText => {
		if (!responseText) {
			noTask()
			showSurvey()
		} else {
			setTask(responseText)
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

