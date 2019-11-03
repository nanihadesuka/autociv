if (!Visibility.prototype.OnDestroy)
    Visibility.prototype.OnDestroy = function () { };

patchApplyN(Visibility.prototype, "OnDestroy", function (target, that, args)
{
    let cmpGUIInterface = Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface);
    cmpGUIInterface.autociv_corpse.entities.delete(that.entity);
    return target.apply(that, args);
})

Engine.ReRegisterComponentType(IID_Visibility, "Visibility", Visibility);
