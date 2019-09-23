class MorseCode {
	dictTextMorse: { [key: string]: string };
	dictMorseText: { [key: string]: string };

	constructor() {
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
		for (let key in this.dictTextMorse)
			this.dictMorseText[this.dictTextMorse[key]] = key;
	}

	textToMorse(normalText: string) {
		return normalText.toLowerCase().split("").map(letter => this.dictTextMorse[letter] === undefined ? letter : this.dictTextMorse[letter] + " ").join("");
	}

	morseToText(morseText: string) {
		const text = morseText.split(" ").map(code => this.dictMorseText[code] === undefined ? (code === "" ? " " : code) : this.dictMorseText[code]).join("");
		return text.charAt(text.length - 1) === " " ? text.slice(0, -1) : text;
	}

	textHasMorse(text: string) {
		return text.split(" ").some(code => this.dictMorseText[code] !== undefined);
	}
}
