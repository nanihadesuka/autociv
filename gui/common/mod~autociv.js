hasSameMods = (function (originalFunction)
{
	return function (modsA, modsB)
	{
		const modName = "fgod";
		let mod = name => !name[0].toLowerCase().startsWith(modName.toLowerCase());
		return originalFunction(modsA.filter(mod), modsB.filter(mod));
	}
})(hasSameMods);

hasSameMods = (function (originalFunction)
{
	return function (modsA, modsB)
	{
		const modName = "autociv";
		let mod = name => !name[0].toLowerCase().startsWith(modName.toLowerCase());
		return originalFunction(modsA.filter(mod), modsB.filter(mod));
	}
})(hasSameMods);


// ["ja-lang", "zh-lang", "zh_TW-lang"].forEach(modName =>
// {
// 	hasSameMods = (function (originalFunction)
// 	{
// 		return function (modsA, modsB)
// 		{
// 			let mod = name => !name[0].toLowerCase().startsWith(modName.toLowerCase());
// 			return originalFunction(modsA.filter(mod), modsB.filter(mod));
// 		}
// 	})(hasSameMods);
// });
