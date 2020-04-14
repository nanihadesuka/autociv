class ConfigJSON {
    identifier: string;
    saveToDisk: boolean;
    key: string;
    data: any;

    /**
     * @param identifier Must not contain spaces
     * @param saveToDisk If true that data will not be saved to disk (at least not by itself)
     */
    constructor(identifier: string, saveToDisk: boolean = true) {
        this.identifier = identifier;
        this.saveToDisk = saveToDisk;
        this.key = "autociv.data." + this.identifier;
        this.load();
    }

    load(): void {
        let value = Engine.ConfigDB_GetValue("user", this.key);
        if (value === "") {
            this.data = {};
            this.save();
            return;
        }
        this.data = JSON.parse(decodeURIComponent(value));
    }

    save(): void {
        let value = encodeURIComponent(JSON.stringify(this.data));
        Engine.ConfigDB_CreateValue("user", this.key, value);
        if (this.saveToDisk)
            Engine.ConfigDB_WriteValueToFile("user", this.key, value, "config/user.cfg");
    }

    isEmpty(): boolean {
        return Object.keys(this.data).length === 0;
    }

    hasValue(id: string): boolean {
        return id in this.data;
    }

    getValue(id: string): any {
        return this.data[id];
    }

    getIds(): Array<string> {
        return Object.keys(this.data);
    }

    setValue(id: string, value: any) {
        this.data[id] = value;
        this.save();
    }

    removeValue(id: string): void {
        delete this.data[id];
        this.save();
    }

    removeAllValues(): void {
        this.data = {};
        this.save();
    }
}
