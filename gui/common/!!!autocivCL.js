var g_autociv_is24 = Engine.GetEngineInfo().engine_version == "0.0.24";
var g_autociv_isFGod = Engine.GetEngineInfo().mods.some(([name, version]) => /^FGod.*/i.test(name));
