import { WORDS_LENGTH } from '@/consts';
import { words_ddbb } from './get-words';

export const getRandomWords = (): string[] => {
    const shuffledWords = [...words_ddbb];
    for (let i = shuffledWords.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledWords[i], shuffledWords[j]] = [shuffledWords[j], shuffledWords[i]];
    }
    return shuffledWords.slice(0, WORDS_LENGTH);
};
