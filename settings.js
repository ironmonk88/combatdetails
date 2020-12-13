export const registerSettings = function () {
    // Register any custom module settings here
    let modulename = "combatdetails";
	
	let dialogpositions = {
		'': '—',
		'topleft': 'Top Left',
		'topright': 'Top Right',
		'bottomleft': 'Bottom Left',
		'bottomright': 'Bottom Right'
	  };
	
	game.settings.register("combatdetails", "shownextup", {
		name: game.i18n.localize("CombatDetails.ShowNextUp"),
		hint: game.i18n.localize("CombatDetails.ShowNextUpHint"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});
	game.settings.register("combatdetails", "endturndialog", {
		name: game.i18n.localize("CombatDetails.ShowEndTurnDialog"),
		hint: game.i18n.localize("CombatDetails.ShowEndTurnDialogHint"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});
	game.settings.register("combatdetails", "volume", {
		name: game.i18n.localize("CombatDetails.Volume"),
		hint: game.i18n.localize("CombatDetails.VolumeHint"),
		scope: "client",
		config: true,
		range: {
			min: 0,
			max: 100,
			step: 10,
		},
		default: 60,
		type: Number,
	});
	game.settings.register("combatdetails", "combat-position", {
        name: game.i18n.localize("CombatDetails.Position"),
        hint: game.i18n.localize("CombatDetails.PositionHint"),
        scope: "world",
        default: null,
        type: String,
        choices: dialogpositions,
        config: true
    });
	game.settings.register("combatdetails", "opencombat", {
		name: game.i18n.localize("CombatDetails.PopoutCombat"),
		hint: game.i18n.localize("CombatDetails.PopoutCombatHint"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});
};