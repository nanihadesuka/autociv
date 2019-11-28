/**
 * @var g_Maps {Object}
 * @var g_Maps.byType {Object}
 * Object with filters by map type from which each
 * map type has an object with maps by filter.
 * {
 *   "random" : {
 *      "default": [new MapData, ...],
 *      "naval": [new MapData, ...],
 *      "new": [new MapData, ...],
 *      "trigger": [new MapData, ...],
 *      "all": [new MapData, ...],
 *      ...
 *   },
 *   "skirmisher": {
 *       "default" : [new MapData, ...],
 *       ....
 *   },
 *   "scenario": ....,
 * }
 */
var g_Maps = {
	"types": arrayToKeys(g_Settings_for_MapBrowser.MapTypes, "Name"),
	"filters": arrayToKeys(g_Settings_for_MapBrowser.MapFilters, "id"),
	"ofTypeAndFilter": {}, // Lazy loaded
	"ofFilter": {}, // Lazy loaded
	"getFromTypeAndFilter": function (type = currentType(), filter = currentFilter())
	{
		if (!(type in this.types) || !(filter in this.filters))
			return [];

		if (!(type in this.ofTypeAndFilter))
			this.ofTypeAndFilter[type] = {
				"all": listFiles(this.types[type].Path, this.types[type].Extension, false).
					filter(fileName => !fileName.startsWith("_")).
					map(fileName => new Map(fileName, type))
			};

		if (!(filter in this.ofTypeAndFilter[type]))
			this.ofTypeAndFilter[type][filter] = this.ofTypeAndFilter[type].all.
				filter(map => this.filters[filter].filter(map.filter));

		return this.ofTypeAndFilter[type][filter];
	},
	"getFromFilter": function (filter = currentFilter())
	{
		if (!(filter in this.filters))
			return [];

		if (!(filter in this.ofFilter))
		{
			this.ofFilter[filter] = [];
			for (let type in g_Maps.types)
				this.ofFilter[filter].push(...this.getFromTypeAndFilter(type, filter));
		}

		return this.ofFilter[filter];
	}
};


var g_MatchSort = {
	// The lower the score the better the match
	"scoreText": function (input, text)
	{
		if (!input || !text)
			return undefined;

		text = text.toLowerCase();

		let score = 0;
		let offset = -1;
		for (let i = 0; i < input.length; i++)
		{
			let char = input[i];

			let offsetNext = text.indexOf(char, offset + 1);
			// No match
			if (offsetNext == -1)
				return undefined;

			// Lower score increase if consecutive index
			let isConsecutive = offsetNext == offset + 1 ? 0 : 1;
			score += offsetNext + isConsecutive * offsetNext;
			offset = offsetNext;
		}
		return score;
	},
	/**
	 * Returns a new list filtered and sorted by the similarity with the input text
	 * @param {string} input text to seach for
	 * @param {string[] | object[]} list
	 * @param {string} [key] text to use if the list is made up of objects
	 */
	"search": function (input, list, key = null)
	{
		input = input.toLowerCase();

		let result = [];

		if (key == null)
			for (let text of list)
			{
				let score = this.scoreText(input, text);
				if (score !== undefined)
					result.push([score, text])
			}
		else
			for (let obj of list)
			{
				let score = this.scoreText(input, obj[key]);
				if (score !== undefined)
					result.push([score, obj])
			}

		result.sort((a, b) => a[0] - b[0]);
		return result.map(v => v[1]);
	}
}

var g_AnimationSettings = {
	"childButton":
	{
		"selected":
		{
			"color": { "a": 0.4 },
			"size": "4 4 -4 -4",
			"duration": 350
		},
		"unselected":
		{
			"color": { "a": 0 },
			"size": "10 10 -10 -10",
			"duration": 350
		},
	},
	"childPreview":
	{
		"press":
		{
			"size": "3 3 -3 -3",
			"duration": 100
		},
		"release":
		{
			"size": "2 2 -2 -2",
			"duration": 100
		}
	},
	"childMap":
	{
		"enter": { "size": "-10 -10 10 10" },
		"leave": { "size": "0 0 0 0" }
	},
	"previewSelectedOverlay":
	{
		"chain": [
			{
				"color": { "a": 0.6 },
				"onComplete": () =>
				{
					Engine.GetGUIObjectByName("nameSelected").caption = g_MapSelected.map.name;
					Engine.GetGUIObjectByName("previewSelected").sprite = g_MapSelected.map.preview;
				},
			},
			{
				"size": { left: 0 },
				"color": { "a": 0 },
			}
		],
		"shared":
		{
			"queue": true,
			"duration": 200,
			"curve": "easeInOut"
		}
	},
	"descriptionSelected":
	{
		"chain": [
			{
				"textcolor": { "a": 0.5 },
				"onComplete": object => object.caption = g_MapSelected.map.description
			},
			{
				"textcolor": { "a": 1 }
			}
		],
		"shared":
		{
			"queue": true,
			"duration": 100,
			"curve": "easeInOut"
		}
	}
};

/**
 * GridBrowser instance, manages the maps preview grid
 */
var g_MapBrowser;

/**
 * Handles map list search behaviour
 */
var g_MapsSearchBox;

/**
 * Stores what is the current selected map if any
 */
var g_MapSelected = {
	"select": function (map, child)
	{
		if (this.lastSelectedChild)
			this.lastSelectedChild.onUnselect();

		this.lastSelectedChild = child;

		this.filter = currentFilter();
		if (this.map == map)
			return;

		this.selected = true;
		this.map = map;

		animate("previewSelectedOverlay").chain(
			g_AnimationSettings.previewSelectedOverlay.chain,
			g_AnimationSettings.previewSelectedOverlay.shared
		);

		animate("descriptionSelected").chain(
			g_AnimationSettings.descriptionSelected.chain,
			g_AnimationSettings.descriptionSelected.shared
		);

		Engine.GetGUIObjectByName("selectMapButton").enabled = true;
	},
	"selected": false,
	"lastSelectedChild": undefined,
	"map": {}
};

/**
 *  Stores zoom in/out functions and level of zoom
 */
var g_MapZoom = {
	"originalSize": { "width": 400, "height": 300 },
	"scale": 0.6,
	"multiplier": 1.1,
	"getWidth": function () { return this.originalSize.width * this.scale; },
	"getHeight": function () { return this.originalSize.height * this.scale; },
	"zoom": function (step)
	{
		this.scale *= Math.pow(this.multiplier, step)
		this.scale = Math.max(Math.min(this.scale, 2.0), 0.35);
		g_MapBrowser.setChildDimensions(this.getWidth(), this.getHeight());
	}
};

var g_GUIObjects = {
	"mapsZoomIn":
	{
		"tooltip": translate(setStringTags("\\[" + "MouseWheelUp" + "]", g_HotkeyTags) + ": Make map previews bigger."),
		"onPress": () => g_MapZoom.zoom(1)
	},
	"mapsZoomOut":
	{
		"tooltip": translate(setStringTags("\\[" + "MouseWheelDown" + "]", g_HotkeyTags) + ": Make map previews smaller?"),
		"onPress": () => g_MapZoom.zoom(-1)
	},
	"prevButton":
	{
		"tooltip": colorizeHotkey(translate("%(hotkey)s: Goes to previous page."), "tab.prev"),
		"onPress": () => g_MapBrowser.previousPage()
	},
	"nextButton":
	{
		"tooltip": colorizeHotkey(translate("%(hotkey)s: Goes to next page."), "tab.next"),
		"onPress": () => g_MapBrowser.nextPage()
	},
	"selectMapButton":
	{
		"tooltip": translate("Select map."),
		"onPress": () => close(true)
	},
	"closeButton":
	{
		"tooltip": colorizeHotkey(translate("%(hotkey)s: Close map browser."), "cancel"),
		"onPress": () => close(false)
	},
	"dialog":
	{
		"onWindowResized": () => g_MapBrowser.generateGrid().goToPageOfSelected(),
		"onMouseWheelUp": () => g_MapZoom.zoom(1),
		"onMouseWheelDown": () => g_MapZoom.zoom(-1)
	},
	"MapBrowserContainer":
	{
		"onMouseWheelUp": () => g_MapZoom.zoom(1),
		"onMouseWheelDown": () => g_MapZoom.zoom(-1)
	}
};

var g_Dropdowns = {
	"mapTypeDropdown":
	{
		"list_data": () => Object.keys(g_Maps.types),
		"list": () => Object.keys(g_Maps.types).map(type => g_Maps.types[type].Title),
		"selected": (type, filter) => Object.keys(g_Maps.types).indexOf(type),
		"onSelectionChange": () => () => g_MapBrowser.setList(g_Maps.getFromTypeAndFilter())
	},
	"mapFilterDropdown":
	{
		"list_data": () => Object.keys(g_Maps.filters),
		"list": () => Object.keys(g_Maps.filters).map(filter => g_Maps.filters[filter].name),
		"onSelectionChange": () => () => g_MapBrowser.setList(g_Maps.getFromTypeAndFilter()),
		"selected": (type, filter) => Object.keys(g_Maps.filters).indexOf(filter)
	}
}

/**
 * @param {Object} data - context data sent by the gamesetup
 */
function init(data)
{
	g_MapBrowser = new GridBrowser(
		"MapBrowserContainer",
		"currentPageNum",
		[],
		g_MapZoom.getWidth(),
		g_MapZoom.getHeight(),
		childFunction
	).generateGrid();

	for (let name in g_GUIObjects)
		for (let parameter in g_GUIObjects[name])
			Engine.GetGUIObjectByName(name)[parameter] = g_GUIObjects[name][parameter];

	let type = data && data.map && data.map.type in g_Maps.types ? data.map.type : "random";
	let filter = data && data.map && data.map.filter in g_Maps.filters ? data.map.filter : "default";
	for (let name in g_Dropdowns)
		for (let parameter in g_Dropdowns[name])
			Engine.GetGUIObjectByName(name)[parameter] = g_Dropdowns[name][parameter](type, filter);

	// Simulate a click on the map if any
	if (data && data.map && data.map.name != "random")
	{
		let index = g_MapBrowser.list.findIndex(map => map.file.path + map.file.name == data.map.name);
		if (index != -1)
			g_MapBrowser.goToPageOfIndex(index).getChildOfIndex(index).onSelect();
	}

	g_MapsSearchBox = new MapsSearchBox("mapsSearchBox");
	Engine.GetGUIObjectByName("mapsSearchBox").focus();
}

/**
 * Handles the behaviour of each map preview in the map browser grid.
 * All parameters are feeded to the each non hidden child that is is shown.
 * This function will be binded with the GridBrowser instance.
 * @param {GUIObject} child
 * @param {Number} childIndex
 * @param {Any} data
 * @param {Number} dataIndex
 */
function childFunction(child, childIndex, map, mapIndex)
{
	if (child.onUnselect)
		child.onUnselect();

	let mapPreview = Engine.GetGUIObjectByName(`mapPreview[${childIndex}]`);
	let mapButton = Engine.GetGUIObjectByName(`mapButton[${childIndex}]`);
	let mapBox = Engine.GetGUIObjectByName(`mapBox[${childIndex}]`);
	let mapName = Engine.GetGUIObjectByName(`mapName[${childIndex}]`);
	let childSelected = false;

	child.onMouseLeftPress = () =>
	{
		g_MapSelected.select(map, child);
		this.setSelectedIndex(mapIndex);
		if (childSelected)
			return;

		animate(mapButton).complete().add(g_AnimationSettings.childButton.selected);
		animate(mapPreview).complete().add(g_AnimationSettings.childPreview.press);
		childSelected = true;
	};
	child.onUnselect = () =>
	{
		if (!childSelected)
			return;

		animate(mapButton).complete().add(g_AnimationSettings.childButton.unselected);
		childSelected = false;
	};
	child.onSelect = child.onMouseLeftPress.bind(child);
	child.onMouseEnter = () =>
	{
		animate(mapBox).complete().add(g_AnimationSettings.childMap.enter)
	};
	child.onMouseLeave = () =>
	{
		animate(mapBox).complete().add(g_AnimationSettings.childMap.leave)
	};
	child.onMouseWheelUp = () => g_MapZoom.zoom(1);
	child.onMouseWheelDown = () => g_MapZoom.zoom(-1);
	child.onMouseLeftRelease = () => animate(mapPreview).complete().add(g_AnimationSettings.childPreview.release);
	child.onMouseLeftDoubleClick = () => close(true);

	if (map == g_MapSelected.map)
		child.onSelect();

	mapName.caption = map.name;
	mapPreview.sprite = map.preview;
	child.tooltip = map.description;
};

/**
 * Uses one element of the array as key to make a dictionary
 * @param {Array} dict
 * @param {String} element
 * @return {Object}
 */
function arrayToKeys(objectsArray, element)
{
	let dict = {};
	for (let object of objectsArray)
	{
		dict[object[element]] = {};
		for (let key in object)
			if (key != element)
				dict[object[element]][key] = object[key];
	}
	return dict;
}

function currentType()
{
	let mapTypeDropdown = Engine.GetGUIObjectByName("mapTypeDropdown");
	if (mapTypeDropdown.selected != -1)
		return mapTypeDropdown.list_data[mapTypeDropdown.selected];
}

function currentFilter()
{
	let mapFilterDropdown = Engine.GetGUIObjectByName("mapFilterDropdown");
	if (mapFilterDropdown.selected != -1)
		return mapFilterDropdown.list_data[mapFilterDropdown.selected];
}

/**
 * Each map has all his data in this object
 */
function Map(fileName, type)
{
	this.type = type;
	this.file = {
		get path() { return g_Maps.types[type].Path },
		"name": fileName,
		get extension() { return g_Maps.types[type].Extension },
	};
	// data, name, description, preview, filter are lazy loaded
}

Map.previewPrefix = "cropped:" + 400 / 512 + "," + 300 / 512 + ":session/icons/mappreview/";

Map.prototype.parseData = function (key, alternative)
{
	return this.data && this.data.settings && this.data.settings[key] || alternative;
}

Object.defineProperties(Map.prototype, {
	"data": {
		get()
		{
			return "_data" in this ? this._data :
				this._data = this.type == "random" ?
					Engine.ReadJSONFile(this.file.path + this.file.name + this.file.extension) :
					Engine.LoadMapSettings(this.file.path + this.file.name);
		}
	},
	"name": {
		get()
		{
			return "_name" in this ? this._name :
				this._name = translate(this.parseData("Name", "No map name."));
		}
	},
	"description": {
		get()
		{
			return "_description" in this ? this._description :
				this._description = translate(this.parseData("Description", "No map description."));
		}
	},
	"preview": {
		get()
		{
			return "_preview" in this ? this._preview :
				this._preview = Map.previewPrefix + this.parseData("Preview", "nopreview.png");
		}
	},
	"filter": {
		get()
		{
			if ("_filter" in this)
				return this._filter;

			this._filter = this.parseData("Keywords", ["all"]);
			if (!Array.isArray(this._filter))
				this._filter = [this._filter];
			return this._filter;
		}
	}
});

function MapsSearchBox(GUIObjectName)
{
	this.input = Engine.GetGUIObjectByName(GUIObjectName);
	this.input.onTab = g_MapBrowser.nextPage.bind(g_MapBrowser);
	this.input.onMouseLeftPress = this.updateSearch.bind(this);
	this.input.onPress = this.selectFirstResult.bind(this);
	this.input.onTextedit = this.updateSearch.bind(this);
	this.placeholder = this.input.children[0];
}

MapsSearchBox.prototype.selectFirstResult = function ()
{
	if (!g_MapBrowser.list.length)
		return;

	g_MapSelected.select(g_MapBrowser.list[0]);
	close(true);
}

MapsSearchBox.prototype.updateSearch = function ()
{
	let caption = this.input.caption.trim().toLowerCase();
	if (this.placeholder)
		this.placeholder.hidden = !!caption;

	let list = g_Maps.getFromTypeAndFilter();
	if (caption)
	{
		// Search all maps with current type and filter
		list = g_MatchSort.search(caption, list, "name");

		// Search all maps with current filter
		if (!list.length)
			list = g_MatchSort.search(caption, g_Maps.getFromFilter(), "name");
	}

	g_MapBrowser.setList(list).goToPage(0);
}

function close(sendSelected)
{
	if (sendSelected && g_MapSelected.selected)
		autocivCL.Engine.PopGuiPage({
			"map": {
				"path": g_MapSelected.map.file.path,
				"name": g_MapSelected.map.file.name,
				"type": g_MapSelected.map.type,
				"filter": g_MapSelected.filter
			}
		}, true);
	else
		autocivCL.Engine.PopGuiPage({}, true)
}
