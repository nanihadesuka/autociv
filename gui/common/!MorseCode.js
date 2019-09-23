"use strict";
var MorseCode = /** @class */ (function () {
    function MorseCode() {
        this.dictTextMorse = {
            "a": ".-",
            "b": "-...",
            "c": "-.-.",
            "d": "-..",
            "e": ".",
            "f": "..-.",
            "g": "--.",
            "h": "....",
            "i": "..",
            "j": ".---",
            "k": "-.-",
            "l": ".-..",
            "m": "--",
            "n": "-.",
            "o": "---",
            "p": ".--.",
            "q": "--.-",
            "r": ".-.",
            "s": "...",
            "t": "-",
            "u": "..-",
            "v": "...-",
            "w": ".--",
            "x": "-..-",
            "y": "-.--",
            "z": "--..",
            "0": "-----",
            "1": ".----",
            "2": "..---",
            "3": "...--",
            "4": "....-",
            "5": ".....",
            "6": "-....",
            "7": "--...",
            "8": "---..",
            "9": "----.",
            "ä": ".-.-",
            "á": ".--.-",
            "å": ".--.-",
            "é": "..-..",
            "ñ": "--.--",
            "ö": "---.",
            "ü": "..--",
            "ç": "-.-..",
            "&": ".-...",
            "'": ".----.",
            "@": ".--.-.",
            ")": "-.--.-",
            "(": "-.--.",
            ":": "---...",
            ",": "--..--",
            "=": "-...-",
            "!": "-.-.--",
            ".": ".-.-.-",
            "-": "-....-",
            "+": ".-.-.",
            '"': ".-..-.",
            "?": "..--..",
            "/": "-..-."
        };
        this.dictMorseText = {};
        // swap: make the key the value and vice-versa
        for (var key in this.dictTextMorse)
            this.dictMorseText[this.dictTextMorse[key]] = key;
    }
    MorseCode.prototype.textToMorse = function (normalText) {
        var _this = this;
        return normalText.toLowerCase().split("").map(function (letter) { return _this.dictTextMorse[letter] === undefined ? letter : _this.dictTextMorse[letter] + " "; }).join("");
    };
    MorseCode.prototype.morseToText = function (morseText) {
        var _this = this;
        var text = morseText.split(" ").map(function (code) { return _this.dictMorseText[code] === undefined ? (code === "" ? " " : code) : _this.dictMorseText[code]; }).join("");
        return text.charAt(text.length - 1) === " " ? text.slice(0, -1) : text;
    };
    MorseCode.prototype.textHasMorse = function (text) {
        var _this = this;
        return text.split(" ").some(function (code) { return _this.dictMorseText[code] !== undefined; });
    };
    return MorseCode;
}());
