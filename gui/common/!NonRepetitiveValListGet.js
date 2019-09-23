"use strict";
var NonRepetitiveValListGet = /** @class */ (function () {
    function NonRepetitiveValListGet(list) {
        this.previousIndex = 0;
        this.list = [];
        this.list = list;
    }
    NonRepetitiveValListGet.prototype.getRandomInt = function (min, max) {
        return Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1)) + Math.ceil(min);
    };
    NonRepetitiveValListGet.prototype.random = function () {
        switch (this.list.length) {
            case 0: return '';
            case 1: return this.list[0];
            default:
                var nextIndex = this.getRandomInt(0 + 1, this.list.length - 1);
                this.previousIndex = nextIndex % this.list.length;
                return this.list[this.previousIndex];
        }
    };
    return NonRepetitiveValListGet;
}());
