// Set.prototype.isSuperset = function (set)
// {
//     for (let elem of set)
//         if (!this.has(elem))
//             return false;
//     return true;
// }

// Set.prototype.union = function (set)
// {
//     let _union = new Set(this);
//     for (let elem of set)
//         _union.add(elem);
//     return _union;
// }

// Set.prototype.intersection = function (set)
// {
//     let _intersection = new Set();
//     for (let elem of set)
//         if (this.has(elem))
//             _intersection.add(elem);
//     return _intersection;
// }

// Set.prototype.symmetricDifference = function (set)
// {
//     let _difference = new Set(this);
//     for (let elem of set)
//     {
//         if (_difference.has(elem))
//             _difference.delete(elem);
//         else
//             _difference.add(elem);
//     }
//     return _difference;
// }



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
        {
            start = 0;
        }

        if (start + search.length > this.length)
        {
            return false;
        } else
        {
            return this.indexOf(search, start) !== -1;
        }
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

if (!String.prototype.padStart)
{
    String.prototype.padStart = function padStart(targetLength, padString)
    {
        targetLength = targetLength >> 0; //truncate if number, or convert non-number to 0;
        padString = String(typeof padString !== 'undefined' ? padString : ' ');
        if (this.length >= targetLength)
        {
            return String(this);
        }
        else
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

if (!String.prototype.padEnd)
{
    String.prototype.padEnd = function padEnd(targetLength, padString)
    {
        targetLength = targetLength >> 0; //floor if number or convert non-number to 0;
        padString = String((typeof padString !== 'undefined' ? padString : ' '));
        if (this.length > targetLength)
        {
            return String(this);
        }
        else
        {
            targetLength = targetLength - this.length;
            if (targetLength > padString.length)
            {
                padString += padString.repeat(targetLength / padString.length); //append to original to ensure we are longer than needed
            }
            return String(this) + padString.slice(0, targetLength);
        }
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

// https://estada.ch/2019/6/10/javascript-arrayprototypeflatmap-polyfill/
if (!Array.prototype.flatMap)
{
    Object.defineProperty(Array.prototype, 'flatMap', {
        value: function (callback, thisArg)
        {
            var self = thisArg || this;
            if (self === null)
            {
                throw new TypeError('Array.prototype.flatMap ' +
                    'called on null or undefined');
            }
            if (typeof callback !== 'function')
            {
                throw new TypeError(callback +
                    ' is not a function');
            }

            var list = [];

            // 1. Let O be ? ToObject(this value).
            var o = Object(self);

            // 2. Let len be ? ToLength(? Get(O, "length")).
            var len = o.length >>> 0;

            for (var k = 0; k < len; ++k)
            {
                if (k in o)
                {
                    var part_list = callback.call(self, o[k], k, o);
                    list = list.concat(part_list);
                }
            }

            return list;
        }
    });
}
