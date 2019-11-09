ProductionQueue.prototype.autociv_SetAutotrain = function (active)
{
	this.autociv_autotrain = active;
}


autociv_patchApplyN(ProductionQueue.prototype, "SpawnUnits", function (target, that, args)
{
	let [templateName, count, metadata] = args;
	if (that.autociv_autotrain)
	{
		let cmpOwnership = Engine.QueryInterface(that.entity, IID_Ownership);
		let cmpGUIInterface = Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface);
		cmpGUIInterface.PushNotification({
			"type": "autociv_autotrain",
			"template": templateName,
			"entities": [that.entity],
			"count": count,
			"players": [cmpOwnership.GetOwner()]
		});
	}
	return target.apply(that, args);
})


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
		if (key == "autociv_autotrain")
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
