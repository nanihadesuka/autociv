autociv_patchApplyN(ChatMessageEvents.Subject.prototype, "onSubjectChange", function (target, that, args)
{
    if (Engine.ConfigDB_GetValue("user", "autociv.lobby.chat.subject.hide") == "true")
        return;
    return target.apply(that, args);
});
