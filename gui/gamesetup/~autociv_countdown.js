var g_autociv_countdown = {
    "active": false,
    "default_time": parseInt(Engine.ConfigDB_GetValue("user", "autociv.gamesetup.countdown.time"), 10),
    "set_time": undefined,
    "time": undefined,
    "timeoutid": null,
    "next": function ()
    {
        if (this.time < 1)
        {
            this.stopCountdown();
            launchGame();
            return;
        }

        this.timeoutid = setTimeout(() =>
        {
            sendMessage(`Game will start in ${this.time--} seconds.`);
            this.next()
        }, 1000);
    },
    "startCountdown": function (time = this.default_time)
    {
        this.stopCountdown();
        this.set_time = time;
        this.time = time;
        if (this.valid())
            this.next();
    },
    "resetCountdown": function ()
    {
        this.startCountdown(this.set_time)
    },
    "stopCountdown": function ()
    {
        clearTimeout(this.timeoutid);
    },
    "valid": function ()
    {
        return game.is.full() && game.is.allReady() &&
            (game.get.numberOfSlots() == 2 ? !game.is.rated() : true);
    },
    "gameUpdate": function ()
    {
        if (!this.active)
            return;

        if (this.valid())
            this.resetCountdown();
        else
            this.stopCountdown();
    },
    "toggle": function (active = !this.active, time = this.default_time)
    {
        this.active = active;
        this.set_time = time;
        if (active)
        {
            selfMessage(`Countdown enabled: ${time} seconds.`);
            this.startCountdown(this.set_time);
        }
        else
        {
            selfMessage(`Countdown disabled.`);
            this.stopCountdown();
        }
    },
    "init": function ()
    {
        if (g_IsController && Engine.ConfigDB_GetValue("user", "autociv.gamesetup.countdown.enabled") == "true")
            g_autociv_countdown.toggle(true);
    }
}

autociv_patchApplyN("updateGameAttributes", function (target, that, args)
{
    let result = target.apply(that, args);
    if (g_IsController)
        g_autociv_countdown.gameUpdate();
    return result;
});
