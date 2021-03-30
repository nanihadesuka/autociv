autociv_patchApplyN("hasSameMods", function (target, that, args)
{
	let mod = ([name, version]) => !/^AutoCiv.*/i.test(name);
	return target.apply(that, args.map(mods => mods.filter(mod)));
})
