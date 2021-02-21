autociv_patchApplyN(ProfilePage.prototype, "openPage", function (target, that, args)
{
    resizeBarManager.ghostMode = true
    return target.apply(that, args)
})
