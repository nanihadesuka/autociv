/**
 * This class deals with the button that opens the leaderboard page.
 */
class OptionsButton
{
	constructor()
	{
		this.optionsButton = Engine.GetGUIObjectByName("optionsButton");
		this.optionsButton.caption = translate("Options");
		this.optionsButton.onPress = this.onPress; //Engine.PushGuiPage("page_manual.xml");
	}

	async onPress()
	{
		//closeOpenDialogs();
		//this.pauseControl.implicitPause();
		await Engine.PushGuiPage("page_options.xml");
		//resumeGame();
	}


}
