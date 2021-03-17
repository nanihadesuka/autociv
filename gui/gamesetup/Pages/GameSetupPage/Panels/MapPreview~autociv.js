autociv_patchApplyN(MapPreview.prototype, "onGameAttributesBatchChange", function (target, that, args)
{
    let res = target.apply(that, args)

    if (g_autociv_maps.has(g_GameAttributes.map))
    {
        that.mapInfoName.size = "5 100%-50 100% 100%-1"
        that.mapInfoName.caption = `${that.mapInfoName.caption} \n[color="225 60 10"]AutoCiv map, only players with mod can join[/color]`
    }

    return res
})
