// See lobby~autociv.js init function for examples.
class ResizeBar
{
	constructor(object, side, width = 14, objectsHooked = [], isVisibleCondition = () => !this.object.hidden)
	{
		this.object = this.parseObject(object)
		this.side = side
		this.halfWidth = width / 2
		this.objectsHooked = objectsHooked.map(object => [this.parseObject(object[0]), object[1]])
		this.isVisibleCondition = isVisibleCondition
		this.wasMouseInside = false
		this.selectionOffset = 0
	}

	static get bar()
	{
		return ResizeBar._bar ?? (ResizeBar._bar = Engine.GetGUIObjectByName("glResizeBar"))
	}

	static mouse = {
		"x": 0,
		"y": 0,
		"set": function (mouse)
		{
			this.x = mouse.x
			this.y = mouse.y
		}
	}

	static mousePress = { ...ResizeBar.mouse }

	// Holds ResizeBar instance of the bar that is being dragged
	static dragging = undefined

	// Used to disable bar selection while the resize animation is happening.
	static ghostMode = false

	parseObject(object)
	{
		return typeof object == "string" ? Engine.GetGUIObjectByName(object) : object
	}

	isMouseInside()
	{
		if (!this.isVisibleCondition())
			return false

		let rect = this.object.getComputedSize()
		let pos = ResizeBar.mouse
		switch (this.side)
		{
			case "left":
			case "right":
				return Math.abs(rect[this.side] - pos.x) <= this.halfWidth &&
					rect.top + this.halfWidth < pos.y &&
					rect.bottom - this.halfWidth > pos.y
			case "top":
			case "bottom":
				return Math.abs(rect[this.side] - pos.y) <= this.halfWidth &&
					rect.left + this.halfWidth < pos.x &&
					rect.right - this.halfWidth > pos.x
			default:
				return false
		}
	}

	/**
	 * Returns the complementary parameter.
	 */
	sideComplementary(side = this.side)
	{
		switch (side)
		{
			case "left": return "right"
			case "right": return "left"
			case "top": return "bottom"
			case "bottom": return "top"
		}
	}

	/**
	 * Returns the opposite parameter.
	 */
	sideOpposite(side = this.side)
	{
		switch (side)
		{
			case "left": return "top"
			case "top": return "left"
			case "right": return "bottom"
			case "bottom": return "right"
		}
	}

	/**
	 * Returns the opposite and complementary paramter.
	 */
	sideCrossed(side = this.side)
	{
		return this.sideComplementary(this.sideOpposite(side))
	}

	sideSign(side = this.side)
	{
		switch (side)
		{
			case "right":
			case "bottom":
				return +1
			default:
				return -1
		}
	}

	sideMouse(side = this.side)
	{
		switch (side)
		{
			case "left":
			case "right":
				return "x"
			default:
				return "y"
		}
	}

	getBarSizes()
	{
		let absPos = this.object.getComputedSize()
		return {
			"open": {
				[this.side]: absPos[this.side] + this.sideSign() * this.halfWidth,
				[this.sideComplementary()]: absPos[this.side] - this.sideSign() * this.halfWidth,
				[this.sideOpposite()]: absPos[this.sideOpposite()],
				[this.sideCrossed()]: absPos[this.sideCrossed()]
			},
			"closed": {
				[this.side]: absPos[this.side],
				[this.sideComplementary()]: absPos[this.side],
				[this.sideOpposite()]: absPos[this.sideOpposite()],
				[this.sideCrossed()]: absPos[this.sideCrossed()]
			}
		}
	}

	viewResizeBar()
	{
		let sizes = this.getBarSizes()
		animate(ResizeBar.bar).finish().add({
			"start": { "size": sizes.closed },
			"size": sizes.open,
			"onStart": bar => bar.hidden = false
		})
	}

	hideResizeBar()
	{
		let sizes = this.getBarSizes()
		animate(ResizeBar.bar).finish().add({
			"start": { "size": sizes.open },
			"size": sizes.closed,
			"onComplete": bar => bar.hidden = true
		})
	}

	tick()
	{
		if (ResizeBar.dragging === this)
		{
			let position = ResizeBar.mouse[this.sideMouse()] - this.selectionOffset
			let absPos = this.object.getComputedSize()

			ResizeBar.bar.size = Object.assign(ResizeBar.bar.size, {
				[this.side]: position + this.sideSign() * this.halfWidth,
				[this.sideComplementary()]: position - this.sideSign() * this.halfWidth,
				[this.sideOpposite()]: absPos[this.sideOpposite()],
				[this.sideCrossed()]: absPos[this.sideCrossed()]
			})
			return true
		}
		else if (!ResizeBar.dragging)
		{
			let isInside = this.isMouseInside()
			if (isInside && this.wasMouseInside && ResizeBar.bar.hidden)
				this.viewResizeBar()

			if (this.wasMouseInside == isInside)
				return isInside

			if (isInside)
				this.viewResizeBar()
			else
				this.hideResizeBar()

			this.wasMouseInside = isInside
			return isInside
		}
		return false
	}

	drag()
	{
		if (!this.isMouseInside())
			return false

		ResizeBar.mousePress.set(ResizeBar.mouse)
		ResizeBar.dragging = this
		this.selectionOffset = ResizeBar.mousePress[this.sideMouse()] - this.object.getComputedSize()[this.side]
		return true
	}

	drop()
	{
		if (ResizeBar.dragging !== this)
			return false

		let displacement = ResizeBar.mouse[this.sideMouse()] - ResizeBar.mousePress[this.sideMouse()]
		if (displacement)
		{
			ResizeBar.ghostMode = true
			animate(this.object).add({
				"size": { [this.side]: this.object.size[this.side] + displacement },
				"onComplete": () => ResizeBar.ghostMode = false
			})
			for (let [object, side] of this.objectsHooked)
				animate(object).add({
					"size": { [side]: object.size[side] + displacement }
				})
		}

		ResizeBar.dragging = undefined
		return true
	}
}

/**
 * Manages and creates a resize bars for an GUIObject.
 *
 * Example: (lobby.js)
 *
 * g_resizeBarManager.add(
 *	Engine.GetGUIObjectByName("chatPanel"),
 *	"left",
 *	20,
 *	[
 *		[Engine.GetGUIObjectByName("profilePanel"), "right"],
 *		[Engine.GetGUIObjectByName("leftButtonPanel"), "right"],
 *	],
 *	() => !Engine.GetGUIObjectByName("profilePanel").hidden,
 *	() => warn("chatPanel resized")
 * )
 *
 */
var g_resizeBarManager = new class
{
	// Used to temporary disable all resize bars
	ghostMode = false
	disabled = false
	list = []

	/**
	 * @param {GUIObject} object Main XML object to resize.
	 * @param {String} side Object side to resize: "left", "right", "top", "bottom".
	 * @param {Number} [width] Resize bar width, undefined value will assign the
	 * default width.
	 * @param {Array[]} [objectsHooked] Other XML objects that will also resize with
	 * the main XML object.
	 * In the form of [[GUIObject1,side1],[GUIObject2,side2],...]
	 * @param {Function} [isVisibleCondition] Condition that makes the resize bar
	 * visible/enabled if it returns true. By default the condition is the property
	 * hidden of the main XML object, visible/enabled if not hidden.
	 */
	add(object, side, width, objectsHooked, isVisibleCondition)
	{
		this.list.push(new ResizeBar(object, side, width, objectsHooked, isVisibleCondition))
		this.disabled = Engine.ConfigDB_GetValue("user", "autociv.resizebar.enabled") != "true"
	}

	onEvent(event)
	{
		if (this.disabled || this.ghostMode || !ResizeBar.bar)
			return

		switch (event.type)
		{
			case "mousebuttondown":
				ResizeBar.mouse.set(event)
				for (let bar of this.list)
					if (bar.drag()) return true
				break
			case "mousebuttonup":
				ResizeBar.mouse.set(event)
				for (let bar of this.list)
					if (bar.drop()) return true
				break
			case "mousemotion":
				ResizeBar.mouse.set(event)
				break
		}
	}

	// Tick routine always called on all pages with global.xml included (all?).
	onTick()
	{
		if (this.disabled || this.ghostMode)
			return

		if (!ResizeBar.ghostMode)
			for (let bar of this.list)
				if (bar.tick())
					break
	}

}()

/* THIS NEEDS TO BE ADDED ON FILES WHERE YOU WANT TO USE RESIZE BARS
	function handleInputBeforeGui(ev)
	{
		g_resizeBarManager.onEvent(ev)
		return false
	}
*/
