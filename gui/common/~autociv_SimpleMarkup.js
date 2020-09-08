/**
 * Simple markup compatible with 0ad strings rendering options.
 */

function autociv_SimpleMarkup(inputText)
{
    return inputText.split("\n").
        filter(l => l.trim().length !== 0).
        map(l => l.replace(/\t/g, "    ")).
        map((line, index) => autociv_SimpleMarkup.makeLine(line, 0, index)).
        join("\n")
}

autociv_SimpleMarkup.escape = function (text)
{
    return text.replace(/\\/g, "\\\\").replace(/\[/g, "\\[")
}

/**
 * Function has no concept of other possible lines (no internal state)
 * Must return valid pyrogenesis text string format
 */
autociv_SimpleMarkup.makeLine = function (input, depth, lineIndex)
{
    let d = (text) => autociv_SimpleMarkup.makeLine(text, depth + 1, lineIndex)
    let grabber = (regex, text) => regex.exec(text).slice(1)
    let [prefix, body] = grabber(/^( *)(.*)$/, input)

    // Title
    if (/^#+ .*$/.test(body) && depth < 2)
    {
        let [hash, text] = grabber(/^(#+) (.*)$/, body)

        let out = size => depth != 0 ?
            `${prefix}[font="sans-bold-${size}"]${d(text)}[/font]` :
            lineIndex == 0 ?
                `${prefix}[font="sans-bold-${size}"]${d(text)}[/font]\n` :
                `\n\n${prefix}[font="sans-bold-${size}"]${d(text)}[/font]\n`;

        switch (hash.length)
        {
            case 1: return out(24)
            case 2: return out(22)
            case 3: return out(20)
            case 4: return out(18)
            case 5: return out(16)
            case 6: return out(14)
            case 7: return out(13)
            default: return out(12)
        }
    }
    // Bullet point
    if (/^- .*$/.test(body) && depth < 2)
    {
        let [slash, text] = grabber(/^(-) *(.*)$/, body)
        return `${prefix}[font="sans-bold-16"]•[/font] ${d(text)}`
    }
    else
    {
        return autociv_SimpleMarkup.escape(`${prefix}${body}`)
    }
}
