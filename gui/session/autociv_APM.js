// "actions" per minute counter, time in microseconds
var autociv_APM = {
    "total": { "start": Engine.GetMicroseconds() / 1000000, "count": 0 },
    "last": { "time": Engine.GetMicroseconds() / 1000000, "count": 0 },
    "queue": [], // FIFO behaviour
    "interval": 10, // seconds
    "nIntervalsChart": 20,
    "init": function ()
    {
        this.GUI = Engine.GetGUIObjectByName("gl_autocivSessionAPM");
        this.GUIOverlay = Engine.GetGUIObjectByName("gl_autocivSessionAPMOverlay");
        this.GUIChart = Engine.GetGUIObjectByName("gl_autocivSessionAPMChart");
        this.GUIChartBackground = Engine.GetGUIObjectByName("gl_autocivSessionAPMChartBackground");
        this.GUITotalGameAverage = Engine.GetGUIObjectByName("gl_autocivSessionAPMTotalGameAverage");

        this.GUIOverlay.caption = "APM:" + this.format(0, 1);
        this.GUIOverlay.tooltip = "Click to toggle APM chart";
        this.GUIOverlay.onMouseLeftPress = () => this.toggleChart();
        this.toggle(Engine.ConfigDB_GetValue("user", "autociv.session.APM.enabled") == "true");

        this.GUIChart.series_color = ["red"];
        this.GUIChart.axis_width = 0;
        this.GUIChart.axis_color = "120 120 120";
        this.toggleChart(Engine.ConfigDB_GetValue("user", "autociv.session.APM.chart.enabled") == "true");

        // Fill the chart list
        for (let i = 0; i < this.nIntervalsChart; ++i)
        {
            let gameTime = this.getGameTime() - this.interval * (this.nIntervalsChart - i);
            this.queue.push([gameTime, 0]);
            this.queue.push([gameTime, 0]);
        }

        // Hack: Update bounding objects size so it wont overlap
        autociv_patchApplyN("appendSessionCounters", (target, that, args) =>
        {
            let result = target.apply(that, args);

            let GUISize = this.GUI.size;
            GUISize.top = g_ResearchListTop + 36;
            GUISize.bottom = g_ResearchListTop + 36;
            this.GUI.size = GUISize;

            if (this.active)
                g_ResearchListTop += 14;
            if (this.activeChart)
                g_ResearchListTop += 100;

            return result;
        });
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
            this.updateOverlay();
    },
    "format": function (count, diff, pad = 5)
    {
        let text = (count / diff * 60).toFixed(0);
        return " ".repeat(Math.max(0, pad - text.length)) + text;
    },
    "updateOverlay": function ()
    {
        this.GUIOverlay.caption = "APM:" + this.format(this.last.count, this.getRealTime() - this.last.time);
    },
    "updateChart": function ()
    {
        this.GUIChart.series = [this.queue];
        this.GUITotalGameAverage.caption = "Game avg APM:" + this.format(this.total.count, this.getRealTime() - this.total.start, 0);
    },
    "queueAdd": function (value)
    {
        let nextTime = this.getGameTime();
        let lastTime = this.queue[this.queue.length - 1][0];

        this.queue.push([lastTime, value]);
        this.queue.push([nextTime, value]);

        // Here, we simulate a queue
        if (this.queue.length <= this.nIntervalsChart * 2)
            return;

        this.queue.shift();
        this.queue.shift();
    },
    "onTick": function ()
    {
        if (!this.active)
            return;

        // Dilemma: use real time or sim time ? (late game lag)
        let time = this.getRealTime();
        let diff = time - this.last.time;
        if (diff < this.interval)
            return;

        this.updateOverlay();

        let nextAPM = this.last.count / diff * 60;
        this.queueAdd(nextAPM);

        if (this.activeChart)
            this.updateChart();

        this.last.time = time;
        this.last.count = 0;
    }
}
