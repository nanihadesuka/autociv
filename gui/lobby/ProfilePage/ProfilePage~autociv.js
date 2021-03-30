autociv_patchApplyN(ProfilePage.prototype, "openPage", function (target, that, args)
{
    g_resizeBarManager.ghostMode = true
    return target.apply(that, args)
})
