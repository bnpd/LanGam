export default
class TranslatableText {
    constructor(text, lang, translations, tokens) {
        this.text = text;
        this.lang = lang;
        this.translations = translations;
        this.tokens = tokens
    }

    toString() {
        return this.text;
    }
}