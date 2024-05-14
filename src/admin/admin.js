import { backendPost } from "../lib/backend.js"


document.addEventListener("DOMContentLoaded", function() {
    var tvTitle = document.getElementById('tvTitle');
    var tvBody = document.getElementById('tvBody');
    var tvQuestion = document.getElementById('tvQuestion');
    var iType = document.getElementById('iType');
    var iTopic = document.getElementById('iTopic');
    var iDifficulty = document.getElementById('iDifficulty');
    var btnSubmit = document.getElementById('btnSubmit');

    var target_lang = localStorage.getItem('target_lang')

    tvTitle.addEventListener('input', function() {
        var text = tvTitle.value;
        var paragraphs = text.split('\n');
        tvTitle.value = paragraphs[0];
        if (paragraphs.length > 1) {
            tvBody.value = paragraphs.slice(1, paragraphs.length -1).join("\n").trim();
        }
        if (paragraphs.length > 2) {
            tvQuestion.value = paragraphs[paragraphs.length - 1];
        }
    });

    btnSubmit.addEventListener('click', () => {
        var payload = {
            title: tvTitle.value,
            text: tvBody.value,
            question: tvQuestion.value,
            type: iType.value,
            topic: iTopic.value,
            difficulty: iDifficulty.value
        };

        backendPost('/new_document/'+target_lang, payload, async response => {
            // for (const tv of [tvTitle, tvBody, tvQuestion, iType, iTopic, iDifficulty]) {
            //     tv.value = ''
            // }
            response.json().then(json => {
                var link = document.createElement('a');
                link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(json.csv));
                link.setAttribute('download', "new_document");
                link.hidden = true;
                document.body.appendChild(link);
                link.click();            
                document.body.removeChild(link);
                
                // display that document now
                window.location = '/?doc=' + json.docId
            })
        });

    })
});