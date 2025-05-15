/**
 * This class deals with the button that opens the leaderboard page.
 */
class OptionsButtonAutociv
{
	constructor()
	{
		this.optionsButtonAutociv = Engine.GetGUIObjectByName("optionsButtonAutociv");
		this.optionsButtonAutociv.caption = translate("Options");
		this.optionsButtonAutociv.onPress = this.onPress; //Engine.PushGuiPage("page_manual.xml");
	}

	async onPress()
	{
		//closeOpenDialogs();
		//this.pauseControl.implicitPause();
		await Engine.PushGuiPage("page_options.xml");
		//resumeGame();
	}


}
