/**
 * Returns a new list filtered and sorted by the similarity with the input text
 * @param {string} input text to seach for
 * @param {string[] | object[]} list
 * @param {string} [key] text to use if the list is made up of objects
 */
function autociv_matchsort(input, list, key = null)
{
    input = input.toLowerCase();

    let result = [];

    if (key == null)
        for (let text of list)
        {
            let score = autociv_matchsort.scoreText(input, text);
            if (score !== undefined)
                result.push([score, text])
        }
    else
        for (let obj of list)
        {
            let score = autociv_matchsort.scoreText(input, obj[key]);
            if (score !== undefined)
                result.push([score, obj])
        }

    result.sort((a, b) => a[0] - b[0]);
    return result.map(v => v[1]);
};

// The lower the score the better the match
autociv_matchsort.scoreText = function (input, text)
{
    if (!input || !text)
        return undefined;

    // Exact match
    if (input == text)
        return -16000;

    text = text.toLowerCase();

    // Exact match lowercased (relaxed)
    if (input == text)
        return -8000;

    let score = 0;
    let offset = -1;
    for (let i = 0; i < input.length; i++)
    {
        let char = input[i];

        let offsetNext = text.indexOf(char, offset + 1);
        // No match
        if (offsetNext == -1)
            return undefined;

        // Lower score increase if consecutive index
        let isConsecutive = offsetNext == offset + 1 ? 0 : 1;
        score += offsetNext + isConsecutive * offsetNext;
        offset = offsetNext;
    }
    if (input.length < text.length)
        score += text.length - input.length;
    return score;
};
