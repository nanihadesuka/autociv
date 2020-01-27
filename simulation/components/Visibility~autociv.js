if (!Visibility.prototype.OnDestroy)
    Visibility.prototype.OnDestroy = function () { };

autociv_patchApplyN(Visibility.prototype, "OnDestroy", function (target, that, args)
{
    let cmpGUIInterface = Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface);
    cmpGUIInterface.autociv.corpse.entities.delete(that.entity);
    return target.apply(that, args);
})

Engine.ReRegisterComponentType(IID_Visibility, "Visibility", Visibility);
