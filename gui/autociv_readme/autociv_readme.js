
function init()
{
    Engine.GetGUIObjectByName("buttonWebpage").caption = Engine.Translate("Mod webpage")
    Engine.GetGUIObjectByName("buttonClose").caption = Engine.Translate("Close")
    Engine.GetGUIObjectByName("title").caption = Engine.Translate("Autociv readme")

    const webpageURL = "https://wildfiregames.com/forum/index.php?/topic/28753-autociv-mod-0ad-enhancer/"
    Engine.GetGUIObjectByName("buttonWebpage").onPress = () => Engine.OpenURL(webpageURL)

    const markdown = Engine.ReadFile("autociv_data/README.md")
    Engine.GetGUIObjectByName("text").caption = autociv_SimpleMarkup(markdown)
}
