import { log } from "./combatdetails.js";

class TokenBar extends Application {
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
    }

    /* -------------------------------------------- */

    /** @override */
	static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
        id: "tokenbar",
        template: "templates/tokenbar.html",
        popOut: false
    });
    }

	/* -------------------------------------------- */

    /** @override */
	getData(options) {
	    this.tokens = this._getTokensByScene();
        return {
            tokens: this.tokens,
            barClass: this._collapsed ? "collapsed" : ""
        };
    }

    show() {
        $(this.element).removeClass('loading').css({ display: 'flex !important' });
    }

    setPos() {
        let pos = $('#hotbar').position();
        this.setPosition(pos.left, pos.top);
        $(this.element).css({ left: pos.left, top: pos.top });

        return this;
    }

	/* -------------------------------------------- */

    /**
    * Get the Array of Macro (or null) values that should be displayed on a numbered page of the bar
    * @param {number} page
    * @returns {Token[]}
    * @private
    */
    _getTokensByScene(page) {
        //get the current scene
        let tokens = [];
        //get the tokens that are owned by players

        return tokens;
        /*
        const macros = game.user.getHotbarMacros(page);
        for ( let [i, m] of macros.entries() ) {
            m.key = i<9 ? i+1 : 0;
            m.cssClass = m.macro ? "active" : "inactive";
            m.icon = m.macro ? m.macro.data.img : null;
        }
        return macros;
        */
    }

	/* -------------------------------------------- */

    /**
    * Collapse the Hotbar, minimizing its display.
    * @return {Promise}    A promise which resolves once the collapse animation completes
    */
    async collapse() {
        if ( this._collapsed ) return true;
        const toggle = this.element.find("#bar-toggle");
        const icon = toggle.children("i");
        const bar = this.element.find("#action-bar");
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
        const toggle = this.element.find("#bar-toggle");
        const icon = toggle.children("i");
        const bar = this.element.find("#action-bar");
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
        html.find(".token").click(this._onClickToken.bind(this)).hover(this._onHoverToken.bind(this));

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
                }
            },
            {
                name: "COMBATEDETAILS.EditToken",
                icon: '<i class="fas fa-edit"></i>',
                callback: li => {
                    log('Open token edit');
                }
            },
            {
                name: "COMBATEDETAILS.TargetToken",
                icon: '<i class="fas fa-bullseye"></i>',
                callback: li => {
                    log('Target token');
                }
            }
        ]);
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
        const token = game.currentScene.tokens.get(li.dataset.tokenId);

        log('Center on token', token);
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
            this._hover = li.dataset.slot;
            if ( hasAction ) {
                const token = game.currentScene.tokens.get(li.dataset.tokenId);
                const tooltip = document.createElement("SPAN");
                tooltip.classList.add("tooltip");
                    tooltip.textContent = token.name;
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

Hooks.on('renderTokenBar', () => {
    CombatDetails.app.setPos().show();
});