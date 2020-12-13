import { gsap } from "/scripts/greensock/esm/all.js";

const registerSettings = () => {
  // module settings
  game.settings.register("combatdetails", "shownextup", {
    name: "CombatDetails.ShowNextUp",
    hint: "CombatDetails.ShowNextUpHint",
    scope: "world",
    config: true,
    default: true,
    type: Boolean,
  });
  game.settings.register("combatdetails", "endturndialog", {
    name: "CombatDetails.ShowEndTurnDialog",
    hint: "CombatDetails.ShowEndTurnDialogHint",
    scope: "world",
    config: true,
    default: false,
    type: Boolean,
  });
  game.settings.register("combatdetails", "volume", {
    name: "CombatDetails.Volume",
    hint: "CombatDetails.VolumeHint",
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
};

const volume = () => {
  return game.settings.get("combatdetails", "volume") / 100.0;
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
    // element statics
    CombatDetails.READY = true;
    // sound statics
    CombatDetails.TURN_SOUND = "modules/combatdetails/sounds/turn.wav";
    CombatDetails.NEXT_SOUND = "modules/combatdetails/sounds/next.wav";
    CombatDetails.ROUND_SOUND = "modules/combatdetails/sounds/round.wav";
    CombatDetails.ACK_SOUND = "modules/combatdetails/sounds/ack.wav";
    // language specific fonts
    switch (game.i18n.lang) {
      case "en":
        KHelpers.addClass(label, "speedp");
        label.style["font-size"] = "124px";
        //label.style.top = "15px";
        break;
      default:
        KHelpers.addClass(label, "ethnocentric");
        label.style["font-size"] = "90px";
        break;
    }

    registerSettings();
  }

  static doDisplayTurn() {
    if (!CombatDetails.READY) {
      CombatDetails.init();
    }
    ui.notifications.info(game.i18n.localize("CombatDetails.Turn"));

    // play a sound, meep meep!
	if(volume() > 0)
		AudioHelper.play({ src: CombatDetails.TURN_SOUND, volume: volume() });
  }

  static doDisplayNext() {
    if (game.settings.get("combatdetails", "disablenextup")) {
      return;
    }

    if (!CombatDetails.READY) {
      CombatDetails.init();
    }

    ui.notifications.info(game.i18n.localize("CombatDetails.Next"));
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

}

/**
 * Assorted hooks
 */

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
Hooks.on("updateCombat", function (data, delta) {
  CombatDetails.checkCombatTurn();

  console.log("update combat", data);

  if (!game.user.isGM && Object.keys(delta).some((k) => k === "round")) {
    AudioHelper.play({
      src: CombatDetails.ROUND_SOUND,
      volume: volume(),
    });
  }
});

/**
 * Ready hook
 */
Hooks.on("ready", function () {
  CombatDetails.init();

  //check if it's our turn! since we're ready
  CombatReady.checkCombatTurn();
});

/**
 * Init hook
 */
Hooks.on("init", function () {
  $.log("Combat Details loading");
});
