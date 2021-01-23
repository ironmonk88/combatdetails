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
	game.settings.register("combatdetails", "showcurrentup", {
		name: game.i18n.localize("CombatDetails.ShowCurrentUp"),
		hint: game.i18n.localize("CombatDetails.ShowCurrentUpHint"),
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
	game.settings.register("combatdetails", "close-combat-when-done", {
		name: "Close Combat when done",
		hint: "Close the combat popout, when you've done a combat encounter, if there are no other combats active.",
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});
	game.settings.register("combatdetails", "show-combat-cr", {
		name: "Show Encounter CR",
		hint: "When creating a combat encounter, display the estimated CR for that encounter.",
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});
	game.settings.register("combatdetails", "notify-on-change", {
		name: "Notify on Movement Change",
		hint: "Send a notification to all players when the GM changes the allowable movement",
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});
	/*game.settings.register("combatdetails", "allow-previous-move", {
		name: "Allow Previous Turn Move",
		hint: "During a combat round, allow the previous turn to move.  Sometimes it allows combat to flow quicker if you can trust the previous player to clean up their movement while you move on to the next player.",
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});*/
	game.settings.register("combatdetails", "alter-hud", {
		name: "Alter the Token HUD status effects",
		hint: "Alter the Token HUD to show detailed status effects and allow to clear all effects.",
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});
	game.settings.register("combatdetails", "scene-palette", {
		name: "Show Scene Palette",
		hint: "Show the top 5 dominant colours of a scene just in case you want to set the background colour to a similar colour.",
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});
	game.settings.register("combatdetails", "show-token-bar", {
		name: "Show Token Bar",
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});

	//this is just a global setting for movement mode
	game.settings.register("combatdetails", "movement", {
		scope: "world",
		config: false,
		default: "free",
		type: String,
	});
};