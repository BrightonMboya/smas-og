// dependencies
import { storage } from "."
import swahiliWords from './swahiliWords';
import englishWords from './englishWords';

// translator
const translate = (word: string): string => {
    try {

        if (word && (word.trim().length > 0) && (swahiliWords.length === englishWords.length)) {

            // retreiving user current language
            const currentLanguage = storage.retrieve("language")

            // remove special _ character on word
            let translatedWord: string = word.trim().replace(/_/g, " ").toLowerCase()

            const wordExistInEnglishWords: string | undefined = englishWords.find((word: string) => (word.trim().toLowerCase() === translatedWord))
            const wordExistInSwahiliWords: string | undefined = swahiliWords.find((word: string) => (word.trim().toLowerCase() === translatedWord))

            // translating from english to swahili
            if (wordExistInEnglishWords && (currentLanguage === "swahili"))
                translatedWord = swahiliWords[englishWords.indexOf(wordExistInEnglishWords)]

            // translating from swahili to english
            else if (wordExistInSwahiliWords && (currentLanguage === "english"))
                translatedWord = englishWords[swahiliWords.indexOf(wordExistInSwahiliWords)]

            // returning translated word
            return translatedWord[0].toUpperCase() + translatedWord.toLowerCase()?.substring(1)

        }

        return word

    } catch (error) {
        console.log(`Translation error: ${(error as Error).message}`)
        return word
    }
}

// exporting translator
export default translate