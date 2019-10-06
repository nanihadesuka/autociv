class RandomChain {
    chain: any = {};
    chainList: any[] = [];
    mark = new Set(["", ".", "?", "!", "’", "'", ",", ":"]);
    endProblem = new Set([
        "of", "my", "your", "its", "nor",
        "a", "&", "and", "the", "with", "are",
        "to", "we", "has", "its", ",", "yet",
        "per", "is", "as", "at", "by", "for", "you",
        "doesn't", "in", "or"]);

    constructor(list: string[]) {
        this.chain = {};

        for (let text of list) {
            let lexis = text.split(/([A-Za-z0-9_\'’]*)/).filter(v =>
                !["", "(", ")", '"'].includes(v.trim())
            );
            for (let i = 0; i < lexis.length; ++i) {

                let value = (lexis.length == i + 1) || (i > 0 && lexis[i] == ".") ?
                    null :
                    lexis[i + 1];

                if (this.chain[lexis[i]] !== undefined) {
                    this.chain[lexis[i]].push(value);
                    this.chainList.push(lexis[i]);
                }
                else
                    this.chain[lexis[i]] = [value];
            }
        }
    }

    randomKey(): string {
        return this.chainList[Math.floor(this.chainList.length * Math.random())];
    };

    arrayRandomValue(list: string[] | undefined | null): undefined | string {
        return list == undefined || list == null ?
            undefined :
            list[Math.floor(list.length * Math.random())];
    };

    randomValueFrom(key: string): undefined | string {
        return this.arrayRandomValue(this.chain[key]);
    };

    isMark(word: string): boolean { return this.mark.has(word); }
    isEndProblem(word: string): boolean { return this.endProblem.has(word); }

    fix(word: string): string {
        switch (word) {
            case "i":
                return "I";
            default:
                return word;
        }
    }

    genRandomText(): string {

        let tries = 0;
        const triesMax = 50;

        let genText = (): string => {

            if (tries++ > triesMax)
                return "beep boop"

            let words = [];
            let firstWord = this.randomKey();
            if (this.isMark(firstWord))
                return genText();

            words.push(firstWord);
            let nWords = 7 + Math.floor(15 * Math.random());
            for (let i = 0; i < 50 && words.length < nWords; ++i) {
                let nextWord = this.randomValueFrom(firstWord);
                if (nextWord === undefined || nextWord === null)
                    break;
                words.push(nextWord);
                firstWord = nextWord;
            }

            if (words.length < nWords)
                return genText();

            if (this.isEndProblem(words[words.length - 1]))
                return genText();

            let text = words[0];
            for (let i = 1; i < words.length; ++i) {
                text += this.isMark(words[i]) ? "" : " ";
                text += this.fix(words[i]);
            }

            return text;
        }

        return genText();
    }
}
