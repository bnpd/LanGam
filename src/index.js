'use strict';

// register Service Worker for PWA
if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker.register('/sw.js')
		.then((reg) => {
			console.log('Service worker registered.', reg);
		});
	});
}

var divTask
var answbtn
var solutionField
var loginbox
var contentbox
var currentTask=''
var phase = "promting" // or "solutionShown"
var failedWords = new Set()
const answbtnTxtWhilePrompting = "Show solution"
const answbtnTxtWhileSolutionShown = "Next question"
const answbtnTxtWhileDone = 'Learn new words'
const backend = "https://allai-backend.onrender.com"  // "http://127.0.0.1:5000"
var user = new URLSearchParams(window.location.search).get('u')

// Initialize
window.addEventListener("load", init)
function init() {
	loginbox = document.getElementById("loginbox")
	contentbox = document.getElementById('contentbox')
	if (!user) {
		loginbox.style.display = 'block'
		contentbox.style.display = 'none'
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
	solutionField = document.getElementById("solutionField")

	answbtn.addEventListener("click", () => {
		if (phase == "promting") {
			showSolution()
		} else if (phase == "solutionShown") {
			solutionField.style.visibility="hidden"
			console.log(failedWords);
			Promise.all(currentTask.split(' ').map(word => {
				return sendReview(word, failedWords.has(word) ? 1 : 4) // TODO: allow all qualities 0-5
			})).then(() => {
				console.log('THEN');
				failedWords.clear()
				getTask()
			})
		} else if (phase == "done") {
			requestNewWords()
		}
	})
	getTask()
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


function sendReview(word, quality){
	return new Promise((resolve, _reject) => {
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
			document.getElementById('navcontent').innerHTML='<h1>Sorry, you got an invalid link.<br>Contact me for a new one.<br>Nothing to see here 😶‍🌫️</h1>'
		} else {
			window.alert(error_msg + ': ' + xhr.responseText)
		}
	}
	xhr.open("GET", backend + path, true)
	xhr.send(null)
}

