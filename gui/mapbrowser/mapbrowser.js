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
	"byTypeAndFilter": {}, // Lazy loaded
	"byFilter": {}, // Lazy loaded
	"getMaps": function (type, filter)
	{
		if (!(type in this.types) || !(filter in this.filters))
			return [];

		if (!(type in this.byTypeAndFilter))
			this.byTypeAndFilter[type] = {
				"all": listFiles(this.types[type].Path, this.types[type].Extension, false).
					filter(fileName => !fileName.startsWith("_")).
					map(fileName => new MapData(fileName, type))
			};


		if (!(filter in this.byTypeAndFilter[type]))
			this.byTypeAndFilter[type][filter] = this.byTypeAndFilter[type].all.
				filter(map => this.filters[filter].filter(map.filter));

		return this.byTypeAndFilter[type][filter];
	},
	"getMapsByFilter": function (filter)
	{
		if (!(filter in this.filters))
			return [];

		if (!(filter in this.byFilter))
		{
			this.byFilter[filter] = [];
			for (let type in g_Maps.types)
				this.byFilter[filter].push(...this.getMaps(type, filter));
		}

		return this.byFilter[filter];
	}
};

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
var g_MapsSearchBoxInput;

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
	"getSize": function ()
	{
		return {
			"width": this.originalSize.width * this.scale,
			"height": this.originalSize.height * this.scale
		};
	},
	"zoom": function (step)
	{
		this.scale *= Math.pow(this.multiplier, step)
		this.scale = Math.max(Math.min(this.scale, 2.0), 0.35);
		let size = this.getSize();
		g_MapBrowser.setChildDimensions(size.width, size.height);
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
		"onWindowResized": () =>
		{
			g_MapBrowser.generateGrid();
			g_MapBrowser.goToPageOfSelected();
		},
		"onMouseWheelUp": () => g_MapZoom.zoom(1),
		"onMouseWheelDown": () => g_MapZoom.zoom(-1)
	},

	"MapBrowserContainer":
	{
		"onMouseWheelUp": () => g_MapZoom.zoom(1),
		"onMouseWheelDown": () => g_MapZoom.zoom(-1)
	},
	"mapTypeDropdown":
	{
		"list": g_Settings_for_MapBrowser.MapTypes.map(type => type.Title),
		"list_data": g_Settings_for_MapBrowser.MapTypes.map(type => type.Name),
		"onSelectionChange": () => g_MapBrowser.setList(g_Maps.getMaps(currentType(), currentFilter()))
	},
	"mapFilterDropdown":
	{
		"list": Object.keys(g_Maps.filters).map(filter => g_Maps.filters[filter].name),
		"list_data": Object.keys(g_Maps.filters),
		"onSelectionChange": () => g_MapBrowser.setList(g_Maps.getMaps(currentType(), currentFilter()))
	}
};

/**
 * @param {Object} data - context data sent by the gamesetup
 */
function init(data)
{
	let type = data && data.map ? data.map.type : "random";
	let filter = data && data.map ? data.map.filter : "default";
	let mapList = g_Maps.getMaps(type, filter);

	let size = g_MapZoom.getSize();
	g_MapBrowser = new GridBrowser(
		"MapBrowserContainer",
		"currentPageNum",
		mapList,
		size.width,
		size.height,
		childFunction
	);
	g_MapBrowser.generateGrid();

	for (let objectName in g_GUIObjects)
		for (let parameter in g_GUIObjects[objectName])
			Engine.GetGUIObjectByName(objectName)[parameter] = g_GUIObjects[objectName][parameter];

	Engine.GetGUIObjectByName("mapTypeDropdown").selected = g_GUIObjects.mapTypeDropdown.list_data.indexOf(type);
	Engine.GetGUIObjectByName("mapFilterDropdown").selected = g_GUIObjects.mapFilterDropdown.list_data.indexOf(filter);

	if (data && data.map && data.map.name != "random")
	{
		let mapIndex = mapList.findIndex(map => map.file.path + map.file.name == data.map.name);
		if (mapIndex != -1)
		{
			g_MapBrowser.goToPage(g_MapBrowser.getPageOfIndex(mapIndex));
			// Simulate a click for starting map
			g_MapBrowser.getChildOfIndex(mapIndex).onSelect();
		}
	}

	g_MapsSearchBoxInput = new MapsSearchBoxInput("mapsSearchBox", "mapsSearchBoxNotice");
	Engine.GetGUIObjectByName("mapsSearchBox").focus();
}

/**
 * Handles the behaviour of each map preview in the map browser grid
 * All parameters are feeded to the each child that is is shown in the grid
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

	let mapPreview = Engine.GetGUIObjectByName("mapPreview" + "[" + childIndex + "]");
	let mapButton = Engine.GetGUIObjectByName("mapButton" + "[" + childIndex + "]");
	let mapBox = Engine.GetGUIObjectByName("mapBox" + "[" + childIndex + "]");
	let mapName = Engine.GetGUIObjectByName("mapName" + "[" + childIndex + "]");
	let selected = false;

	child.onMouseLeftPress = () =>
	{
		g_MapSelected.select(map, child);
		this.setSelectedIndex(mapIndex);
		if (selected)
			return;

		animate(mapButton).complete().add(g_AnimationSettings.childButton.selected);
		animate(mapPreview).complete().add(g_AnimationSettings.childPreview.press);
		selected = true;
	};
	child.onUnselect = () =>
	{
		if (!selected)
			return;

		animate(mapButton).complete().add(g_AnimationSettings.childButton.unselected);
		selected = false;
	};
	child.onSelect = child.onMouseLeftPress;
	child.onMouseEnter = () => animate(mapBox).complete().add(g_AnimationSettings.childMap.enter);
	child.onMouseLeave = () => animate(mapBox).complete().add(g_AnimationSettings.childMap.leave);
	child.onMouseWheelUp = () => g_MapZoom.zoom(1);
	child.onMouseWheelDown = () => g_MapZoom.zoom(-1);
	child.onMouseLeftRelease = () => animate(mapPreview).complete().add(g_AnimationSettings.childPreview.release);
	child.onMouseLeftDoubleClick = () => close(true);

	if (map == g_MapSelected.map)
		child.onSelect();

	if (mapName.caption != map.name)
		mapName.caption = map.name;

	if (mapPreview.sprite != map.preview)
		mapPreview.sprite = map.preview;

	if (child.tooltip != map.description)
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
function MapData(fileName, type)
{
	this.type = type;
	this.file = {
		"path": g_Maps.types[type].Path,
		"name": fileName,
		"extension": g_Maps.types[type].Extension
	};
	// data, name, description, preview, filter are lazy loaded
}

MapData.previewPrefix = "cropped:" + 400 / 512 + "," + 300 / 512 + ":session/icons/mappreview/"

MapData.prototype.parseData = function (key, alternative)
{
	return this.data && this.data.settings && this.data.settings[key] || alternative;
}

Object.defineProperty(MapData.prototype, "data", {
	get()
	{
		return "_data" in this ? this._data :
			this._data = this.type == "random" ?
				Engine.ReadJSONFile(this.file.path + this.file.name + this.file.extension) :
				Engine.LoadMapSettings(this.file.path + this.file.name);
	}
});

Object.defineProperty(MapData.prototype, "name", {
	get()
	{
		return "_name" in this ? this._name :
			this._name = translate(this.parseData("Name", "No map name."));
	}
});
Object.defineProperty(MapData.prototype, "description", {
	get()
	{
		return "_description" in this ? this._description :
			this._description = translate(this.parseData("Description", "No map description."));
	}
});
Object.defineProperty(MapData.prototype, "preview", {
	get()
	{
		return "_preview" in this ? this._preview :
			this._preview = MapData.previewPrefix + this.parseData("Preview", "nopreview.png");
	}
});
Object.defineProperty(MapData.prototype, "filter", {
	get()
	{
		if ("_filter" in this)
			return this._filter;

		this._filter = this.parseData("Keywords", ["all"]);
		if (!Array.isArray(this._filter))
			this._filter = [this._filter];
		return this._filter;
	}
});

function MapsSearchBoxInput(name, nameNotice)
{
	this.mapsSearchBoxNotice = Engine.GetGUIObjectByName(nameNotice);
	this.mapsSearchBox = Engine.GetGUIObjectByName(name);
	this.mapsSearchBox.onTab = g_MapBrowser.nextPage;
	this.mapsSearchBox.onMouseLeftPress = this.updateSearch.bind(this);
	this.mapsSearchBox.onPress = this.selectFirstResult.bind(this);
	this.mapsSearchBox.onTextedit = this.updateSearch.bind(this);
}

MapsSearchBoxInput.prototype.selectFirstResult = function ()
{
	if (!g_MapBrowser.list.length)
		return;

	g_MapSelected.select(g_MapBrowser.list.length[0]);
	close(true);
}

MapsSearchBoxInput.prototype.updateSearch = function ()
{
	let caption = this.mapsSearchBox.caption.trim().toLowerCase();
	this.mapsSearchBoxNotice.hidden = !!caption;

	let list = !caption ? g_Maps.getMaps(currentType(), currentFilter()) :
		fuzzysort.go(caption, g_Maps.getMapsByFilter(currentFilter()), {
			key: 'name',
			allowTypo: true,
			threshold: -10000
		}).map(result => result.obj);

	g_MapBrowser.setList(list);
	g_MapBrowser.goToPage(0);
}

function close(sendSelected)
{
	if (sendSelected && g_MapSelected.selected)
		autocivCL.Engine.PopGUIPage({
			"map": {
				"path": g_MapSelected.map.file.path,
				"name": g_MapSelected.map.file.name,
				"type": g_MapSelected.map.type,
				"filter": g_MapSelected.filter
			}
		}, true);
	else
		autocivCL.Engine.PopGUIPage({}, true)
}
