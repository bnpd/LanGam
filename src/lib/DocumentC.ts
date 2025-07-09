export default
class DocumentC {
    docId: number;
    title: any;
    text: any;
    content_type: string;
    topic: string;
    difficulty: number;
    question: any;
    img: string;
    constructor(docId: number, title: any, text: any, content_type: string, topic: string, difficulty: number, question: any, img: string) {
        this.docId = docId
        this.title = title;
        this.text = text;
        this.content_type = content_type;
        this.topic = topic;
        this.difficulty = difficulty;
        this.question = question;
        this.img = img;
    }
    static partialDocument(text: string, lang: string, translations: { (lang: string): string; }, tokens: { (index: number): { word: string; pos: number; lemma_: string; }; }) {
        return new DocumentC(undefined, undefined, {
            lang: lang,
            text: text,
            translations: translations,
            tokens: tokens
        }, undefined, undefined, undefined, undefined, undefined)
    }

    /**
     * @param {{ docId: number; title: any; text: any; content_type: string; topic: string; difficulty: number; question: any; img: string; }} json
     */
    static fromJson(json: { docId: number; title: any; text: any; content_type: string; topic: string; difficulty: number; question: any; img: string; }) {
        const { docId, title, text, content_type, topic, difficulty, question, img } = json;
        return new DocumentC(docId, title, text, content_type, topic, difficulty, question, img);
    }

    makeTask() {
        let resParas = []
        let space = {word: ' ', lemma_: '', pos: -1}
        let isTitle = true
        for (const translatableText of [this.title, this.text]) {
            if (translatableText) {
                let paragraph = []	
                let char_index = 0	
                for (const start_char in translatableText.tokens) {                       
                    while (char_index < (start_char as unknown as number)) { // insert whitespace and newlines
                    if (translatableText.text[char_index] == '\n' && paragraph.length > 0) {
                        // next paragraph
                        const headingLevel = getHeadingLevelForTask(paragraph)
                        resParas.push({htmlTag: isTitle && !headingLevel ? 'h3' : headingLevel ? 'h'+headingLevel : 'p', words: paragraph.slice(headingLevel)})
                        paragraph = []
                    } else if (paragraph.length > 0) { // length>0 cause we do not want to push leading spaces to paragraphs
                        paragraph.push(space)
                    }
                    char_index++
                    }
                    // now our char indexes are synced
    
                    let token_obj = translatableText.tokens[char_index]
                    let token_word = token_obj?.word
    
                    if (!token_word?.trim()) continue // only proceed if it wasn't only some kind of whitespace
                    paragraph.push(token_obj)
                    char_index += token_word.length
                }
                if(paragraph.length > 0) {
                    const headingLevel = getHeadingLevelForTask(paragraph)
                    resParas.push({htmlTag: isTitle && !headingLevel ? 'h3' : headingLevel ? 'h'+headingLevel : 'p', words: paragraph.slice(headingLevel)})
                }
            }
            isTitle = false // done with title
        }
        return resParas

        /**
         * Calculate heading level from number of leading hashtags #
         * @param paragraphWords Array of Tokens of the paragraph
         */
        function getHeadingLevelForTask(paragraphWords: Array<any>) {
            let level = 0;
            for (let i = 0; i < Math.min(4, paragraphWords.length); i++) {
                if (paragraphWords[i]?.word === '#') {
                level++;
                } else {
                break;
                }
            }
            return level;
        }
    }
}
