export default
class DocumentC {
    /**
     * @param {number} docId
     * @param {any} title
     * @param {any} text
     * @param {string} content_type
     * @param {string} topic
     * @param {number} difficulty
     * @param {any} question
     * @param {string} img
     */
    constructor(docId, title, text, content_type, topic, difficulty, question, img) {
        this.docId = docId
        this.title = title;
        this.text = text;
        this.content_type = content_type;
        this.topic = topic;
        this.difficulty = difficulty;
        this.question = question;
        this.img = img;
    }

    /**
     * @param {{ docId: number; title: any; text: any; content_type: string; topic: string; difficulty: number; question: any; img: string; }} json
     */
    static fromJson(json) {
        const { docId, title, text, content_type, topic, difficulty, question, img } = json;
        return new DocumentC(docId, title, text, content_type, topic, difficulty, question, img);
    }

    static getSampleDoc() {
        return new DocumentC(
            -1, 
            {lang: 'drnuk', text: "### Waht AlAli cna do for yuo", translations: {'en': "### What AllAi can do for you"}, 
                tokens: {0: {word: '#', pos: 99, lemma_: '#'}, 1: {word: '#', pos: 99, lemma_: '#'}, 2: {word: '#', pos: 92, lemma_: '#'}, 4: {word: 'Waht', pos: 96, lemma_: 'Waht'}, 9: {word: 'AlAli', pos: 96, lemma_: 'AlAli'}, 15: {word: 'cna', pos: 96, lemma_: 'cna'}, 19: {word: 'do', pos: 100, lemma_: 'do'}, 22: {word: 'for', pos: 85, lemma_: 'for'}, 26: {word: 'yuo', pos: 92, lemma_: 'yuo'}}}, 
            {lang: 'drnuk', text: 
`Hree yuo can epaxnd yuor udnrestanding fo a lagnauge by rdeanig smiple tub fun txets ni it.

Teh txet yuo see si slecteed to ctoanin wrods yuo privoesuly srutggeld wtih and new wrods. We use a prncipile cllaed spcaed repetitoin to optmizie yuor larening by swonhig echa wrod rhgit bfoere yuo are msot likley to fogret it.

Fi yuo tap a wrod it gtes mrekad and a 📕 wlil apaper nxet to it. Tapipng teh book wlil sohw a trsnalaiton. By maikrng wrods, yuo tlel teh AI wcihh wrods yuo wnat to acitvate spcaed repetitoin for.

Wrods taht apaper in ornage are toshe taht yuo privoesuly mraekd. Lvaee tehm ornage fi yuo unodretsod tehm nwo, mrak tehm red aaign fi yuo frgoet.

Tap teh blue buottn to show teh tsalnration and cotniune teh nxet txet.

Yuo can caht wtih AlAl aoubt lgnaugage qseutisons, or fi yuo drae, try chtiatng with it in Plsoih aoubt teh txet - it si yuor pesronal tcehaer and tnadem bdudy.

Hppay rdenaig!`, 
             tokens: {0: {word: 'Hree', pos: 84, lemma_: 'hree'}, 5: {word: 'yuo', pos: 92, lemma_: 'yuo'}, 9: {word: 'can', pos: 87, lemma_: 'can'}, 13: {word: 'epaxnd', pos: 100, lemma_: 'epaxnd'}, 20: {word: 'yuor', pos: 100, lemma_: 'yuor'}, 25: {word: 'udnrestanding', pos: 96, lemma_: 'udnrestanding'}, 39: {word: 'fo', pos: 85, lemma_: 'fo'}, 42: {word: 'a', pos: 90, lemma_: 'a'}, 44: {word: 'lagnauge', pos: 92, lemma_: 'lagnauge'}, 53: {word: 'by', pos: 85, lemma_: 'by'}, 56: {word: 'rdeanig', pos: 84, lemma_: 'rdeanig'}, 64: {word: 'smiple', pos: 96, lemma_: 'smiple'}, 71: {word: 'tub', pos: 96, lemma_: 'tub'}, 75: {word: 'fun', pos: 92, lemma_: 'fun'}, 79: {word: 'txets', pos: 92, lemma_: 'txet'}, 85: {word: 'ni', pos: 96, lemma_: 'ni'}, 88: {word: 'it', pos: 95, lemma_: 'it'}, 90: {word: '.', pos: 97, lemma_: '.'}, 91: {word: '\n\n', pos: 103, lemma_: '\n\n'}, 93: {word: 'Teh', pos: 96, lemma_: 'Teh'}, 97: {word: 'txet', pos: 96, lemma_: 'txet'}, 102: {word: 'yuo', pos: 96, lemma_: 'yuo'}, 106: {word: 'see', pos: 100, lemma_: 'see'}, 110: {word: 'si', pos: 96, lemma_: 'si'}, 113: {word: 'slecteed', pos: 100, lemma_: 'slecteed'}, 122: {word: 'to', pos: 85, lemma_: 'to'}, 125: {word: 'ctoanin', pos: 96, lemma_: 'ctoanin'}, 133: {word: 'wrods', pos: 92, lemma_: 'wrod'}, 139: {word: 'yuo', pos: 96, lemma_: 'yuo'}, 143: {word: 'privoesuly', pos: 96, lemma_: 'privoesuly'}, 154: {word: 'srutggeld', pos: 100, lemma_: 'srutggeld'}, 164: {word: 'wtih', pos: 92, lemma_: 'wtih'}, 169: {word: 'and', pos: 89, lemma_: 'and'}, 173: {word: 'new', pos: 84, lemma_: 'new'}, 177: {word: 'wrods', pos: 92, lemma_: 'wrod'}, 182: {word: '.', pos: 97, lemma_: '.'}, 184: {word: 'We', pos: 95, lemma_: 'we'}, 187: {word: 'use', pos: 100, lemma_: 'use'}, 191: {word: 'a', pos: 90, lemma_: 'a'}, 193: {word: 'prncipile', pos: 92, lemma_: 'prncipile'}, 203: {word: 'cllaed', pos: 92, lemma_: 'cllaed'}, 210: {word: 'spcaed', pos: 100, lemma_: 'spcae'}, 217: {word: 'repetitoin', pos: 92, lemma_: 'repetitoin'}, 228: {word: 'to', pos: 85, lemma_: 'to'}, 231: {word: 'optmizie', pos: 84, lemma_: 'optmizie'}, 240: {word: 'yuor', pos: 92, lemma_: 'yuor'}, 245: {word: 'larening', pos: 100, lemma_: 'larene'}, 254: {word: 'by', pos: 85, lemma_: 'by'}, 257: {word: 'swonhig', pos: 96, lemma_: 'swonhig'}, 265: {word: 'echa', pos: 96, lemma_: 'echa'}, 270: {word: 'wrod', pos: 96, lemma_: 'wrod'}, 275: {word: 'rhgit', pos: 96, lemma_: 'rhgit'}, 281: {word: 'bfoere', pos: 96, lemma_: 'bfoere'}, 288: {word: 'yuo', pos: 96, lemma_: 'yuo'}, 292: {word: 'are', pos: 87, lemma_: 'be'}, 296: {word: 'msot', pos: 84, lemma_: 'msot'}, 301: {word: 'likley', pos: 96, lemma_: 'likley'}, 308: {word: 'to', pos: 94, lemma_: 'to'}, 311: {word: 'fogret', pos: 100, lemma_: 'fogret'}, 318: {word: 'it', pos: 95, lemma_: 'it'}, 320: {word: '.', pos: 97, lemma_: '.'}, 321: {word: '\n\n', pos: 103, lemma_: '\n\n'}, 323: {word: 'Fi', pos: 96, lemma_: 'Fi'}, 326: {word: 'yuo', pos: 92, lemma_: 'yuo'}, 330: {word: 'tap', pos: 100, lemma_: 'tap'}, 334: {word: 'a', pos: 90, lemma_: 'a'}, 336: {word: 'wrod', pos: 92, lemma_: 'wrod'}, 341: {word: 'it', pos: 95, lemma_: 'it'}, 344: {word: 'gtes', pos: 100, lemma_: 'gte'}, 349: {word: 'mrekad', pos: 100, lemma_: 'mrekad'}, 356: {word: 'and', pos: 89, lemma_: 'and'}, 360: {word: 'a', pos: 90, lemma_: 'a'}, 362: {word: '📕', pos: 96, lemma_: '📕'}, 364: {word: 'wlil', pos: 96, lemma_: 'wlil'}, 369: {word: 'apaper', pos: 92, lemma_: 'apaper'}, 376: {word: 'nxet', pos: 96, lemma_: 'nxet'}, 381: {word: 'to', pos: 85, lemma_: 'to'}, 384: {word: 'it', pos: 95, lemma_: 'it'}, 386: {word: '.', pos: 97, lemma_: '.'}, 388: {word: 'Tapipng', pos: 96, lemma_: 'Tapipng'}, 396: {word: 'teh', pos: 96, lemma_: 'teh'}, 400: {word: 'book', pos: 92, lemma_: 'book'}, 405: {word: 'wlil', pos: 96, lemma_: 'wlil'}, 410: {word: 'sohw', pos: 96, lemma_: 'sohw'}, 415: {word: 'a', pos: 90, lemma_: 'a'}, 417: {word: 'trsnalaiton', pos: 96, lemma_: 'trsnalaiton'}, 428: {word: '.', pos: 97, lemma_: '.'}, 430: {word: 'By', pos: 85, lemma_: 'by'}, 433: {word: 'maikrng', pos: 84, lemma_: 'maikrng'}, 441: {word: 'wrods', pos: 92, lemma_: 'wrod'}, 446: {word: ',', pos: 97, lemma_: ','}, 448: {word: 'yuo', pos: 96, lemma_: 'yuo'}, 452: {word: 'tlel', pos: 96, lemma_: 'tlel'}, 457: {word: 'teh', pos: 96, lemma_: 'teh'}, 461: {word: 'AI', pos: 96, lemma_: 'AI'}, 464: {word: 'wcihh', pos: 96, lemma_: 'wcihh'}, 470: {word: 'wrods', pos: 100, lemma_: 'wrod'}, 476: {word: 'yuo', pos: 96, lemma_: 'yuo'}, 480: {word: 'wnat', pos: 92, lemma_: 'wnat'}, 485: {word: 'to', pos: 94, lemma_: 'to'}, 488: {word: 'acitvate', pos: 100, lemma_: 'acitvate'}, 497: {word: 'spcaed', pos: 100, lemma_: 'spcae'}, 504: {word: 'repetitoin', pos: 92, lemma_: 'repetitoin'}, 515: {word: 'for', pos: 85, lemma_: 'for'}, 518: {word: '.', pos: 97, lemma_: '.'}, 519: {word: '\n\n', pos: 103, lemma_: '\n\n'}, 521: {word: 'Wrods', pos: 92, lemma_: 'wrod'}, 527: {word: 'taht', pos: 100, lemma_: 'taht'}, 532: {word: 'apaper', pos: 92, lemma_: 'apaper'}, 539: {word: 'in', pos: 85, lemma_: 'in'}, 542: {word: 'ornage', pos: 96, lemma_: 'ornage'}, 549: {word: 'are', pos: 87, lemma_: 'be'}, 553: {word: 'toshe', pos: 96, lemma_: 'toshe'}, 559: {word: 'taht', pos: 96, lemma_: 'taht'}, 564: {word: 'yuo', pos: 96, lemma_: 'yuo'}, 568: {word: 'privoesuly', pos: 96, lemma_: 'privoesuly'}, 579: {word: 'mraekd', pos: 100, lemma_: 'mraekd'}, 585: {word: '.', pos: 97, lemma_: '.'}, 587: {word: 'Lvaee', pos: 84, lemma_: 'lvaee'}, 593: {word: 'tehm', pos: 92, lemma_: 'tehm'}, 598: {word: 'ornage', pos: 96, lemma_: 'ornage'}, 605: {word: 'fi', pos: 96, lemma_: 'fi'}, 608: {word: 'yuo', pos: 96, lemma_: 'yuo'}, 612: {word: 'unodretsod', pos: 96, lemma_: 'unodretsod'}, 623: {word: 'tehm', pos: 96, lemma_: 'tehm'}, 628: {word: 'nwo', pos: 96, lemma_: 'nwo'}, 631: {word: ',', pos: 97, lemma_: ','}, 633: {word: 'mrak', pos: 96, lemma_: 'mrak'}, 638: {word: 'tehm', pos: 96, lemma_: 'tehm'}, 643: {word: 'red', pos: 96, lemma_: 'red'}, 647: {word: 'aaign', pos: 96, lemma_: 'aaign'}, 653: {word: 'fi', pos: 96, lemma_: 'fi'}, 656: {word: 'yuo', pos: 96, lemma_: 'yuo'}, 660: {word: 'frgoet', pos: 100, lemma_: 'frgoet'}, 666: {word: '.', pos: 97, lemma_: '.'}, 667: {word: '\n\n', pos: 103, lemma_: '\n\n'}, 669: {word: 'Tap', pos: 100, lemma_: 'Tap'}, 673: {word: 'teh', pos: 92, lemma_: 'teh'}, 677: {word: 'blue', pos: 84, lemma_: 'blue'}, 682: {word: 'buottn', pos: 92, lemma_: 'buottn'}, 689: {word: 'to', pos: 94, lemma_: 'to'}, 692: {word: 'show', pos: 100, lemma_: 'show'}, 697: {word: 'teh', pos: 96, lemma_: 'teh'}, 701: {word: 'tsalnration', pos: 96, lemma_: 'tsalnration'}, 713: {word: 'and', pos: 89, lemma_: 'and'}, 717: {word: 'cotniune', pos: 96, lemma_: 'cotniune'}, 726: {word: 'teh', pos: 96, lemma_: 'teh'}, 730: {word: 'nxet', pos: 96, lemma_: 'nxet'}, 735: {word: 'txet', pos: 96, lemma_: 'txet'}, 739: {word: '.', pos: 97, lemma_: '.'}, 740: {word: '\n\n', pos: 103, lemma_: '\n\n'}, 742: {word: 'Yuo', pos: 96, lemma_: 'Yuo'}, 746: {word: 'can', pos: 87, lemma_: 'can'}, 750: {word: 'caht', pos: 96, lemma_: 'caht'}, 755: {word: 'wtih', pos: 96, lemma_: 'wtih'}, 760: {word: 'AlAl', pos: 96, lemma_: 'AlAl'}, 765: {word: 'aoubt', pos: 96, lemma_: 'aoubt'}, 771: {word: 'lgnaugage', pos: 92, lemma_: 'lgnaugage'}, 781: {word: 'qseutisons', pos: 92, lemma_: 'qseutison'}, 791: {word: ',', pos: 97, lemma_: ','}, 793: {word: 'or', pos: 89, lemma_: 'or'}, 796: {word: 'fi', pos: 96, lemma_: 'fi'}, 799: {word: 'yuo', pos: 96, lemma_: 'yuo'}, 803: {word: 'drae', pos: 96, lemma_: 'drae'}, 807: {word: ',', pos: 97, lemma_: ','}, 809: {word: 'try', pos: 100, lemma_: 'try'}, 813: {word: 'chtiatng', pos: 100, lemma_: 'chtiatng'}, 822: {word: 'with', pos: 85, lemma_: 'with'}, 827: {word: 'it', pos: 95, lemma_: 'it'}, 830: {word: 'in', pos: 85, lemma_: 'in'}, 833: {word: 'Plsoih', pos: 96, lemma_: 'Plsoih'}, 840: {word: 'aoubt', pos: 96, lemma_: 'aoubt'}, 846: {word: 'teh', pos: 96, lemma_: 'teh'}, 850: {word: 'txet', pos: 96, lemma_: 'txet'}, 855: {word: '-', pos: 97, lemma_: '-'}, 857: {word: 'it', pos: 95, lemma_: 'it'}, 860: {word: 'si', pos: 92, lemma_: 'si'}, 863: {word: 'yuor', pos: 92, lemma_: 'yuor'}, 868: {word: 'pesronal', pos: 84, lemma_: 'pesronal'}, 877: {word: 'tcehaer', pos: 92, lemma_: 'tcehaer'}, 885: {word: 'and', pos: 89, lemma_: 'and'}, 889: {word: 'tnadem', pos: 96, lemma_: 'tnadem'}, 896: {word: 'bdudy', pos: 96, lemma_: 'bdudy'}, 901: {word: '.', pos: 97, lemma_: '.'}, 902: {word: '\n\n', pos: 103, lemma_: '\n\n'}, 904: {word: 'Hppay', pos: 96, lemma_: 'Hppay'}, 910: {word: 'rdenaig', pos: 96, lemma_: 'rdenaig'}, 917: {word: '!', pos: 97, lemma_: '!'}}, 
             translations: {'en': 
`Here you can expand your understanding of a language by reading simple but fun texts in it.

The text you see is selected to contain words you previously struggled with and new words. We use a principle called spaced repetition to optimize your learning by showing each word right before you are most likely to forget it.

If you tap a word it gets marked and a 📕 will appear next to it. Tapping the book will show a translation. By marking words, you tell the AI which words you want to activate spaced repetition for. 

Word that appear in orange are those that you previously marked. Leave them orange if you understood them now, mark them red again if you forgot.

Tap the blue button to show the translation and continue the next text.

You can chat with AllAi about language questions, or if you dare, try chatting with it in Polish about the text - it is your personal teacher and tandem buddy.

Happy reading!`}}, "Sample", "Drunk", 1, undefined, "")    
        }


    toString() {
        return `Document{TITLE: ${this.title}, TEXT: ${this.text}, CONTENT_TYPE: ${this.content_type}, TOPIC: ${this.topic}, DIFFICULTY: ${this.difficulty}, QUESTION: ${this.question}}`;
    }
}
