export default
class Token {
    constructor(word, lemma, pos) {
        this.word = word
        this.lemma = lemma;
        this.pos = pos;
    }

    static fromJson(json) {
        const {word, lemma, pos} = json;
        return new Token(word, lemma, pos);
    }


    toString() {
        return `Token{WORD: ${this.word}, LEMMA: ${this.lemma}, POS: ${this.pos}}`;
    }
}
