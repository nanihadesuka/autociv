var g_autociv_countdown = {
	"active": false,
	"default_time": parseInt(Engine.ConfigDB_GetValue("user", "autociv.gamesetup.countdown.time"), 10),
	"set_time": undefined,
	"time": undefined,
	"timeoutid": null,
	"next": function ()
	{
		if (this.time < 0)
		{
			this.stopCountdown()
			game.panelsButtons.startGameButton.onPress()
			return
		}

		this.timeoutid = setTimeout(() =>
		{
			sendMessage(`Game will start in ${this.time--} seconds.`)
			this.next()
		}, 1000)
	},
	"startCountdown": function (time)
	{
		this.stopCountdown()
		this.set_time = time
		this.time = time
		if (this.valid())
			this.next()
	},
	"resetCountdown": function ()
	{
		this.startCountdown(this.set_time)
	},
	"stopCountdown": function ()
	{
		clearTimeout(this.timeoutid)
	},
	"valid": function ()
	{
		return game.is.full() && game.is.allReady() &&
			(game.get.numberOfSlots() == 2 ? !game.is.rated() : true)
	},
	"gameUpdate": function ()
	{
		if (!this.active)
			return

		if (this.valid())
			this.resetCountdown()
		else
			this.stopCountdown()
	},
	"toggle": function (active = !this.active, time = this.default_time)
	{
		this.active = active
		if (active)
		{
			selfMessage(`Countdown set to ${time} seconds.`)
			this.startCountdown(time)
		}
		else
		{
			selfMessage(`Countdown disabled.`)
			this.stopCountdown()
		}
	},
	"init": function ()
	{
		if (g_IsController && Engine.ConfigDB_GetValue("user", "autociv.gamesetup.countdown.enabled") == "true")
			g_autociv_countdown.toggle(true)
	},
	"hookUpdate": () => { if (g_IsController) g_autociv_countdown.gameUpdate() }
}

autociv_patchApplyN("init", function (target, that, args)
{
	target.apply(that, args);
	g_SetupWindow.controls.gameSettingsControl.registerAssignPlayerHandler(g_autociv_countdown.hookUpdate)
	g_SetupWindow.controls.gameSettingsControl.registerGameAttributesBatchChangeHandler(g_autociv_countdown.hookUpdate)
	g_SetupWindow.controls.readyControl.registerResetReadyHandler(g_autociv_countdown.hookUpdate)
})
