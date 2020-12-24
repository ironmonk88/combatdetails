import { registerSettings } from "./settings.js";

export let debug = (...args) => {
    if (debugEnabled > 1) console.log("DEBUG: combatdetails | ", ...args);
};
export let log = (...args) => console.log("combatdetails | ", ...args);
export let warn = (...args) => {
    if (debugEnabled > 0) console.warn("combatdetails | ", ...args);
};
export let error = (...args) => console.error("combatdetails | ", ...args);
export let i18n = key => {
    return game.i18n.localize(key);
};
export let volume = () => {
  return game.settings.get("combatdetails", "volume") / 100.0;
};
export let combatposition = () => {
  return game.settings.get("combatdetails", "combat-position");
};

CONFIG.controlIcons.visibility = "modules/conditions5e/icons/invisible.svg";

/**
 * ============================================================
 * CombatDetails class
 *
 * Encapsulates all CombatDetails functions in a class
 *
 * Copious amount of Statics used
 *
 *
 *
 *
 * ============================================================
 */
class CombatDetails {
    static tracker = false;
    static tokenbar = null;

    static init() {
	    log("initializing");
        // element statics
        CombatDetails.READY = true;

        CombatDetails.tokenbar = new TokenBar().render(true);
        // sound statics
        CombatDetails.TURN_SOUND = "modules/combatdetails/sounds/turn.wav";
        CombatDetails.NEXT_SOUND = "modules/combatdetails/sounds/next.wav";
        CombatDetails.ROUND_SOUND = "modules/combatdetails/sounds/round.wav";
        CombatDetails.ACK_SOUND = "modules/combatdetails/sounds/ack.wav";

        CONFIG.statusEffects = CONFIG.statusEffects.concat(
            [
                { "id": "charmed", "label": "COMBATDETAILS.StatusCharmed", "icon": "modules/combatdetails/icons/smitten.png" },
                { "id": "exhausted", "label": "COMBATDETAILS.StatusExhausted", "icon": "modules/combatdetails/icons/oppression.png" },
                { "id": "grappled", "label": "COMBATDETAILS.StatusGrappled", "icon": "modules/combatdetails/icons/grab.png" },
                { "id": "incapacitated", "label": "COMBATDETAILS.StatusIncapacitated", "icon": "modules/combatdetails/icons/internal-injury.png" },
                { "id": "invisible", "label": "COMBATDETAILS.StatusInvisible", "icon": "modules/combatdetails/icons/invisible.png" },
                { "id": "petrified", "label": "COMBATDETAILS.StatusPetrified", "icon": "modules/combatdetails/icons/stone-pile.png" },
                { "id": "hasted", "label": "COMBATDETAILS.StatusHasted", "icon": "modules/combatdetails/icons/running-shoe.png" },
                { "id": "slowed", "label": "COMBATDETAILS.StatusSlowed", "icon": "modules/combatdetails/icons/turtle.png" },
                { "id": "concentration", "label": "COMBATDETAILS.StatusConcentrating", "icon": "modules/combatdetails/icons/beams-aura.png" },
                { "id": "rage", "label": "COMBATDETAILS.StatusRage", "icon": "modules/combatdetails/icons/enrage.png" },
                { "id": "distracted", "label": "COMBATDETAILS.StatusDistracted", "icon": "modules/combatdetails/icons/distraction.png" },
                { "id": "dodging", "label": "COMBATDETAILS.StatusDodging", "icon": "modules/combatdetails/icons/dodging.png" },
                { "id": "disengage", "label": "COMBATDETAILS.StatusDisengage", "icon": "modules/combatdetails/icons/journey.png" }
            ]
        );

        CONFIG.statusEffects = CONFIG.statusEffects.sort(function (a, b) {
            return (a.id == undefined || a.id > b.id ? 1 : (a.id < b.id ? -1 : 0));
        })

        /*
        let oldEffects = CONFIG.statusEffects;
        let neweffects = [];
        //$(CONFIG.statusEffects).each(function () { neweffects.push(this); });
        for (let i = 0; i < CONFIG.statusEffects.length - 3; i++)
            neweffects.push(CONFIG.statusEffects[i]);
        $([
            { "id": "charmed", "label": "COMBATDETAILS.StatusCharmed", "icon": "icons/svg/downgrade.svg" },
            { "id": "exhausted", "label": "COMBATDETAILS.StatusExhausted", "icon": "icons/svg/target.svg" },
            { "id": "grappled", "label": "COMBATDETAILS.StatusGrappled", "icon": "icons/svg/eye.svg" },
            { "id": "incapacitated", "label": "COMBATDETAILS.StatusIncapacitated", "icon": "icons/svg/sun.svg" },
            { "id": "invisible", "label": "COMBATDETAILS.StatusInvisible", "icon": "icons/svg/angel.svg" },
            { "id": "petrified", "label": "COMBATDETAILS.StatusPetrified", "icon": "icons/svg/fire-shield.svg" },
            { "id": "hasted", "label": "COMBATDETAILS.StatusHasted", "icon": "icons/svg/ice-shield.svg" },
            { "id": "slowed", "label": "COMBATDETAILS.StatusSlowed", "icon": "icons/svg/mage-shield.svg" },
            { "id": "concentrating", "label": "COMBATDETAILS.StatusConcentrating", "icon": "icons/svg/holy-shield.svg" }
        ]).each(function () { neweffects.push(this); });
        CONFIG.statusEffects = neweffects;
        //CONFIG.statusEffects = [{ "id": "charmed", "label": "COMBATDETAILS.StatusCharmed", "icon": "icons/svg/downgrade.svg" }];
        //CONFIG.statusEffects.push({ "id": "charmed", "label": "COMBATDETAILS.StatusCharmed", "icon": "icons/svg/downgrade.svg" });*/

        /*
         * .token-indicator[condition="blinded"]{background-image: url(../img/icons/blindfold.png);}
.token-indicator[condition="charmed"]{background-image: url(../img/icons/smitten.png);}
.token-indicator[condition="deafened"]{background-image: url(../img/icons/elf-ear.png);}
.token-indicator[condition="exhaustion"]{background-image: url(../img/icons/oppression.png);}
.token-indicator[condition="frightened"]{background-image: url(../img/icons/sharp-smile.png);}
.token-indicator[condition="grappled"]{background-image: url(../img/icons/grab.png);}
.token-indicator[condition="incapacitated"]{background-image: url(../img/icons/internal-injury.png);}
.token-indicator[condition="invisible"]{background-image: url(../img/icons/invisible.png);}
.token-indicator[condition="paralyzed"]{background-image: url(../img/icons/embrassed-energy.png);}
.token-indicator[condition="petrified"]{background-image: url(../img/icons/stone-pile.png);}
.token-indicator[condition="poisoned"]{background-image: url(../img/icons/deathcab.png);}
.token-indicator[condition="prone"]{background-image: url(../img/icons/crawl.png);}
.token-indicator[condition="restrained"]{background-image: url(../img/icons/imprisoned.png);}
.token-indicator[condition="stunned"]{background-image: url(../img/icons/back-pain.png);}
.token-indicator[condition="unconscious"]{background-image: url(../img/icons/coma.png);}
.token-indicator[condition="rage"]{background-image: url(../img/icons/enrage.png);}
.token-indicator[condition="concentration"]{background-image: url(../img/icons/beams-aura.png);}
.token-indicator[condition="distracted"]{background-image: url(../img/icons/distraction.png);}
.token-indicator[condition="dodging"]{background-image: url(../img/icons/dodging.png);}
.token-indicator[condition="onfire"]{background-image: url(../img/icons/fire-silhouette.png);}
.token-indicator[condition="frozen"]{background-image: url(../img/icons/frozen-orb.png);}
.token-indicator[condition="disengage"]{background-image: url(../img/icons/journey.png);}
.token-indicator[condition="silenced"]{background-image: url(../img/icons/silenced.png);}
.token-indicator[condition="sleep"]{background-image: url(../img/icons/sleepy.png);}
.token-indicator[condition="blessed"]{background-image: url(../img/icons/spiked-halo.png);}
*/

        //CONFIG.statusEffects.push({ "id": "charmed", "label": "COMBATDETAILS.StatusCharmed", "icon": "modules/conditions5e/icons/charmed.svg" });

        registerSettings();

        let oldTokenHUDRender = TokenHUD.prototype._render;
        TokenHUD.prototype._render = function (force = false, options = {}) {
            let result = oldTokenHUDRender.call(this, force, options).then((a, b) => {
                log('after render');
                CombatDetails.alterHUD(CombatDetails.element);
            });

            return result;
        }
    }

    static doDisplayTurn() {
        if (!CombatDetails.READY) {
            CombatDetails.init();
        }
        ui.notifications.warn(i18n("CombatDetails.Turn"));

        // play a sound, meep meep!
        if(volume() > 0)
	        AudioHelper.play({ src: CombatDetails.TURN_SOUND, volume: volume() });
    }

    static doDisplayNext() {
        if (!game.settings.get("combatdetails", "shownextup")) {
            return;
        }

        if (!CombatDetails.READY) {
            CombatDetails.init();
        }

        ui.notifications.info(i18n("CombatDetails.Next"));
        // play a sound, beep beep!
        if(volume() > 0)
	        AudioHelper.play({ src: CombatDetails.NEXT_SOUND, volume: volume() });
    }

    /**
    * Check if the current combatant needs to be updated
    */
    static checkCombatTurn() {
        let curCombat = game.combats.active;

        if (curCombat && curCombat.started) {
            let entry = curCombat.combatant;
            // next combatant
            let nxtturn = (curCombat.turn || 0) + 1;
            if (nxtturn > curCombat.turns.length - 1) nxtturn = 0;
            let nxtentry = curCombat.turns[nxtturn];

            //find the next one that hasn't been defeated
            while (nxtentry.defeated && nxtturn != curCombat.turn) {
                nxtturn++;
                if (nxtturn > curCombat.turns.length - 1) nxtturn = 0;
                nxtentry = curCombat.turns[nxtturn];
            }

            if (entry !== undefined) {
                let isActive = entry.actor?._id === game.users.current.character?._id;
                let isNext = nxtentry.actor?._id === game.users.current.character?._id;

                if (isActive) {
                    CombatDetails.doDisplayTurn();
                } else if (isNext) {
                    CombatDetails.doDisplayNext();
                }
            }
        }
    }

    static repositionCombat(app) {
        //we want to start the dialog in a different corner
        let sidebar = document.getElementById("sidebar");
        let players = document.getElementById("players");

        let butHeight = (!game.user.isGM && !app.combat.getCombatantByToken(app.combat.current.tokenId).owner ? 40 : 0);

        app.position.left = (combatposition().endsWith('left') ? 120 : (sidebar.offsetLeft - app.position.width));
        app.position.top = (combatposition().startsWith('top') ?
            (combatposition().endsWith('left') ? 70 : (sidebar.offsetTop - 3)) :
            (combatposition().endsWith('left') ? (players.offsetTop - app.position.height - 3) : (sidebar.offsetTop + sidebar.offsetHeight - app.position.height - 3)) - butHeight);
        $(app._element).css({ top: app.position.top, left: app.position.left });
    }

    static alterHUD(html) {
        $('.col.right .control-icon.effects .status-effects img', html).each(function () {
            let div = $('<div>')
                .addClass('effect-control')
                .toggleClass('active', $(this).hasClass('active'))
                .attr('title', $(this).attr('title'))
                .attr('data-status-id', $(this).attr('data-status-id'))
                .attr('src', $(this).attr('src'))
                .insertAfter(this)
                .append($(this).removeClass('effect-control'))
                .append($('<div>').html($(this).attr('title')).click(function (event) {
                    $(this).prev().click();
                    if (event.stopPropagation) event.stopPropagation();
                    if (event.preventDefault) event.preventDefault();
                    event.cancelBubble = true;
                    event.returnValue = false;
                    return false;
                }));
            div[0].src = $(this).attr('src');
        });
        $('.col.right .control-icon.effects .status-effects', html).append(
            $('<div>').addClass('clear-all').html('<i class="fas fa-times-circle"></i> clear all').click($.proxy(CombatDetails.clearAll, this, html))
        );
    }

    static async clearAll(html) {
        //find the tokenhud, get the TokenHUD.object  ...assuming it's a token?
        let selectedEffects = $('.col.right .control-icon.effects .status-effects img.active', html);
        for (let img of selectedEffects) {
            const effect = (img.dataset.statusId && CombatDetails.tokenHUD.object.actor) ?
                CONFIG.statusEffects.find(e => e.id === img.dataset.statusId) :
                img.getAttribute("src");

            await CombatDetails.tokenHUD.object.toggleEffect(effect);
        };
    }
}

/**
 * Assorted hooks
 */
/* ------------------------------------ */
/* Initialize module					*/
/* ------------------------------------ */
Hooks.once('init', async function () {
    log('Initializing Combat Details');
    // Assign custom classes and constants here
    // Register custom module settings
    CombatDetails.init();
});
/**
 * Handle combatant update
 */
Hooks.on("updateCombatant", function (context, parentId, data) {
  const combat = game.combats.get(parentId);
  if (combat) {
    const combatant = combat.data.combatants.find((o) => o.id === data.id);

    if (combatant.actor.owner) CombatDetails.checkCombatTurn();
  }
});

/**
 * Handle combatant delete
 */
Hooks.on("deleteCombatant", function (context, parentId, data) {
  let combat = game.combats.get(parentId);
  CombatDetails.checkCombatTurn();
});

/**
 * Handle combatant added
 */
Hooks.on("addCombatant", function (context, parentId, data) {
  let combat = game.combats.get(parentId);
  let combatant = combat.data.combatants.find((o) => o.id === data.id);

  if (combatant.actor.owner) 
	  CombatDetails.checkCombatTurn();
});

/**
 * Combat update hook
 */

Hooks.on("deleteCombat", function () {
    CombatDetails.tracker = false;   //if the combat gets deleted, make sure to clear this out so that the next time the combat popout gets rendered it repositions the dialog
});

Hooks.on("updateCombat", function (data, delta) {
  CombatDetails.checkCombatTurn();

	log("update combat", data);
	if(game.settings.get("combatdetails", "opencombat") && delta.round === 1 && data.turn === 0 && data.started === true){
		//new combat, pop it out
		const tabApp = ui["combat"];
		tabApp.renderPopout(tabApp);
		
        if (ui.sidebar.activeTab !== "chat")
            ui.sidebar.activateTab("chat");
    }

    if (combatposition() !== '' && delta.active === true) {
        //+++ make sure if it's not this players turn and it's not the GM to add padding for the button at the bottom
        CombatDetails.tracker = false;   //delete this so that the next render will reposition the popout, changin between combats changes the height
    }

	if (!game.user.isGM && Object.keys(delta).some((k) => k === "round")) {
		AudioHelper.play({
		  src: CombatDetails.ROUND_SOUND,
		  volume: volume()
		});
	}
});

/**
 * Ready hook
 */
Hooks.on("ready", function () {
  //check if it's our turn! since we're ready
    CombatDetails.checkCombatTurn();
});

Hooks.on('renderCombatTracker', async (app, html, options) => {
	if(!CombatDetails.tracker && app.options.id == "combat-popout"){
		CombatDetails.tracker = true;
		
		if(combatposition() !== ''){
            CombatDetails.repositionCombat(app);
		}
	}
});

Hooks.on('closeCombatTracker', async (app, html) => {
	CombatDetails.tracker = false;
});

Hooks.on('renderTokenHUD', async (app, html, options) => {
    CombatDetails.element = html;
    CombatDetails.tokenHUD = app;
    $('.col.left .control-icon.target', html).insertBefore($('#token-hud .col.left .control-icon.config'));
});
