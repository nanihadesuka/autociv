var autociv_formation = {
    "set": function (formation = "null", entities = g_Selection.toList())
    {
        if (this.formationsList.indexOf(formation) == -1)
            return;

        let formationTemplate = `special/formations/${formation}`;
        if (!canMoveSelectionIntoFormation(formationTemplate))
            return;

        performFormation(entities, formationTemplate)
        return true;
    },
    get formationsList()
    {
        return "_formationsList" in this ? this._formationsList :
            this._formationsList = this.loadFormations();
    },
    "loadFormations": function ()
    {
        let folder = "simulation/templates/special/formations/";
        return Engine.ListDirectoryFiles(folder, "*.xml", false).
            map(text => (text.match(/^.*\/(.+)\.xml$/) || [])[1]).filter(v => !!v);
    }
}
