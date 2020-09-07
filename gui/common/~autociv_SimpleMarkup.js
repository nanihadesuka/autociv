/**
 * Simple markup compatible with 0ad strings rendering options.
 */

function autociv_SimpleMarkup(inputText)
{
    return inputText.split("\n").
        filter(l => l.trim().length !== 0).
        map(l => l.replace(/\t/g, "    ").replace(/\\/g, "\\\\").replace(/\[/g, "\\[")).
        map((line, index) => autociv_SimpleMarkup.makeLine(line, 0, index)).
        join("\n")
}

// Has no concept of other possible lines (no internal state)
autociv_SimpleMarkup.makeLine = function (inputLine, depth, index)
{
    // return inputLine
    let d = (text) => autociv_SimpleMarkup.makeLine(text, depth + 1, index)
    let grabber = (regex, text) => regex.exec(text).slice(1)
    let [prefix, mainText] = grabber(/^( *)(.*)$/, inputLine)

    // Title
    if (/^#+ .*$/.test(mainText) && depth < 2)
    {
        let [hash, text] = grabber(/^(#+) (.*)$/, mainText)

        let out = size => depth != 0 ?
            `${prefix}[font="sans-bold-${size}"]${d(text)}[/font]` :
            index == 0 ?
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
    if (/^- .*$/.test(mainText) && depth < 2)
    {
        let [slash, text] = grabber(/^(-) *(.*)$/, mainText)
        return `${prefix}[font="sans-bold-16"]•[/font] ${d(text)}`
    }
    else
    {
        return `${prefix}${mainText}`
    }
}
