autociv_patchApplyN(GameSettingsControl.prototype, "setNetworkGameAttributesImmediately", function (target, that, args)
{
	const obj = game.attributes
	for (let key in obj)
	{
		if (typeof obj[key] != "object")
			g_GameAttributes[key] = obj[key]
		else for (let subkey in obj[key])
			g_GameAttributes[key][subkey] = obj[key][subkey]
	}
	return target.apply(that, args)
})
