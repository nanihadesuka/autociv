autociv_patchApplyN(ProductionQueue.prototype, "SpawnUnits", function (target, that, args)
{
	let [templateName, count, metadata] = args;
	const cmpGUIInterface = Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface);
	if (cmpGUIInterface.autociv.ProductionQueue_autotrain.has(that.entity))
	{
		const cmpOwnership = Engine.QueryInterface(that.entity, IID_Ownership);
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

autociv_patchApplyN(ProductionQueue.prototype, "OnDestroy", function (target, that, args)
{
	autociv_ProductionQueue_autotrain.delete(that.entity)
	return target.apply(that, args);
})

Engine.ReRegisterComponentType(IID_ProductionQueue, "ProductionQueue", ProductionQueue);
