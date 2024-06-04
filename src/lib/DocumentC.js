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
     */
    constructor(docId, title, text, content_type, topic, difficulty, question) {
        this.docId = docId
        this.title = title;
        this.text = text;
        this.content_type = content_type;
        this.topic = topic;
        this.difficulty = difficulty;
        this.question = question;
    }

    /**
     * @param {{ docId: number; title: any; text: any; content_type: string; topic: string; difficulty: number; question: any; }} json
     */
    static fromJson(json) {
        const { docId, title, text, content_type, topic, difficulty, question } = json;
        return new DocumentC(docId, title, text, content_type, topic, difficulty, question);
    }


    toString() {
        return `Document{TITLE: ${this.title}, TEXT: ${this.text}, CONTENT_TYPE: ${this.content_type}, TOPIC: ${this.topic}, DIFFICULTY: ${this.difficulty}, QUESTION: ${this.question}}`;
    }
}
