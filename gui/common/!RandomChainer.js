"use strict";
var RandomChain = /** @class */ (function () {
    function RandomChain(list) {
        this.chain = {};
        this.chainList = [];
        this.mark = new Set(["", ".", "?", "!", "’", "'", ",", ":"]);
        this.endProblem = new Set([
            "of", "my", "your", "its", "nor",
            "a", "&", "and", "the", "with", "are",
            "to", "we", "has", "its", ",", "yet",
            "per", "is", "as", "at", "by", "for", "you",
            "doesn't", "in", "or"
        ]);
        this.chain = {};
        for (var _i = 0, list_1 = list; _i < list_1.length; _i++) {
            var text = list_1[_i];
            var lexis = text.split(/([A-Za-z0-9_\'’]*)/).filter(function (v) {
                return !["", "(", ")", '"'].includes(v.trim());
            });
            for (var i = 0; i < lexis.length; ++i) {
                var value = (lexis.length == i + 1) || (i > 0 && lexis[i] == ".") ?
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
    RandomChain.prototype.randomKey = function () {
        return this.chainList[Math.floor(this.chainList.length * Math.random())];
    };
    ;
    RandomChain.prototype.arrayRandomValue = function (list) {
        return list == undefined || list == null ?
            undefined :
            list[Math.floor(list.length * Math.random())];
    };
    ;
    RandomChain.prototype.randomValueFrom = function (key) {
        return this.arrayRandomValue(this.chain[key]);
    };
    ;
    RandomChain.prototype.isMark = function (word) { return this.mark.has(word); };
    RandomChain.prototype.isEndProblem = function (word) { return this.endProblem.has(word); };
    RandomChain.prototype.fix = function (word) {
        switch (word) {
            case "i":
                return "I";
            default:
                return word;
        }
    };
    RandomChain.prototype.genRandomText = function () {
        var _this = this;
        var tries = 0;
        var triesMax = 50;
        var genText = function () {
            if (tries++ > triesMax)
                return "beep boop";
            var words = [];
            var firstWord = _this.randomKey();
            if (_this.isMark(firstWord))
                return genText();
            words.push(firstWord);
            var nWords = 7 + Math.floor(15 * Math.random());
            for (var i = 0; i < 50 && words.length < nWords; ++i) {
                var nextWord = _this.randomValueFrom(firstWord);
                if (nextWord === undefined || nextWord === null)
                    break;
                words.push(nextWord);
                firstWord = nextWord;
            }
            if (words.length < nWords)
                return genText();
            if (_this.isEndProblem(words[words.length - 1]))
                return genText();
            var text = words[0];
            for (var i = 1; i < words.length; ++i) {
                text += _this.isMark(words[i]) ? "" : " ";
                text += _this.fix(words[i]);
            }
            return text;
        };
        return genText();
    };
    return RandomChain;
}());
