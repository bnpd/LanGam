<script>
// import { getVocab } from "$lib/components/backend.js"

// /// Elements ///
// const ulSearchList = document.getElementById("ulSearchList")
// const ulKnownList = document.getElementById("ulKnownList")
// const iLearnMultiple = document.getElementById("iLearnMultiple")
// const btnLearnMultiple = document.getElementById("btnLearnMultiple")
// const pLearnedSuccessfully = document.getElementById("pLearnedSuccessfully")
// const spanNKnown = document.getElementById("spanNKnown")
// const btnExportSearchList = document.getElementById("btnExportSearchList")
// const btnExportKnownList = document.getElementById("btnExportKnownList")
// const iImportKnownList = document.getElementById("iImportKnownList")
// const divImportMenu = document.getElementById("divImportMenu")
// const spanTooltiptext = document.getElementById("spanTooltiptext")
// const btnToggleImportMenu = document.getElementById("btnToggleImportMenu")
// const btnOpenDialogPasteKnownList = document.getElementById("btnOpenDialogPasteKnownList")
// const divDialogImportPasteKnownList = document.getElementById("divDialogImportPasteKnownList")
// const iPasteKnownList = document.getElementById("iPasteKnownList")
// const btnSubmitPasteKnownList = document.getElementById("btnSubmitPasteKnownList")
// const btnCloseDialogPasteKnownList = document.getElementById("btnCloseDialogPasteKnownList")
// var user = localStorage.getItem('username')

// /// Script ///

// reloadLists()

// btnToggleImportMenu.addEventListener("click", () => {
//     if (! divImportMenu.style.display || divImportMenu.style.display === "none") {
//         divImportMenu.style.display = "block"
//         spanTooltiptext.style.top = "450%"
//     } else {
//         divImportMenu.style.display = "none"
//         spanTooltiptext.style.top = ""
//     }
// })

// btnOpenDialogPasteKnownList.addEventListener("click", () => {
//     divDialogImportPasteKnownList.style.display = "block"
// })

// btnCloseDialogPasteKnownList.addEventListener("click", () => {
//     divDialogImportPasteKnownList.style.display = "none"
// })

// btnLearnMultiple.addEventListener("click", () => { // submit on button press
//     learnMultiple(iLearnMultiple.value)
// })
// iLearnMultiple.addEventListener("keyup", ({key}) => { // submit on enter
//     if (key === "Enter") {
//         learnMultiple(iLearnMultiple.value)
//     }
// })

// btnSubmitPasteKnownList.addEventListener("click", () => {
//     importText(iPasteKnownList.value).then(() => {
//         reloadLists()
//         iPasteKnownList.value = ""
//         divDialogImportPasteKnownList.style.display = "none"
//         divImportMenu.style.display = "none"
//     })
// })

// btnExportSearchList.addEventListener("click", () => exportList('searchList'))
// btnExportKnownList.addEventListener("click", () => exportList('knownList'))


// iImportKnownList.addEventListener("change", () => {
//     importKnownList(iImportKnownList.files[0]).then(reloadLists)
// })

// /// Functions ///

// /**
//  * Reload (or load initially) both lists
//  */
// function reloadLists() {
//     // remove previous content
//     ulKnownList.textContent=""
//     ulSearchList.textContent=""

//     // load lists
//     getVocab(user).then(vocab => {
//         let scheduledMap, allFormsMap
//         [scheduledMap, allFormsMap] = [...vocab]
//         for (let lemma in scheduledMap) {
//             lemma = scheduledMap[lemma]
//             let li = document.createElement("li")
//             li.textContent=lemma.word + ": " + lemma.due.day + "." + lemma.due.month + "."
//             //li.addEventListener("click", () => {eventListenerLearn(word, li, freqList)})
//             ulSearchList.appendChild(li)
//         }
//         for (const lemma in allFormsMap) {
//             let li = document.createElement("li")
//             li.textContent=lemma + ": " + allFormsMap[lemma]
//             //li.addEventListener("click", () => {eventListenerLearn(word, li, freqList)})
//             ulKnownList.appendChild(li)
//         }
//         spanNKnown.innerText="("+Object.keys(allFormsMap).length+" lemmas)"
//     })
// }

// /**
//  * Process pushing words from list of unlearned words to the other
//  */
//  function eventListenerLearn(word, li, freqList) {
//     learnWords(word)
//     .then(lemma => {
//         let oldLi=li
//         li=li.cloneNode(true) // removes the old eventListener
//         oldLi.parentNode.removeChild(oldLi) // remove from the old list
//         li.innerText=freqList[lemma] + ": " + lemma
//         ulKnownList.insertBefore(li, ulKnownList.firstChild) // move to the other list
//         li.addEventListener("click", () => {eventListenerUnlearn(word, li, freqList)})
//     })
//     .catch(error => {console.error(error)})
// }
// /**
//  * Process pushing words from list of learned words to the other
//  */
// function eventListenerUnlearn(word, li, freqList) {
//     unlearnWords(word)
//     .then(lemma => {
//         let oldLi=li
//         li=li.cloneNode(true) // removes the old eventListener
//         oldLi.parentNode.removeChild(oldLi) // remove from the old list
//         li.innerText=freqList[lemma] + ": " + lemma
//         ulSearchList.insertBefore(li, ulSearchList.firstChild) // move to the other list
//         li.addEventListener("click", () => {eventListenerLearn(word, li, freqList)})
//     })
//     .catch(error => {console.error(error);})
// }

// /**
//  * Mark all words from freqency rank 0 to maxFreq as learned
//  * @param {number} maxFreq Maximum freq rank to be marked as learned
//  */
// function learnMultiple(maxFreq=0) {
//     pLearnedSuccessfully.innerText=""
//     let toBeLearned = []
//     if (confirm("Are you sure you want to mark all words from freqency rank 0 to "+maxFreq+" as learned?")) {
//         getWordList("searchList", searchList => {
//             if (!searchList) {
//                 console.error("SearchList not found");
//                 return
//             }
//             searchList = [...searchList]
//             getWordList("freqList", freqList => {
//                 for (let i = 0; i < searchList.length && freqList[searchList[i]]<=maxFreq; i++) {
//                     toBeLearned.push(searchList[i])
//                 }
//                 learnWords(toBeLearned)
//                 .then(() => {
//                     pLearnedSuccessfully.innerText="Learned "+toBeLearned.length+" word"+(toBeLearned.length>1 ? "s" : "")+"."
//                     reloadLists()
//                 })
//                 .catch(error => {console.error(error)})
//             })
//         })
//     }
// }
</script>

<nav>
  <a href="/" id="aManageLists">Back</a>
</nav>
<div id="divMultiLearn">
  <label for="iLearnMultiple">Mark everything as learned up to rank: &nbsp;</label>
  <input type="text" name="iLearnMultiple" id="iLearnMultiple" placeholder="e.g. 500"
  ><button id="btnLearnMultiple">Mark learned</button>
  <span id="pLearnedSuccessfully"></span>
</div>
<div>
  <div id="divLeft">
    <h1>
      Spaced Repetition
      <button id="btnExportSearchList">Export</button>
    </h1>
    <ul id="ulSearchList"></ul>
  </div>
  <div id="divRight">
      <h1>
        Seen
        <span id="spanNKnown"></span>
        <button id="btnExportKnownList">Export</button>
        <span class="tooltip">
          <span>
            <button id="btnToggleImportMenu">Import ▾</button>
            <div id="divImportMenu">
              <input type="file" id="iImportKnownList"><br>
              <button id="btnOpenDialogPasteKnownList">Paste</button>
            </div>
          </span>
          <span id="spanTooltiptext" class="tooltiptext" style="font-size: 0.5em; line-height: normal;">
            Consider exporting a backup before importing!<br>
            Imported words will be added to your known words. If you want to replace your currently known words, reset your progress in the settings first.
          </span>
        </span>
      </h1>
      <ul id="ulKnownList"></ul>
  </div>
</div>

<div id="divDialogImportPasteKnownList" class="background-blur">
  <div class="dialog-inner">
    <h2>
      Paste a list or text to learn all words in it
      <button id=btnCloseDialogPasteKnownList>×</button>
    </h2>
    <textarea name="iPasteKnownList" id="iPasteKnownList" rows="40" cols="50"></textarea>
    <button id="btnSubmitPasteKnownList">Mark learned</button>
  </div>
</div>
