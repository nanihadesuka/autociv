
/**
 * @param {*} text - Slice of the text from start to buffer position
 * @param {*} list - List of texts to try to auto-complete
 * @param {*} tries - Number of times to try to autocomplete
 */
tryAutoComplete = function (text, list, tries)
{
    if (!text.length)
        return text

    const wordSplit = text.split(/\s/g)
    if (!wordSplit.length)
        return text

    // Get last single word from text until the buffer position
    const lastWord = wordSplit.pop()
    if (!lastWord.length)
        return text

    let firstFound = ""
    for (var word of list)
    {
        if (word.toLowerCase().indexOf(lastWord.toLowerCase()) != 0)
            continue

        if (!firstFound)
            firstFound = word

        --tries
        if (tries < 0)
            break
    }

    if (!firstFound)
        return text

    // Wrap search to start, cause tries could not complete to 0, means there are no more matches as tries in list.
    if (tries >= 0)
    {
        autoCompleteText.state.tries = 1
        word = firstFound
    }

    text = wordSplit.join(" ")
    if (text.length > 0)
        text += " "

    return text + word
}

autoCompleteText = function (guiObject, list)
{
    const caption = guiObject.caption
    if (!caption.length)
        return

    const sameTry = autoCompleteText.state.newCaption == caption
    if (sameTry)
    {
        const textBeforeBuffer = autoCompleteText.state.oldCaption.substring(0, autoCompleteText.state.buffer_position)
        const completedText = tryAutoComplete(textBeforeBuffer, list, autoCompleteText.state.tries++)
        const newCaptionText = completedText + autoCompleteText.state.oldCaption.substring(autoCompleteText.state.buffer_position)

        autoCompleteText.state.newCaption = newCaptionText

        guiObject.caption = newCaptionText
        guiObject.buffer_position = autoCompleteText.state.buffer_position + (completedText.length - textBeforeBuffer.length)
    }
    else
    {
        const buffer_position = guiObject.buffer_position
        autoCompleteText.state.buffer_position = buffer_position
        autoCompleteText.state.oldCaption = caption
        autoCompleteText.state.tries = 0

        const textBeforeBuffer = caption.substring(0, buffer_position)
        const completedText = tryAutoComplete(textBeforeBuffer, list, autoCompleteText.state.tries++)
        const newCaptionText = completedText + caption.substring(buffer_position)

        autoCompleteText.state.newCaption = newCaptionText

        guiObject.caption = newCaptionText
        guiObject.buffer_position = buffer_position + (completedText.length - textBeforeBuffer.length)
    }
}

// Used to track previous texts from autocompletion to try next autocompletion if multiples apply.
autoCompleteText.state = {
    "buffer_position": 0,
    "newCaption": "",
    "oldCaption": "",
    "tries": 0
}

// Use the JS cache, instead of recomputing the same color
const autociv_ColorsSeenBefore = {};

/**
 * Some colors must become brighter so that they are readable on dark backgrounds.
 * Modified version from gui/lobby/LobbyPage/PlayerColor.GetPlayerColor
 * Additional check for "perceivedBrightness", if the color is already bright enough don't change it
 * https://www.w3.org/TR/AERT/#color-contrast
 * Additional check for "standardDeviation", because gray colors have the "perceivedBrightness" but are not colorful enough.
 * @param   {string}  color  string of rgb color, e.g. "10 10 190" ("Dark Blue")
 * @return  {string}         string of brighter rgb color, e.g. "61 61 245" ("Blue")
 */
function brightenedColor(color)
{
    if (autociv_ColorsSeenBefore[color])
        return autociv_ColorsSeenBefore[color]
    const [r, g, b] = color.split(" ").map(x => +x);
    const perceivedBrightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    const standardDeviation = (arr) => {
        const mean = arr.reduce((acc, val) => acc + val, 0) / arr.length;
        return Math.sqrt(arr.reduce((acc, val) => acc + (val - mean) ** 2, 0) / arr.length);
    }
    if (perceivedBrightness >= 125 || (perceivedBrightness >= 75 && standardDeviation([r, g, b]) > 10))
    {
        autociv_ColorsSeenBefore[color] = color;
        return color;
    }
    const [h, s, l] = rgbToHsl(r, g, b);
    autociv_ColorsSeenBefore[color] = hslToRgb(h, s, Math.min(l + 0.3, 0.6)).join(" ");
    return autociv_ColorsSeenBefore[color];
}
