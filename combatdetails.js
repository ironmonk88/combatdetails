import { registerSettings } from "./settings.js";
import { gsap } from "/scripts/greensock/esm/all.js";

export let debug = (...args) => { if (debugEnabled > 1)
    console.log("DEBUG: combatdetails | ", ...args); };
export let log = (...args) => console.log("combatdetails | ", ...args);
export let warn = (...args) => { if (debugEnabled > 0)
    console.warn("combatdetails | ", ...args); };
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

/**
 * ============================================================
 * KHelpers Module
 *
 * Encapsulates a few handy helpers
 *
 *
 *
 *
 * ============================================================
 */
var KHelpers = (function () {
  function hasClass(el, className) {
    return el.classList
      ? el.classList.contains(className)
      : new RegExp("\\b" + className + "\\b").test(el.className);
  }

  function addClass(el, className) {
    if (el.classList) el.classList.add(className);
    else if (!KHelpers.hasClass(el, className)) el.className += " " + className;
  }

  function removeClass(el, className) {
    if (el.classList) el.classList.remove(className);
    else
      el.className = el.className.replace(
        new RegExp("\\b" + className + "\\b", "g"),
        ""
      );
  }

  function offset(el) {
    var rect = el.getBoundingClientRect(),
      scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
      scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return { top: rect.top + scrollTop, left: rect.left + scrollLeft };
  }

  function style(el) {
    return el.currentStyle || window.getComputedStyle(el);
  }
  function insertAfter(el, referenceNode) {
    referenceNode.parentNode.insertBefore(el, referenceNode.nextSibling);
  }
  function insertBefore(el, referenceNode) {
    referenceNode.parentNode.insertBefore(el, referenceNode);
  }

  /**
   * Helper to grab a parent class via CSS ClassName
   *
   * @param elem (HTMLElement) : the element to start from.
   * @param cls (String) : The class name to search for.
   * @param depth (Number) : The maximum height/depth to look up.
   * @returns (HTMLElement) : the parent class if found, or the current element if not.
   *
   * @private
   */

  function seekParentClass(elem, cls, depth) {
    depth = depth || 5;
    let el = elem;
    for (let i = 0; i < depth; ++i) {
      if (!el) break;
      if (KHelpers.hasClass(el, cls)) break;
      else el = el.parentNode;
    }
    return el;
  }

  return {
    hasClass: hasClass,
    addClass: addClass,
    removeClass: removeClass,
    offset: offset,
    style: style,
    insertAfter: insertAfter,
    insertBefore: insertBefore,
    seekParentClass: seekParentClass,
  };
})();

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
  static EndTurnDialog = [];
  static tracker = false;

  static async closeEndTurnDialog() {
    // go through all dialogs that we've opened and closed them
    for (let d of CombatDetails.EndTurnDialog) {
      d.close();
    }
    CombatDetails.EndTurnDialog.length = 0;
  }

  static showEndTurnDialog() {
    CombatDetails.closeEndTurnDialog().then(() => {
      let d = new Dialog(
        {
          title: "End Turn",
          buttons: {
            endturn: {
              label: "End Turn",
              callback: () => {
                game.combats.active.nextTurn();
              },
            },
          },
        },
        {
          width: 30,
          top: 5,
        }
      );
      d.render(true);
      // add dialog to array of dialogs. when using just a single object we'd end up with multiple dialogs
      CombatDetails.EndTurnDialog.push(d);
    });
  }

  /**
   * JQuery stripping
   */
  static init() {
	  log("initializing");
    // element statics
    CombatDetails.READY = true;
    // sound statics
    CombatDetails.TURN_SOUND = "modules/combatdetails/sounds/turn.wav";
    CombatDetails.NEXT_SOUND = "modules/combatdetails/sounds/next.wav";
    CombatDetails.ROUND_SOUND = "modules/combatdetails/sounds/round.wav";
    CombatDetails.ACK_SOUND = "modules/combatdetails/sounds/ack.wav";

    registerSettings();
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

      if (entry !== undefined) {
        CombatDetails.closeEndTurnDialog().then(() => {
          let isActive = entry.actor?._id === game.users.current.character?._id;
          let isNext =
            nxtentry.actor?._id === game.users.current.character?._id;

          if (isActive) {
            CombatDetails.doDisplayTurn();
            if (game.settings.get("combatdetails", "endturndialog"))
              CombatDetails.showEndTurnDialog();
          } else if (isNext) {
            CombatDetails.doDisplayNext();
          }
        });
      }
    } else if (!curCombat) {
      CombatDetails.closeEndTurnDialog();
    }
  }

    static repositionCombat(app) {
        //we want to start the dialog in a different corner
        let sidebar = document.getElementById("sidebar");
        let players = document.getElementById("players");

        app.position.left = (combatposition().endsWith('left') ? 120 : (sidebar.offsetLeft - app.position.width));
        app.position.top = (combatposition().startsWith('top') ?
            (combatposition().endsWith('left') ? 70 : (sidebar.offsetTop - 3)) :
            (combatposition().endsWith('left') ? (players.offsetTop - app.position.height - 3) : (sidebar.offsetTop + sidebar.offsetHeight - app.position.height - 3)));
        $(app._element).css({ top: app.position.top, left: app.position.left });
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
	if(game.settings.get("combatdetails", "opencombat") && delta.round === 1 && delta.turn === 0){
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
