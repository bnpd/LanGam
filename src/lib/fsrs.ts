import {createEmptyCard, fsrs, generatorParameters, type Card, type ReviewLog, type Grade, type RecordLogItem} from 'ts-fsrs';

const params = generatorParameters({ enable_fuzz: true });
const f = fsrs(params);

export class VocabCard {
    id?: string
    word: string;
    meaning: string;
    reversed: boolean;
    notes?: string;
    pronunciation?: string;
    genus?: string;
    log: ReviewLog[];
    card: Card;

    constructor(word: string, meaning: string, reversed: boolean, notes?: string, pronunciation?: string, genus?: string) {
        const emptyCard = createEmptyCard();
        this.word = word;
        this.meaning = meaning;
        this.reversed = reversed;
        this.notes = notes;
        this.pronunciation = pronunciation;
        this.genus = genus;
        this.log = [];
        this.card = emptyCard;
    }

    // Static method to create a VocabCard from a JSON object
    static fromJson(json: any): VocabCard {
        const card = new VocabCard(
            json.word,
            json.meaning,
            json.reversed,
            json.notes,
            json.pronunciation,
            json.genus
        );
        card.id = json.id
        card.log = json.log ?? card.log
        const {rating, state, due, stability, difficulty, elapsed_days, last_elapsed_days, scheduled_days, review} = json
        card.card = json.card ?? {rating, state, due, stability, difficulty, elapsed_days, last_elapsed_days, scheduled_days, review}
        return card
    }

    review(rating: Grade): void {
        const scheduling_card: RecordLogItem = f.next(this.card, new Date(), rating);
        this.card = scheduling_card.card;
        this.log.push(scheduling_card.log);
    }
}
