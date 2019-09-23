ProductionQueue.prototype.autociv_SetAutotrain = function (active)
{
    this.autociv_Autotrain = active;
}

ProductionQueue.prototype.SpawnUnits = (function (originalFunction)
{
    return function (templateName, count, metadata)
    {
        if (!!this.autociv_Autotrain)
        {
            let cmpOwnership = Engine.QueryInterface(this.entity, IID_Ownership);
            let cmpGUIInterface = Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface);
            cmpGUIInterface.PushNotification({
                "type": "autociv_Autotrain",
                "template": templateName,
                "entities": [this.entity],
                "count": count,
                "players": [cmpOwnership.GetOwner()]
            });
        }
        return originalFunction.apply(this, arguments);
    }
})(ProductionQueue.prototype.SpawnUnits);


ProductionQueue.prototype.Serialize = function ()
{
	let state = {};
	for (var key in this)
	{
		if (!this.hasOwnProperty(key))
			continue;
		if (typeof this[key] == "function")
			continue;
		if (key == "templates")
			continue;
		if (key == "autociv_Autotrain")
			continue;
		state[key] = this[key];
	}
	return state;
}

ProductionQueue.prototype.Deserialize = function (data)
{
	for (let key in data)
	{
		if (!data.hasOwnProperty(key))
			continue;
		this[key] = data[key];
	}
}
