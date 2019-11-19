
// "actions" per minute counter, time in microseconds
var autociv_APM = {
    "total": { "start": Engine.GetMicroseconds() / 1000000, "count": 0 },
    "last": { "time": Engine.GetMicroseconds() / 1000000, "count": 0 },
    "list": [],
    "interval": 10,
    "init": function ()
    {
        this.GUI = Engine.GetGUIObjectByName("gl_autocivSessionAMP");
        this.GUIOverlay = Engine.GetGUIObjectByName("gl_autocivSessionAMPOverlay");
        this.GUIChart = Engine.GetGUIObjectByName("gl_autocivSessionAMPChart");
        this.GUIChartBackground = Engine.GetGUIObjectByName("gl_autocivSessionAMPChartBackground");
        this.GUITotalGameAverage = Engine.GetGUIObjectByName("gl_autocivSessionAMPTotalGameAverage");

        this.GUIOverlay.caption = "AMP:" + this.format(0, 1);
        this.GUIOverlay.onMouseLeftPress = () => this.toggleChart();
        this.toggle(Engine.ConfigDB_GetValue("user", "autociv.session.AMP.enabled") == "true");

        this.GUIChart.series_color = ["red"];
        this.GUIChart.axis_width = 0;
        this.GUIChart.axis_color = "120 120 120";
        this.toggleChart(Engine.ConfigDB_GetValue("user", "autociv.session.AMP.chart.enabled") == "true")
    },
    get active() { return !this.GUI.hidden },
    "toggle": function (activate)
    {
        let active = activate === undefined ? !this.active : activate;
        this.GUI.hidden = !active;
    },
    get activeChart() { return !this.GUIChartBackground.hidden && this.active },
    "toggleChart": function (activate)
    {
        if (!this.active)
            return;

        let active = activate === undefined ? !this.activeChart : activate;
        this.GUIChartBackground.hidden = !active;
        if (active)
            this.updateChart();
    },
    "getGameTime": function () { return GetSimState().timeElapsed / 1000; },
    "getRealTime": function () { return Engine.GetMicroseconds() / 1000000; },
    "add": function (ev)
    {
        if (!this.active)
            return;

        let isMouseButtonUp = "type" in ev && ev.type == "mousebuttonup";
        let isKeySymUp = "keysym" in ev && ev.type == "keyup";

        if (!(isMouseButtonUp || isKeySymUp))
            return;

        ++this.last.count;
        ++this.total.count;
        if (this.last.count && this.last.count % 5 == 0)
            this.GUIOverlay.caption = "APM:" + this.format(this.last.count, this.getRealTime() - this.last.time);
    },
    "format": function (count, diff, pad = 5)
    {
        let text = (count / diff * 60).toFixed(0);
        return " ".repeat(Math.max(0, pad - text.length)) + text;
    },
    "updateChart": function ()
    {
        this.GUIChart.series = [this.list];
        this.GUITotalGameAverage.caption = "Game avg APM: " + this.format(this.total.count, this.getRealTime() - this.total.start, 0);
    },
    "onTick": function ()
    {
        if (!this.active)
            return;

        let time = this.getRealTime();
        let diff = time - this.last.time;
        if (diff < this.interval)
            return;

        this.GUIOverlay.caption = "APM:" + this.format(this.last.count, diff);

        this.list.push([this.getGameTime(), this.last.count / diff * 60]);
        if (this.list.length > 20)
            this.list.shift();

        if (this.activeChart)
            this.updateChart();

        this.last.time = time;
        this.last.count = 0;
    }
}
