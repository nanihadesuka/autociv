hasSameMods = (function (originalFunction)
{
	return function (modsA, modsB)
	{
		let mod = ([name, version]) => !/^FGod.*/i.test(name);
		return originalFunction(modsA.filter(mod), modsB.filter(mod));
	}
})(hasSameMods);

hasSameMods = (function (originalFunction)
{
	return function (modsA, modsB)
	{
		let mod = ([name, version]) => !/^AutoCiv.*/i.test(name);
		return originalFunction(modsA.filter(mod), modsB.filter(mod));
	}
})(hasSameMods);
