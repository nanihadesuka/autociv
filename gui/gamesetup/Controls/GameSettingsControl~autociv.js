autociv_patchApplyN(GameSettingsControl.prototype, "setNetworkGameAttributesImmediately", function (target, that, args)
{
	const obj = game.attributes
	for (let key in obj)
	{
		if (typeof obj[key] != "object")
			g_GameSettings[key] = obj[key]
		else for (let subkey in obj[key])
			g_GameSettings[key][subkey] = obj[key][subkey]
	}
	return target.apply(that, args)
})
