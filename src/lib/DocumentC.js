export default
class DocumentC {
    constructor(title, text, content_type, topic, difficulty, question) {
        this.title = title;
        this.text = text;
        this.content_type = content_type;
        this.topic = topic;
        this.difficulty = difficulty;
        this.question = question;
    }

    static fromJson(json) {
        const { title, text, content_type, topic, difficulty, question } = json;
        return new DocumentC(title, text, content_type, topic, difficulty, question);
    }


    toString() {
        return `Document{TITLE: ${this.title}, TEXT: ${this.text}, CONTENT_TYPE: ${this.content_type}, TOPIC: ${this.topic}, DIFFICULTY: ${this.difficulty}, QUESTION: ${this.question}}`;
    }
}
