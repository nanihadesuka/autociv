class ConfigJSON
{
    identifier: string
    saveToDisk: boolean
    implicitSave: boolean
    key: string
    data: any

    /**
     * @param identifier Must not contain spaces
     * @param saveToDisk If true the data will be saved to disk
     * @param implicitSave Will automatically save when the data is modified
     */
    constructor(identifier: string, saveToDisk: boolean = true, implicitSave: boolean = true)
    {
        this.identifier = identifier
        this.saveToDisk = saveToDisk
        this.implicitSave = implicitSave
        this.key = "autociv.data." + this.identifier
        this.load()
    }

    load(): void
    {
        let value = Engine.ConfigDB_GetValue("user", this.key)
        if (value === "") {
            this.data = {}
            if (this.implicitSave)
                this.save()
            return
        }
        this.data = JSON.parse(decodeURIComponent(value))
    }

    save(): void
    {
        let value = encodeURIComponent(JSON.stringify(this.data))
        Engine.ConfigDB_CreateValue("user", this.key, value)
        if (this.saveToDisk)
            Engine.ConfigDB_WriteValueToFile("user", this.key, value, "config/user.cfg")
    }

    isEmpty(): boolean
    {
        return Object.keys(this.data).length === 0
    }

    hasValue(id: string): boolean
    {
        return id in this.data
    }

    getValue(id: string): any
    {
        return this.data[id]
    }

    getIds(): Array<string>
    {
        return Object.keys(this.data)
    }

    setValue(id: string, value: any)
    {
        this.data[id] = value
        if (this.implicitSave)
            this.save()
    }

    removeValue(id: string): void
    {
        delete this.data[id]
        if (this.implicitSave)
            this.save()
    }

    removeAllValues(): void
    {
        this.data = {}
        if (this.implicitSave)
            this.save()
    }
}
