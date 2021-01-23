import { CombatDetails } from "../combatdetails.js";
import { SavingThrowApp } from "../apps/savingthrow.js";
import { ContestedRollApp } from "../apps/contestedroll.js";
import { AssignXPApp } from "../apps/assignxp.js";
import { log } from "../combatdetails.js";

export class TokenBar extends Application {
	constructor(options) {
	    super(options);

        this.tokens = [];

        /**
            * Track collapsed state
            * @type {boolean}
            */
        this._collapsed = false;

        /**
            * Track which hotbar slot is the current hover target, if any
            * @type {number|null}
            */
        this._hover = null;

        //this.changeGlobalMovement("free");
    }

    /* -------------------------------------------- */

    /** @override */
	static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
        id: "tokenbar",
        template: "./modules/combatdetails/templates/tokenbar.html",
        popOut: false
    });
    }

	/* -------------------------------------------- */

    /** @override */
	getData(options) {
        return {
            tokens: this.tokens,
            barClass: this._collapsed ? "collapsed" : "",
            movement: game.settings.get("combatdetails", "movement")
        };
    }

    show() {
        $(this.element).removeClass('loading').css({ display: 'flex !important' });
    }

    setPos() {
        let pos = $('#hotbar').position();
        let width = $('#hotbar').width();
        this.setPosition(pos.left + width + 4);
        $(this.element).css({ left: pos.left + width + 4 });

        return this;
    }

	/* -------------------------------------------- */

    /**
    * Get the Array of Macro (or null) values that should be displayed on a numbered page of the bar
    * @param {number} page
    * @returns {Token[]}
    * @private
    */
    _getTokensByScene() {
        let tokens = canvas.tokens.placeables.filter(t => {
            return t.actor?.hasPlayerOwner && t.actor?.data.type != 'npc'
        }).map(t => {
            let actor = t.actor;

            let ac = 10
            if (game.world.system === "pf1") {
                ac = actor.data.data.attributes.ac.normal.total
            } else {
                ac = (isNaN(parseInt(actor.data.data.attributes.ac.value)) || parseInt(actor.data.data.attributes.ac.value) === 0) ? 10 : parseInt(actor.data.data.attributes.ac.value);
            }

            //let perceptionTitle = "Passive Perception";
            let perception = 10;
            if (game.world.system === "pf1") {
                perception = actor.data.data.skills.per.mod
                //perceptionTitle = "Perception Mod";
            } else if (game.world.system === "pf2e") {
                if (actor.data.type === "npc" || actor.data.type === "familiar") {
                    perception = perception + actor.data.data.attributes.perception.value;
                } else {
                    const proficiency = actor.data.data.attributes.perception.rank ? actor.data.data.attributes.perception.rank * 2 + actor.data.data.details.level.value : 0;
                    perception = perception + actor.data.data.abilities[actor.data.data.attributes.perception.ability].mod + proficiency + actor.data.data.attributes.perception.item;
                }
                //perceptionTitle = "Perception DC";
            } else {
                perception = actor.data.data.skills.prc.passive;
            }

            t.unsetFlag("combatdetails", "notified");

            return {
                id: t.id,
                token: t,
                icon: t.data.img,
                ac: ac,
                pp: perception
            }
        });

        this.tokens = tokens;
    }

	/* -------------------------------------------- */

    /**
    * Collapse the Hotbar, minimizing its display.
    * @return {Promise}    A promise which resolves once the collapse animation completes
    */
    async collapse() {
        if ( this._collapsed ) return true;
        const toggle = this.element.find(".bar-toggle");
        const icon = toggle.children("i");
        const bar = this.element.find("#token-action-bar");
        return new Promise(resolve => {
            bar.slideUp(200, () => {
            bar.addClass("collapsed");
            icon.removeClass("fa-caret-down").addClass("fa-caret-up");
            this._collapsed = true;
            resolve(true);
            });
        });
    }

	/* -------------------------------------------- */

    /**
    * Expand the Hotbar, displaying it normally.
    * @return {Promise}    A promise which resolves once the expand animation completes
    */
    expand() {
        if ( !this._collapsed ) return true;
        const toggle = this.element.find(".bar-toggle");
        const icon = toggle.children("i");
        const bar = this.element.find("#token-action-bar");
        return new Promise(resolve => {
            bar.slideDown(200, () => {
            bar.css("display", "");
            bar.removeClass("collapsed");
            icon.removeClass("fa-caret-up").addClass("fa-caret-down");
            this._collapsed = false;
            resolve(true);
            });
        });
    }

	/* -------------------------------------------- */
    /*  Event Listeners and Handlers
	/* -------------------------------------------- */

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Macro actions
        html.find('.bar-toggle').click(this._onToggleBar.bind(this));
        html.find(".request-roll").click(this._onRequestRoll.bind(this));
        html.find(".contested-roll").click(this._onContestedRoll.bind(this));
        html.find(".assign-xp").click(this._onAssignXP.bind(this));
        html.find(".token-movement").click(this._onChangeMovement.bind(this));
        html.find(".token").click(this._onClickToken.bind(this)).dblclick(this._onDblClickToken.bind(this)).hover(this._onHoverToken.bind(this));

        // Activate context menu
        this._contextMenu(html);
    }

    /* -------------------------------------------- */

    /**
    * Create a Context Menu attached to each Macro button
    * @param html
    * @private
    */
    _contextMenu(html) {
        new ContextMenu(html, ".token", [
            {
                name: "COMBATDETAILS.EditCharacter",
                icon: '<i class="fas fa-edit"></i>',
                callback: li => {
                    log('Open character sheet');
                    const entry = this.tokens.find(t => t.id === li[0].dataset.tokenId);
                    if (entry.token.actor) entry.token.actor.sheet.render(true);
                }
            },
            {
                name: "COMBATDETAILS.EditToken",
                icon: '<i class="fas fa-edit"></i>',
                callback: li => {
                    log('Open token edit');
                    const entry = this.tokens.find(t => t.id === li[0].dataset.tokenId);
                    if (entry.token.actor) entry.token.sheet.render(true)
                }
            },
            {
                name: "COMBATDETAILS.TargetToken",
                icon: '<i class="fas fa-bullseye"></i>',
                callback: li => {
                    log('Target token');
                }
            },
            {
                name: "COMBATDETAILS.FreeMovement",
                icon: '<i class="fas fa-running"></i>',
                callback: li => {
                    const entry = this.tokens.find(t => t.id === li[0].dataset.tokenId);
                    this.changeTokenMovement(entry, 'free');
                }
            },
            {
                name: "COMBATDETAILS.NoMovement",
                icon: '<i class="fas fa-street-view"></i>',
                callback: li => {
                    const entry = this.tokens.find(t => t.id === li[0].dataset.tokenId);
                    this.changeTokenMovement(entry, 'none');
                }
            },
            {
                name: "COMBATDETAILS.CombatTurn",
                icon: '<i class="fas fa-fist-raised"></i>',
                callback: li => {
                    const entry = this.tokens.find(t => t.id === li[0].dataset.tokenId);
                    this.changeTokenMovement(entry, 'combat');
                }
            }
        ]);
    }

    async _onRequestRoll(event) {
        event.preventDefault();

        new SavingThrowApp().render(true);

        log('open request roll');
    }

    async _onContestedRoll(event) {
        event.preventDefault();

        this.contestedroll = new ContestedRollApp().render(true);

        log('open contest roll');
    }

    async _onAssignXP(event) {
        event.preventDefault();

        new AssignXPApp().render(true);

        log('open xp dialog');
    }

    async _onChangeMovement(event) {
        event.preventDefault();

        const btn = event.currentTarget;
        this.changeGlobalMovement(btn.dataset.movement);
    }

    async changeGlobalMovement(movement) {
        if (movement == 'combat' && (game.combat == undefined || !game.combat.started))
            return;

        await game.settings.set("combatdetails", "movement", movement);
        //clear all the tokens individual movement settings
        $(this.tokens).each(function () {
            this.token.setFlag("combatdetails", "movement", null);
            this.token.unsetFlag("combatdetails", "notified");
        });
        this.render(true);

        this.displayNotification(movement);

        log('change movement', this.movement);
    }

    async changeTokenMovement(entry, movement) {
        let tMovement = (game.settings.get("combatdetails", "movement") != movement ? movement : null)
        await entry.token.setFlag("combatdetails", "movement", tMovement);
        entry.token.unsetFlag("combatdetails", "notified");
        this.render(true);

        this.displayNotification(tMovement, entry.token);
    }

    displayNotification(movement, token) {
        if (game.settings.get("combatdetails", "notify-on-change")) {
            let msg = (token != undefined ? token.name + ": " : "") + "Movement changed to " + (movement == "free" ? "Free Movement" : (movement == "none" ? "No Movement" : "Combat Turn"));
            ui.notifications.warn(msg);
            log('display notification');
            game.socket.emit(
                CombatDetails.SOCKET,
                {
                    msgtype: 'movementchange',
                    senderId: game.user._id,
                    msg: msg,
                    tokenid: token?.id
                },
                (resp) => { }
            );
        }
    }

    /* -------------------------------------------- */

    /**
    * Handle left-click events to
    * @param event
    * @private
    */
    async _onClickToken(event) {
        event.preventDefault();
        const li = event.currentTarget;
        const entry = this.tokens.find(t => t.id === li.dataset.tokenId);

        log('Center on token', entry, entry.token);
        entry.token.control({ releaseOthers: true });
        return canvas.animatePan({ x: entry.token.x, y: entry.token.y });
    }

    async _onDblClickToken(event) {
        event.preventDefault();
        const li = event.currentTarget;
        const entry = this.tokens.find(t => t.id === li.dataset.tokenId);

        if (entry.token.actor)
            entry.token.actor.sheet.render(true);
    }

    /* -------------------------------------------- */

    /**
    * Handle hover events on a macro button to track which slot is the hover target
    * @param {Event} event   The originating mouseover or mouseleave event
    * @private
    */
    _onHoverToken(event) {
        event.preventDefault();
        const li = event.currentTarget;
        const hasAction = !li.classList.contains("inactive");

        // Remove any existing tooltip
        const tooltip = li.querySelector(".tooltip");
        if ( tooltip ) li.removeChild(tooltip);

        // Handle hover-in
        if ( event.type === "mouseenter" ) {
            this._hover = li.dataset.tokenId;
            if (hasAction) {
                const entry = this.tokens.find(t => t.id === li.dataset.tokenId);
                const tooltip = document.createElement("SPAN");
                tooltip.classList.add("tooltip");
                tooltip.textContent = entry.token.name;
                li.appendChild(tooltip);
            }
        }

        // Handle hover-out
        else {
            this._hover = null;
        }
    }

    /* -------------------------------------------- */

    /**
    * Handle click events to toggle display of the macro bar
    * @param {Event} event
    * @private
    */
    _onToggleBar(event) {
        event.preventDefault();
        if ( this._collapsed ) this.expand();
        else this.collapse();
    }
}

Hooks.on('renderTokenBar', (app, html) => {
    CombatDetails.tokenbar.setPos().show();
    //CombatDetails.tokenbar._getTokensByScene();
    let gMovement = game.settings.get("combatdetails", "movement");
    $('.token-movement[data-movement="' + gMovement + '"]', html).addClass('active');
    $('.token-movement[data-movement="combat"]', html).toggleClass('disabled', game.combats.active?.started !== true);
    $(app.tokens).each(function () {
        let tMovement = this.token.getFlag("combatdetails", "movement");
        if (tMovement != undefined && tMovement != gMovement) {
            $('.token[data-token-id="' + this.id + '"] .movement-icon', html).attr('movement', tMovement);
        }
    });
});

Hooks.on("ready", () => {
    if (game.user.isGM && game.settings.get("combatdetails", "show-token-bar")) {
        CombatDetails.tokenbar = new TokenBar();
        CombatDetails.tokenbar._getTokensByScene();
        CombatDetails.tokenbar.render(true);
    }
});


Hooks.on('canvasReady', () => {
    //CombatDetails.tokenbar._getTokensByScene();
    //$('.token-action-bar .token-list', CombatDetails.tokenbar.element).empty();
    if (game.user.isGM && CombatDetails.tokenbar != undefined) {
        CombatDetails.tokenbar._getTokensByScene();
        CombatDetails.tokenbar.render(true);
    }
});

Hooks.on("createToken", (token) => {
    if (game.user.isGM && CombatDetails.tokenbar != undefined) {
        CombatDetails.tokenbar._getTokensByScene();
        CombatDetails.tokenbar.render(true);
    }
});

Hooks.on("deleteToken", (token) => {
    if (game.user.isGM && CombatDetails.tokenbar != undefined) {
        CombatDetails.tokenbar._getTokensByScene();
        CombatDetails.tokenbar.render(true);
    }
});