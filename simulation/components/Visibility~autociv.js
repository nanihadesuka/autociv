if (!Visibility.prototype.OnDestroy)
    Visibility.prototype.OnDestroy = function () { };

Visibility.prototype.OnDestroy = (function (originalFunction)
{
    return function ()
    {
        let cmpGUIInterface = Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface);
        cmpGUIInterface.autociv_corpse.entities.delete(this.entity);
        return originalFunction.apply(this, arguments);
    }
})(Visibility.prototype.OnDestroy);

Engine.ReRegisterComponentType(IID_Visibility, "Visibility", Visibility);
