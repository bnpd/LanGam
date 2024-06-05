export default
class Token {
    /**
     * @param {string} word
     * @param {string} lemma
     * @param {number} pos
     * @param {{day: number, month: number, year: number}} [due]
     */
    constructor(word, lemma, pos, due) {
        this.word = word
        this.lemma = lemma;
        this.pos = pos;
        this.due = due;
    }

    /**
     * @param {{ word: string; lemma: string; pos: number; }} json
     */
    static fromJson(json) {
        const {word, lemma, pos} = json;
        return new Token(word, lemma, pos);
    }


    toString() {
        return `Token{WORD: ${this.word}, LEMMA: ${this.lemma}, POS: ${this.pos}}`;
    }
}
