autociv_patchApplyN(MapBrowser.prototype, "openPage", function (target, that, args)
{
	that.controls.MapFiltering.searchBox.control.onPress = () =>
	{
		if (g_IsController && that.gridBrowser.mapList.length)
		{
			that.gridBrowser.setSelectedIndex(0)
			that.submitMapSelection();
			that.closePage();
		}
	}
	return target.apply(that, args)
})
