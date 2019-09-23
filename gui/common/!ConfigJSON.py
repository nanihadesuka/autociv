class ConfigJSON:
    def __init__(self, identifier, saveToDisk=True):
        self.identifier = identifier
        self.saveToDisk = saveToDisk
        self.key = "autociv.data." + self.identifier
        self.load()

    def load(self):
        value = Engine.ConfigDB_GetValue("user", self.key)
        if value is "":
            self.data = {}
            self.save()
        else:
            self.data = JSON.parse(decodeURIComponent(value))

    def save(self):
        value = encodeURIComponent(JSON.stringify(self.data))
        Engine.ConfigDB_CreateValue("user", self.key, value)
        if self.saveToDisk:
            Engine.ConfigDB_WriteValueToFile(
                "user", self.key, value, "config/user.cfg")

    def isEmpty(self):
        return len(self.data) == 0

    def hasValue(self, id):
        return id in self.data

    def getValue(self, id):
        return self.data[id]

    def getIds(self):
        return Object.keys(self.data)

    def setValue(self, id, value):
        self.data[id] = value
        self.save()

    def removeValue(self,id):
        del self.data[id]
        self.save()

    def removeAllValues(self):
        self.data = {}
        self.save()
