import { WORDS_LENGTH } from '@/consts';

export const getFilledWordsArray = <T>(value: T) => {
    return new Array(WORDS_LENGTH).fill(value);
};
