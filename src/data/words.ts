import {filterMap, removeDuplicates} from '@augment-vir/common';
import {array as badWords} from 'badwords-list';
import mostCommonEnglishWords from 'wordlist-english/english-words-10.json' with {type: 'json'};
import commonEnglishWords from 'wordlist-english/english-words-20.json' with {type: 'json'};
import familiarEnglishWords from 'wordlist-english/english-words-35.json' with {type: 'json'};

export const typingWords: ReadonlyArray<string> = removeDuplicates(
    filterMap(
        [
            ...mostCommonEnglishWords,
            ...commonEnglishWords,
            ...familiarEnglishWords,
        ] as ReadonlyArray<string>,
        (word) => word.trim().toLowerCase(),
        (word) => /^[a-z]{3}$/u.test(word) && !badWords.includes(word),
    ),
);
