export default
class TranslatableText {
    constructor(text, lang, translations) {
        this.text = text;
        this.lang = lang;
        this.translations = translations;
    }

    toString() {
        return this.text;
    }
}