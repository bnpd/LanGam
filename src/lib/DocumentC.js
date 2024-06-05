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


    toString() {
        return `Document{TITLE: ${this.title}, TEXT: ${this.text}, CONTENT_TYPE: ${this.content_type}, TOPIC: ${this.topic}, DIFFICULTY: ${this.difficulty}, QUESTION: ${this.question}}`;
    }
}
