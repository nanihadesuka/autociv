if (!Set.prototype.difference)
{
    Set.prototype.difference = function (set)
    {
        let _difference = new Set(this);
        for (let elem of set)
            _difference.delete(elem);
        return _difference;
    }
}

if (!String.prototype.includes)
{
    String.prototype.includes = function (search, start)
    {
        'use strict';
        if (typeof start !== 'number')
            start = 0;

        if (start + search.length > this.length)
            return false;
        else
            return this.indexOf(search, start) !== -1;
    };
}

if (!Object.entries)
{
    Object.entries = function (obj)
    {
        let ownProps = Object.keys(obj),
            i = ownProps.length,
            resArray = new Array(i); // preallocate the Array
        while (i--)
            resArray[i] = [ownProps[i], obj[ownProps[i]]];

        return resArray;
    };
}

if (!Array.prototype.includes)
{
    Object.defineProperty(Array.prototype, "includes", {
        enumerable: false,
        value: function (obj)
        {
            return this.indexOf(obj) != -1;
        }
    });
}


if (!String.prototype.padStart)
{
    String.prototype.padStart = function padStart(targetLength, padString)
    {
        targetLength = targetLength >> 0; //truncate if number, or convert non-number to 0;
        padString = String(typeof padString !== 'undefined' ? padString : ' ');
        if (this.length >= targetLength)
        {
            return String(this);
        } else
        {
            targetLength = targetLength - this.length;
            if (targetLength > padString.length)
            {
                padString += padString.repeat(targetLength / padString.length); //append to original to ensure we are longer than needed
            }
            return padString.slice(0, targetLength) + String(this);
        }
    };
}
