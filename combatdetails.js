import { registerSettings } from "./settings.js";
import { TokenBar } from "./apps/tokenbar.js";
import { MMCQ } from "./quantize.js";
import { AssignXP, AssignXPApp } from "./apps/assignxp.js";
import { SavingThrow } from "./apps/savingthrow.js";
import { ContestedRoll } from "./apps/contestedroll.js";

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

/*
Hotbar.prototype.__get_defaultOptions = function () {
    return mergeObject(Hotbar.super.defaultOptions, {
        id: "hotbar",
        template: "templates/hud/hotbar.html",
        popOut: false,
        dragDrop: [{ dragSelector: ".macro-icon", dropSelector: "#macro-list,.macro-list" }]
    });
};*/

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
export class CombatDetails {
    static tracker = false;
    static tokenbar = null;

    static init() {
	    log("initializing");
        // element statics
        CONFIG.debug.hooks = true;

        CombatDetails.SOCKET = "module.combatdetails";
        //game.socket.on(CombatDetails.SOCKET, CombatDetails.onMessage);

        CombatDetails.READY = true;

        CombatDetails.xpchart = [
            { cr: 0, xp: 10 },
            { cr: 0.13, xp: 25 },
            { cr: 0.25, xp: 50 },
            { cr: 0.5, xp: 100 },
            { cr: 1, xp: 200 },
            { cr: 2, xp: 450 },
            { cr: 3, xp: 700 },
            { cr: 4, xp: 1100 },
            { cr: 5, xp: 1800 },
            { cr: 6, xp: 2300 },
            { cr: 7, xp: 2900 },
            { cr: 8, xp: 3900 },
            { cr: 9, xp: 5000 },
            { cr: 10, xp: 5900 },
            { cr: 11, xp: 7200 },
            { cr: 12, xp: 8400 },
            { cr: 13, xp: 10000 },
            { cr: 14, xp: 11500 },
            { cr: 15, xp: 13000 },
            { cr: 16, xp: 15000 },
            { cr: 17, xp: 18000 },
            { cr: 18, xp: 20000 },
            { cr: 19, xp: 22000 },
            { cr: 20, xp: 25000 },
            { cr: 21, xp: 33000 },
            { cr: 22, xp: 41000 },
            { cr: 23, xp: 50000 },
            { cr: 24, xp: 62000 },
            { cr: 25, xp: 75000 },
            { cr: 26, xp: 90000 },
            { cr: 27, xp: 105000 },
            { cr: 28, xp: 120000 },
            { cr: 29, xp: 135000 },
            { cr: 30, xp: 155000 }
        ];

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

        registerSettings();

        if (game.settings.get("combatdetails", "alter-hud")){
            let oldTokenHUDRender = TokenHUD.prototype._render;
            TokenHUD.prototype._render = function (force = false, options = {}) {
                let result = oldTokenHUDRender.call(this, force, options).then((a, b) => {
                    log('after render');
                    CombatDetails.alterHUD(CombatDetails.element);
                });

                return result;
            }
        }

        let oldTokenCanDrag = Token.prototype._canDrag;
        Token.prototype._canDrag = function (user, event) {
            let blockCombat = function (tokenId) {
                //combat movement is only acceptable if the token is the current token.
                //or the previous token
                //let allowPrevMove = game.settings.get("combatdetails", "allow-previous-move");
                let curCombat = game.combats.active;

                if (curCombat && curCombat.started) {
                    let entry = curCombat.combatant;
                    // prev combatant
                    /*
                    let prevturn = (curCombat.turn || 0) - 1;
                    if (prevturn == -1) prevturn = (curCombat.turns.length - 1);
                    let preventry = curCombat.turns[prevturn];

                    //find the next one that hasn't been defeated
                    while (preventry.defeated && preventry != curCombat.turn) {
                        prevturn--;
                        if (prevturn == -1) prevturn = (curCombat.turns.length - 1);
                        preventry = curCombat.turns[prevturn];
                    }*/

                    return !(entry.tokenId == tokenId); // || preventry.tokenId == tokenId);
                }

                return true;
            }

            let movement = this.getFlag("combatdetails", "movement") || game.settings.get("combatdetails", "movement") || "free";

            if (!game.user.isGM) {
                if (movement == "none" ||
                    (movement == "combat" && blockCombat(this.id))) {
                    //prevent the token from moving
                    if (!this.getFlag("combatdetails", "notified") || false) {
                        ui.notifications.warn(movement == "combat" ? "Movement is set to combat turn, it's currently not your turn" : "Movement is currently locked");
                        this.setFlag("combatdetails", "notified", true);
                        setTimeout(function (token) {
                            log('unsetting notified', token);
                            token.unsetFlag("combatdetails", "notified");
                        }, 30000, this);
                    }
                    return false;
                }
            }

            return oldTokenCanDrag.call(this, user, event);
        }
    }

    static ready() {
        CombatDetails.checkCombatTurn();

        game.socket.on('module.combatdetails', CombatDetails.onMessage);
        if (game.system.id == "pf2e") {
            CombatDetails.abilities = CONFIG.PF2E.abilities;
            CombatDetails.skills = CONFIG.PF2E.skills;
            CombatDetails.saves = CONFIG.PF2E.saves;
        } else if (game.system.id == "D35E") {
            CombatDetails.abilities = CONFIG.D35E.abilities;
            CombatDetails.skills = CONFIG.D35E.skills;
            CombatDetails.saves = CONFIG.D35E.savingThrows;
        } else {
            CombatDetails.abilities = CONFIG.DND5E.abilities;
            CombatDetails.skills = CONFIG.DND5E.skills;
            CombatDetails.saves = CONFIG.DND5E.abilities;
        }

        //$('#board').on('mousedown', CombatDetails._onClickLeft);
        canvas.stage.on("mousedown", CombatDetails.moveTokens);
    }

    static async moveTokens(event) {
        if (game.user.isGM && game.keyboard.isDown("m") && canvas.tokens.controlled.length > 0) {
            let pos = event.data.getLocalPosition(canvas.app.stage);
            let mid = {
                x: canvas.tokens.controlled[0].data.x,
                y: canvas.tokens.controlled[0].data.y
            };
            for (let i = 1; i < canvas.tokens.controlled.length; i++) {
                mid.x += canvas.tokens.controlled[i].data.x;
                mid.y += canvas.tokens.controlled[i].data.y;
            }
            mid.x = (mid.x / canvas.tokens.controlled.length);
            mid.y = (mid.y / canvas.tokens.controlled.length);

            let tokens = canvas.tokens.controlled.map(t => { return t.id; })
            for (let i = 0; i < tokens.length; i++) {
                let t = canvas.tokens.get(tokens[i]);
                let offsetx = mid.x - t.data.x;
                let offsety = mid.y - t.data.y;
                let gridPt = canvas.grid.grid.getGridPositionFromPixels(pos.x - offsetx, pos.y - offsety);
                let px = canvas.grid.grid.getPixelsFromGridPosition(gridPt[0], gridPt[1]);

                await t.update({ x: px[0], y: px[1] }, { animate: false });
            }
        }
    }

    static onMessage(data) {
        switch (data.msgtype) {
            case 'rollability': {
                let message = game.messages.get(data.msgid);
                const revealDice = game.dice3d ? game.settings.get("dice-so-nice", "immediatelyDisplayChatMessages") : false;
                if(data.type == 'savingthrow')
                    SavingThrow.updateSavingRoll(data.actorid, message, Roll.fromData(data.roll), !revealDice);
                else if (data.type == 'contestedroll')
                    ContestedRoll.updateContestedRoll(data.actorid, message, Roll.fromData(data.roll), !revealDice);
            } break;
            case 'finishroll': {
                let message = game.messages.get(data.msgid);
                if (data.type == 'savingthrow')
                    SavingThrow.finishRolling(data.actorid, message);
                else if (data.type == 'contestedroll')
                    ContestedRoll.finishRolling(data.actorid, message);
            } break;
            case 'assignxp': {
                let message = game.messages.get(data.msgid);
                AssignXP.onAssignXP(data.actorid, message);
            } break;
            case 'movementchange': {
                if (data.tokenid == undefined || canvas.tokens.get(data.tokenid)?.owner) {
                    ui.notifications.warn(data.msg);
                    log('movement change');
                }
            }
        }
    }

    static doDisplayTurn() {
        if (!game.settings.get("combatdetails", "showcurrentup")) {
            return;
        }

        if (!CombatDetails.READY) {
            CombatDetails.init();
        }
        ui.notifications.warn(i18n("CombatDetails.Turn"));

        // play a sound
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
        // play a sound
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

    /*
    static async expandHotbar(e) {
        ui.hotbar._pagecollapsed = !ui.hotbar._pagecollapsed;
        $('#hotbar .hotbar-page')
            .toggleClass('collapsed', ui.hotbar._pagecollapsed)
            .toggleClass('opening', !ui.hotbar._pagecollapsed)
            .one("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function () { $(this).removeClass('opening') });
    }

    static changePage(page, e) {
        this.page = page;
        this.render(true);
        ui.hotbar._pagecollapsed = true;
        $('#hotbar .hotbar-page').addClass('collapsed');
    }

    static async clearMacroRow(page, e) {
        for (let i = 1; i <= 10; i++) {
            await game.user.assignHotbarMacro(null, ((page - 1) * 10) + i);
        }
    }*/

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
            $('<div>').addClass('clear-all').html('<i class="fas fa-times-circle"></i> clear all').click($.proxy(CombatDetails.clearAll, this))
        );
    }

    static async clearAll() {
        //find the tokenhud, get the TokenHUD.object  ...assuming it's a token?
        let selectedEffects = $('#token-hud .col.right .control-icon.effects .status-effects .effect-control.active');
        for (let ctrl of selectedEffects) {
            let img = $('img', ctrl).get(0);
            if (img != undefined) {
                const effect = (img.dataset.statusId && CombatDetails.tokenHUD.object.actor) ?
                    CONFIG.statusEffects.find(e => e.id === img.dataset.statusId) :
                    img.getAttribute("src");

                await CombatDetails.tokenHUD.object.toggleEffect(effect);
            }
        };
    }

    static getCRText (cr) {
        switch (cr) {
            case 0.13: return '1/8';
            case 0.17: return '1/6';
            case 0.25: return '1/4';
            case 0.33: return '1/3';
            case 0.5: return '1/2';
            default: return cr;
        }
    }

    static getCRChallenge (data) {
        if (data.cr < data.apl) return 'easy';
        else if (data.cr === data.apl) return 'average';
        else if (data.cr === data.apl + 1) return 'challenging';
        else if (data.cr === data.apl + 2) return 'hard';
        else if (data.cr >= data.apl + 3) return 'epic';
        else return '';
    }

    static getCRChallengeName (data) {
        if (data.cr < data.apl) return i18n("COMBATDETAILS.easy");
        else if (data.cr === data.apl) return i18n("COMBATDETAILS.average");
        else if (data.cr === data.apl + 1) return i18n("COMBATDETAILS.challenging");
        else if (data.cr === data.apl + 2) return i18n("COMBATDETAILS.hard");
        else if (data.cr >= data.apl + 3) return i18n("COMBATDETAILS.epic");
        else return '';
    }

    static getCR(combat) {
        var apl = { count: 0, levels: 0 };
        var xp = 0;

        //get the APL of friendly combatants
        $(combat.data.combatants).each(function (idx, combatant) {
            if (combatant.actor != undefined) {
                if (combatant.token.disposition == 1) {
                    apl.count = apl.count + 1;
                    apl.levels = apl.levels + combatant.actor.data.data.details.level;
                } else {
                    xp += (combatant.actor.data.data.details.xp.value);
                }
            }
        });

        var calcAPL = 0;
        if (apl.count > 0)
            calcAPL = Math.round(apl.levels / apl.count) + (apl.count < 4 ? -1 : (apl.count > 5 ? 1 : 0));

        //get the CR of any unfriendly/neutral
        var cr = 999;
        $(CombatDetails.xpchart).each(function () {
            if (this.xp >= xp)
                cr = Math.min(cr, this.cr);
        });

        return { cr: cr, apl: calcAPL };
    }

    static getDiceSound(hasMaestroSound = false) {
        const has3DDiceSound = game.dice3d ? game.settings.get("dice-so-nice", "settings").enabled : false;
        const playRollSounds = true; //game.settings.get("betterrolls5e", "playRollSounds")

        if (playRollSounds && !has3DDiceSound && !hasMaestroSound) {
            return CONFIG.sounds.dice;
        }

        return null;
    }

    static rgbToHex(r, g, b) {
        var componentToHex = function (c) {
            var hex = c.toString(16);
            return hex.length == 1 ? "0" + hex : hex;
        }
        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    }

    static createPixelArray(imgData, pixelCount, quality) {
        const pixels = imgData;
        const pixelArray = [];

        for (let i = 0, offset, r, g, b, a; i < pixelCount; i = i + quality) {
            offset = i * 4;
            r = pixels[offset + 0];
            g = pixels[offset + 1];
            b = pixels[offset + 2];
            a = pixels[offset + 3];

            // If pixel is mostly opaque and not white
            if (typeof a === 'undefined' || a >= 125) {
                if (!(r > 250 && g > 250 && b > 250)) {
                    pixelArray.push([r, g, b]);
                }
            }
        }
        return pixelArray;
    }

    static getPalette(url) {
        // Create custom CanvasImage object
        CombatDetails.canvasImage = new Image();
        CombatDetails.canvasImage.addEventListener('load', () => {
            let canvas = document.createElement('canvas');
            let context = canvas.getContext('2d');
            let width = canvas.width = CombatDetails.canvasImage.naturalWidth;
            let height = canvas.height = CombatDetails.canvasImage.naturalHeight;
            context.drawImage(CombatDetails.canvasImage, 0, 0, width, height);

            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const pixelCount = CombatDetails.canvasImage.width * CombatDetails.canvasImage.height;

            const pixelArray = CombatDetails.createPixelArray(imageData.data, pixelCount, 10);

            canvas.remove();

            // Send array to quantize function which clusters values
            // using median cut algorithm
            const cmap = MMCQ.quantize(pixelArray, 5);
            const palette = cmap ? cmap.palette() : null;

            let element = $('.palette-fields');

            $(element).empty();
            for (let i = 0; i < palette.length; i++) {
                var hexCode = CombatDetails.rgbToHex(palette[i][0], palette[i][1], palette[i][2]);
                $(element).append($('<div>').addClass('background-palette').attr('title', hexCode).css({ backgroundColor: hexCode }).on('click', $.proxy(CombatDetails.updateSceneBackground, CombatDetails, hexCode)));
            }

            //const dominantColor = palette[0];
        });
        CombatDetails.canvasImage.src = url;
    };

    static async createThumbnail(img) {
        const newImage = img !== undefined;

        // Load required textures to create the thumbnail
        img = img ?? this.data.img;
        const toLoad = [img];
        await TextureLoader.loader.load(toLoad);

        // First load the background texture to get dimensions
        const bg = img ? await loadTexture(img) : null;

        // Get the target dimensions for the canvas
        const dims = duplicate(this.data);
        if (newImage) {
            dims.width = bg.width;
            dims.height = bg.height;
        }
        const d = Canvas.getDimensions(dims);

        // Create a container and add a transparent graphic to enforce the size
        const c = new PIXI.Container();
        const g = c.addChild(new PIXI.Graphics());
        g.beginFill(0xFFFFFF, 0.0).drawRect(0, 0, d.sceneWidth, d.sceneHeight);

        // Add the background image
        if (bg) {
            const s = new PIXI.Sprite(bg);
            s.width = d.sceneWidth;
            s.height = d.sceneHeight;
            c.addChild(s);
        }

        // Render the container to a thumbnail
        return ImageHelper.createThumbnail(c, { width, height });
    }

    static async updateSceneBackground(hexCode) {
        await CombatDetails.currentScene.update({ backgroundColor: hexCode });
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

Hooks.on("deleteCombat", function (combat) {
    CombatDetails.tracker = false;   //if the combat gets deleted, make sure to clear this out so that the next time the combat popout gets rendered it repositions the dialog

    //set movement to free movement
    CombatDetails.tokenbar.changeGlobalMovement("free");

    new AssignXPApp(combat).render(true);

    if (game.combats.combats.length == 0 && game.settings.get("combatdetails", 'close-combat-when-done')) {
        const tabApp = ui["combat"];
        tabApp.close();
    }

});

Hooks.on("updateCombat", function (data, delta) {
    CombatDetails.checkCombatTurn();

    $(CombatDetails.tokenbar.tokens).each(function () {
        this.token.unsetFlag("combatdetails", "nofified");
    });

	log("update combat", data);
	if(game.settings.get("combatdetails", "opencombat") && delta.round === 1 && data.turn === 0 && data.started === true){
		//new combat, pop it out
		const tabApp = ui["combat"];
		tabApp.renderPopout(tabApp);
		
        if (ui.sidebar.activeTab !== "chat")
            ui.sidebar.activateTab("chat");

        //set movement to combat only
        CombatDetails.tokenbar.changeGlobalMovement("combat");
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
Hooks.on("ready", CombatDetails.ready);

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

Hooks.on('renderCombatTracker', async (app, html, options) => {
    if (game.user.isGM && game.combat && !game.combat.started && game.settings.get("combatdetails", 'show-combat-cr')) {
        //calculate CR
        let data = CombatDetails.getCR(game.combat);

        if ($('#combat-round .encounter-cr-row').length == 0 && game.combat.data.combatants.length > 0) {
            $('<nav>').addClass('encounters flexrow encounter-cr-row')
                .append($('<h3>').html('CR: ' + CombatDetails.getCRText(data.cr)))
                .append($('<div>').addClass('encounter-cr').attr('rating', CombatDetails.getCRChallenge(data)).html(CombatDetails.getCRChallengeName(data)))
                .insertAfter($('#combat-round .encounters:last'));
        }
    }

    if (game.combat == undefined) {
        $('#combat-round h3', html).css({ fontSize: '16px', lineHeight: '15px'});
    }

    if (!game.user.isGM && game.combat && game.combat.started) {
        $('.combat-control[data-control="previousTurn"],.combat-control[data-control="nextTurn"]:last').css({visibility:'hidden'});
    }
});

Hooks.on('renderChatLog', (app, html, options) => {
    if (game.user.isGM) {
        $('<a>').addClass('button confetti').html('🎉').insertAfter($('#chat-controls .chat-control-icon', html)).on('click', function () {
            if (window.confetti) {
                const shootConfettiProps = window.confetti.getShootConfettiProps(2);
                window.confetti.shootConfetti(shootConfettiProps);
            }
        });
        $('.confetti-buttons', html).hide();
    }
});

Hooks.on('renderSceneConfig', async (app, html, options) => {
    if (game.settings.get("combatdetails", 'scene-palette')) {
        CombatDetails.currentScene = app.object;

        if (CombatDetails.currentScene.img != undefined) {
            let backgroundColor = $('input[name="backgroundColor"]').parents('.form-group:first');

            $('<div>')
                .addClass('form-group')
                .append($('<label>').html('Background Palette'))
                .append($('<div>').addClass('form-fields palette-fields'))
                .insertAfter(backgroundColor);

            CombatDetails.getPalette(CombatDetails.currentScene.img);
            //get dimensions
            loadTexture(CombatDetails.currentScene.img).then((bg) => {
                if (bg != undefined) {
                    $('.background-size.width').html(bg.width);
                    $('.background-size.height').html(bg.height);
                }
            });
        }

        $('<div>')
            .addClass('background-size width')
            .insertAfter($('input[name="width"]'));
        $('<div>')
            .addClass('background-size height')
            .insertAfter($('input[name="height"]'));

        $('input.image[name="img"]').on('change', function () {
            let img = $(this).val();
            CombatDetails.getPalette(img);
            loadTexture(img).then((bg) => {
                if (bg != undefined) {
                    $('.background-size.width').html(bg.width);
                    $('.background-size.height').html(bg.height);
                }
            });
        })
    }
});
