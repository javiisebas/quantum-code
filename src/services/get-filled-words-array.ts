import { WORDS_LENGTH } from '@/consts';

export const getFilledWordsArray = (value: any) => {
    return new Array(WORDS_LENGTH).fill(value);
};
