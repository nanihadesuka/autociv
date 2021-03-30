MapGridBrowser.prototype.updateMapList = function ()
{
	const selectedMap = this.mapList[this.selected]?.file;
	const mapType = this.mapBrowserPage.controls.MapFiltering.getSelectedMapType()
	const mapFilter = this.mapBrowserPage.controls.MapFiltering.getSelectedMapFilter()
	const filterText = this.mapBrowserPage.controls.MapFiltering.getSearchText();
	const randomMap = {
		"file": "random",
		"name": translate("Random"),
		"description": translate("Pick a map at random.")
	}

	let mapList = this.mapFilters.getFilteredMaps(mapType, mapFilter);

	if (mapType == "random")
		Array.prototype.unshift.apply(mapList, randomMap)

	if (filterText)
	{
		mapList = MatchSort.get(filterText, mapList, "name")
		if (!mapList.length)
		{
			const filter = "all";
			mapList.push(randomMap)
			for (let type of g_MapTypes.Name)
				for (let map of this.mapFilters.getFilteredMaps(type, filter))
					mapList.push(Object.assign({ "type": type, "filter": filter }, map));

			mapList = MatchSort.get(filterText, mapList, "name")
		}
	}

	this.mapList = mapList;
	this.itemCount = this.mapList.length;
	this.resizeGrid();
	this.setSelectedIndex(this.mapList.findIndex(map => map.file == selectedMap));
}
