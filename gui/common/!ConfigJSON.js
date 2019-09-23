"use strict";
var ConfigJSON = /** @class */ (function () {
    /**
     * @param identifier Must not contain spaces
     * @param saveToDisk If true that data will not be saved to disk
     */
    function ConfigJSON(identifier, saveToDisk) {
        if (saveToDisk === void 0) { saveToDisk = true; }
        this.identifier = identifier;
        this.saveToDisk = saveToDisk;
        this.key = "autociv.data." + this.identifier;
        this.load();
    }
    ;
    ConfigJSON.prototype.load = function () {
        var value = Engine.ConfigDB_GetValue("user", this.key);
        if (value === "") {
            this.data = {};
            this.save();
            return;
        }
        this.data = JSON.parse(decodeURIComponent(value));
    };
    ;
    ConfigJSON.prototype.save = function () {
        var value = encodeURIComponent(JSON.stringify(this.data));
        Engine.ConfigDB_CreateValue("user", this.key, value);
        if (this.saveToDisk)
            Engine.ConfigDB_WriteValueToFile("user", this.key, value, "config/user.cfg");
    };
    ConfigJSON.prototype.isEmpty = function () {
        return Object.keys(this.data).length === 0;
    };
    ConfigJSON.prototype.hasValue = function (id) {
        return id in this.data;
    };
    ;
    ConfigJSON.prototype.getValue = function (id) {
        return this.data[id];
    };
    ;
    ConfigJSON.prototype.getIds = function () {
        return Object.keys(this.data);
    };
    ConfigJSON.prototype.setValue = function (id, value) {
        this.data[id] = value;
        this.save();
    };
    ;
    ConfigJSON.prototype.removeValue = function (id) {
        delete this.data[id];
        this.save();
    };
    ;
    ConfigJSON.prototype.removeAllValues = function () {
        this.data = {};
        this.save();
    };
    ;
    return ConfigJSON;
}());
