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
