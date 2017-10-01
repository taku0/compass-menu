/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * The menu class.
 *
 * The menu captures input events on the window and updates DOM.
 * The menu has a state object handling input.
 *
 * The coordinate system used by the menu is the user coordinate of
 * the menu SVG node.
 */

'use strict';

// FIXME What happens if CSS transforms are applied to
//       the body element and/or iframe element?

//// The menu class

/**
 * The menu.
 *
 * - Holds items
 * - Updates SVG DOM nodes
 * - Handles input, using the state pattern.
 *
 * The index of the menu item begins from 0 to 7.
 * The right item has the index 0.  The index increases clockwise.
 */
class PieMenu {
    /**
     * @param {Node} container An absolute-positioned node containing the menu.
     * @param {SVGLocatable} menuNode A SVG element represents menu.
     * @param {SVGLocatable} outer A SVG element represents
     *     the outer circle of the menu.
     * @param {SVGLocatable} hole A SVG element represents the hole of the menu.
     * @param {Array.<SVGStylable>} itemElements
     *     An array of SVG elements represents menu item.
     * @param {Array.<SVGStylable>} markerElements
     *     An array of SVG elements represents children indicator.
     * @param {Array.<function (string)>} textSetters
     *     An array of functions setting label text.
     *     Passing null to functions hides balloon.
     * @param {Object.<string, Array.<?types.MenuItem>>} context
     *     An map from context names to arrays of menu items.
     * @param {Array.<types.MenuFilter>} menuFilters
     *     An array of menu filters.
     * @param {Object.<string, *>} config A configuration.
     */
    constructor(
        container, menuNode, outer, hole,
        itemElements, markerElements,
        textSetters,
        contexts, menuFilters, config
    ) {
        this.container = container;
        this.menuNode = menuNode;
        this.outer = outer;
        this.radius = outer.getBBox().width / 2;
        this.holeRadius = hole.getBBox().width / 2;
        this.itemElements = itemElements;
        this.markerElements = markerElements;
        this.textSetters = textSetters;
        this.contexts = contexts;
        this.items = contexts['page'];
        this.menuFilters = menuFilters;
        this.config = config;
        this.stopped = false;

        this.variantIndex = 0;
        this.labelVisible = false;

        this.lastPoint = null;
        this.labelTimerID = null;
        this.lastScrollPosition = null;
        this.scrollEventPending = false;

        const containerWindow = container.ownerDocument.defaultView;
        const menuWindow = menuNode.ownerDocument.defaultView;

        let windows;

        if (containerWindow === menuWindow) {
            windows = [containerWindow];
        } else {
            windows = [containerWindow, menuWindow];
        }

        function registerEventListener(win) {
            function doRegister(name, handler, passive) {
                win.addEventListener(name, handler.bind(this), {
                    capture: false,
                    passive: passive || false,
                });
            }

            doRegister = doRegister.bind(this);

            doRegister('mousedown', this.onMouseDown);
            doRegister('mouseup', this.onMouseUp);
            doRegister('mousemove', this.onMouseMove);
            doRegister('scroll', this.onScroll, true);
            doRegister('keydown', this.onKeyDown);
            doRegister('keyup', this.onKeyUp);
            doRegister('contextmenu', this.onContextMenu);
        }

        windows.forEach(registerEventListener, this);

        this.state = new PieMenu.states.Initial(this, config);

        return this;
    }

    /**
     * @return {Vector2D} The center point of the menu, in the user coordinates.
     */
    getCenter() {
        const box = this.outer.getBBox();

        const transform = this.outer.getTransformToElement(this.menuNode);

        const centerX = box.x + box.width / 2;
        const centerY = box.y + box.height / 2;

        return new Vector2D(centerX, centerY).applyTransform(transform);
    }

    /**
     * @return {SVGMatrix}
     *    The transforming matrix from the client coordinates
     *    (i.e. coordinates for MouseEvent#clientX) to user coordinates.
     */
    getClientToUser() {
        return this.menuNode.getScreenCTM().inverse();
    }

    /**
     * @return {Vector2D}
     *   The client position of the mouse cursor in inner window coordinates.
     * @param {MouseEvent} event The mouse event.
     */
    getClientPosition(event) {
        const containerWindow = this.container.ownerDocument.defaultView;
        const menuWindow = this.menuNode.ownerDocument.defaultView;
        const eventWindow = event.target.ownerDocument ?
                  event.target.ownerDocument.defaultView : null;

        let windowOffset;

        if (containerWindow === eventWindow) {
            const boundingClientRect = this.container.getBoundingClientRect();

            windowOffset =
                new Vector2D(-boundingClientRect.left, -boundingClientRect.top);
        } else {
            windowOffset = new Vector2D(0, 0);
        }

        return new Vector2D(event.clientX, event.clientY).plus(windowOffset);
    }

    /**
     * @return {SVGSVGElement} The owner 'svg' element of the menu.
     */
    getOwnerSVGElement() {
        const ownerSVGElement = this.menuNode.ownerSVGElement;

        return (ownerSVGElement === null) ? this.menuNode : ownerSVGElement;
    }

    /**
     * @param {number} x The translation amount in X.
     * @param {number} y The translation amount in Y.
     *
     * @return {SVGTransform} A SVGTransform that translates point.
     */
    createTranslateTransform(x, y) {
        const transform = this.getOwnerSVGElement().createSVGTransform();

        transform.setTranslate(x, y);

        return transform;
    }

    /**
     * Follows scroll movement.
     *
     * @param {Vector2D} scrollPosition The current scroll position,
     *   i.e. (window.scrollX, window.scrollY)
     */
    followScroll(scrollPosition) {
        const diff = scrollPosition.diff(this.lastScrollPosition);
        const point = this.lastPoint.plus(diff);

        this.follow(point);

        this.lastScrollPosition = scrollPosition;
    }

    /**
     * Moves the menu or opens a sub menu, depending on the mouse cursor position.
     *
     * If the mouse cursor position is within the menu, does nothing.
     * Otherwise, if the nearest menu item has a sub menu, opens it.
     * Otherwise, moves the menu.
     *
     * If the mouse cursor position is omitted, the last point is used.
     *
     * @param {{x: number, y: number}=} point The mouse cursor position,
     *     in the user coordinates.
     */
    follow(point) {
        if (arguments.length == 0) {
            point = this.lastPoint;
        } else {
            this.lastPoint = point;
        }

        const center = this.getCenter();
        const distanceSq = center.distanceSquared(point);

        if (distanceSq > this.radius * this.radius) {
            const index = this.getItemIndex(point, center);

            if (this.hasChildren(index)) {
                this.openAt(point, this.getChildrenAt(index));
            } else {
                this.doFollow(point, center);
            }
        }
    }

    /**
     * Moves the menu.
     *
     * @param {{x: number, y: number}} point The mouse cursor position,
     *     in the user coordinates.
     * @param {{x: number, y: number}} center The center position,
     *     in the user coordinates.
     * @protected
     */
    doFollow(point, center) {
        const diff = point.diff(center);

        const movement = diff.normalize().scale(diff.norm() - this.radius);

        this.moveBy(movement);

        this.lastPoint = this.lastPoint.diff(movement);

        this.hideLabelTexts();
    }

    /**
     * Moves the menu by the given offset.
     *
     * @param {{x: number, y: number}} movement The amount of the movement,
     *     in the user coordinates.
     */
    moveBy(movement) {
        if (this.container.transform) {
            const translate = this.createTranslateTransform(
                movement.x, movement.y
            );
            const currentTransform = this.container.transform.baseVal;

            currentTransform.appendItem(translate, 0);
            currentTransform.consolidate();
        } else {
            const clientPosition = new Vector2D(
                this.container.offsetLeft, this.container.offsetTop
            );

            const clientMovement =
                      movement.applyTransform(this.getClientToUser().inverse());

            const newPosition = clientPosition.plus(clientMovement);

            this.container.style.left = newPosition.x + 'px';
            this.container.style.top = newPosition.y + 'px';
        }
    }

    /**
     * @return {number} The index of the nearest menu item to
     *     the mouse cursor position.
     *
     * @param {{x: number, y: number}} point The mouse cursor position,
     *     in the user coordinates.
     * @param {{x: number, y: number}=} center The center point of the menu,
     *     in the user coordinates.
     */
    getItemIndex(point, center) {
        if (!center) {
            center = this.getCenter();
        }

        const TwoPI = 2 * Math.PI;

        const diff = point.diff(center);

        let theta = Math.atan2(diff.y, diff.x);

        if (theta < 0) {
            theta += TwoPI;
        }

        if (15 / 16.0 * TwoPI < theta || theta <=  1 / 16.0 * TwoPI) {
            return 0;
        } else {
            return Math.floor((theta + 1 / 16.0 * TwoPI) * 8 / TwoPI);
        }
    }

    /**
     * Returns the current menu item variant.
     *
     * If the current variant is the secondary variant and the secondary
     * variant is not defined, the primary variant is returnd.
     *
     * @return {types.Variant} The current menu item variant.
     * @param {number} index The index of the menu item.
     */
    getVariant(index) {
        const item = this.items[index];

        if (item && item.length > 0) {
            const variant = item[this.variantIndex];

            if (variant) {
                return variant;
            } else {
                return item[0];
            }
        } else {
            return null;
        }
    }

    /**
     * @return {boolean} true iff the menu item at given index has a sub menu.
     *
     * @param {number} index The index of the menu item.
     */
    hasChildren(index) {
        const variant = this.getVariant(index);

        return variant && variant.children && variant.children.length > 0;
    }

    /**
     * @return {types.MenuItem} The sub menu items at given index.
     *
     * @param {number} index The index of the menu item.
     */
    getChildrenAt(index) {
        return this.getVariant(index).children;
    }

    /**
     * Opens the menu at given position.
     *
     * If items, target, or pageState are specified,
     * this method updates the menu.
     *
     * @param {{x: number, y: number}} center The new position of the center.
     * @param {Array.<?type.MenuItem>=} items The new menu items.
     * @param {Node=} target
     *   The node on which the user pressed the mouse button.
     * @param {type.PageState=} pageState The state of the page.
     */
    openAt(center, items, target, pageState) {
        this.container.style.display = 'inline';

        if (target) {
            this.target = target;

            // To get keypress events for alt keys.
            target.ownerDocument.defaultView.focus();
            target.focus();
        } else {
            target = this.target;
        }

        if (pageState) {
            this.pageState = pageState;
        } else {
            pageState = this.pageState;
        }

        if (items) {
            const config = this.config;

            this.items = this.menuFilters.reduce(
                (items, menuFilter) => items.map(
                    (item) => menuFilter(target, pageState, item, config)
                ),
                items
            );
        }

        const oldCenter = this.getCenter();

        this.moveBy(center.diff(oldCenter));

        this.updateIcons();

        this.hideLabelTexts();
        this.resetLabelTimer();
    }

    /**
     * Updates icons.
     */
    updateIcons() {
        for (let i = 0; i < 8; i++) {
            const variant = this.getVariant(i);

            if (variant) {
                const itemElement = this.itemElements[i];

                itemElement.style.display = 'inline';
                itemElement.setAttributeNS(
                    'http://www.w3.org/1999/xlink',
                    'href',
                    variant.icon
                );

                const hasChildren = variant.children &&
                          variant.children.length > 0;

                this.markerElements[i].style.display =
                    hasChildren ? 'inline' : 'none';
            } else {
                this.itemElements[i].style.display = 'none';
                this.markerElements[i].style.display = 'none';
            }
        }
    }

    /**
     * Resets the timer showing label texts.
     */
    resetLabelTimer() {
        this.clearLabelTimer();

        this.labelTimerID = setTimeout(
            this.updateLabelTexts.bind(this), this.config.labelDelay
        );
    }

    /**
     * Clears the timer showing label texts.
     */
    clearLabelTimer() {
        if (this.labelTimerID) {
            clearTimeout(this.labelTimerID);
        }
    }

    /**
     * Hides the label texts.
     */
    hideLabelTexts() {
        for (let textSetter of this.textSetters) {
            textSetter(null);
        }
        this.labelVisible = false;
        this.clearLabelTimer();
    }

    /**
     * Updates the label texts if the labels are visible.
     */
    updateLabelTextsIfVisible() {
        if (this.labelVisible) {
            this.updateLabelTexts();
        } else {
            this.hideLabelTexts();
            this.resetLabelTimer();
        }
    }

    /**
     * Updates the label texts.
     */
    updateLabelTexts() {
        for (let i = 0; i < 8; i++) {
            const variant = this.getVariant(i);

            const textSetter = this.textSetters[i];

            if (variant) {
                let localizedLabel = browser.i18n.getMessage(variant.label);

                if (!localizedLabel) {
                    localizedLabel = variant.label;
                }

                textSetter(localizedLabel);
            } else {
                textSetter(null);
            }
        }
        this.labelVisible = true;
    }

    /**
     * Activates the nearest menu item to the mouse cursor.
     *
     * Does nothing if the nearest menu item is empty.
     *
     * @param {{x: number, y: number}} point The mouse cursor position.
     */
    activateItemAt(point) {
        const center = this.getCenter();
        const distanceSq = center.distanceSquared(point);

        if (distanceSq > this.holeRadius * this.holeRadius) {
            const index = this.getItemIndex(point);
            const variant = this.getVariant(index);

            if (variant && variant.action) {
                // Since some commands assume the current frame is the frame
                // containing the target node.
                this.target.ownerDocument.defaultView.focus();
                variant.action(this);
            }
        }
    }

    /**
     * Hides the menu.
     */
    hide() {
        this.container.style.display = 'none';
        this.hideLabelTexts();
    }

    /**
     * Sets variants.
     *
     * @param {number} variantIndex The new variant index.
     */
    setVariant(variantIndex) {
        this.variantIndex = variantIndex;
        this.updateIcons();
        this.updateLabelTextsIfVisible();
    }

    /**
     * Sets a configuration.
     *
     * @param {Object.<string, *>} config A configuration.
     */
    setConfig(config) {
        this.config = config;
        this.state.config = config;
    }

    /**
     * Handles mousedown events
     *
     * @param {MouseEvent} event The mouse event object.
     */
    onMouseDown(event) {
        if (this.state.onMouseDown && !event.defaultPrevented) {
            this.state.onMouseDown(event);
        }
    }

    /**
     * Handles mouserelease events
     *
     * @param {MouseEvent} event The mouse event object.
     */
    onMouseUp(event) {
        if (this.state.onMouseUp && !event.defaultPrevented) {
            this.state.onMouseUp(event);
        }
    }

    /**
     * Handles mousemove events
     *
     * @param {MouseEvent} event The mouse event object.
     */
    onMouseMove(event) {
        if (this.state.onMouseMove && !event.defaultPrevented) {
            this.state.onMouseMove(event);
        }
    }

    /**
     * Handles scroll events
     *
     * @param {Event} event The event object.
     */
    onScroll(event) {
        if (this.state.onScroll &&
            !event.defaultPrevented &&
            !this.scrollEventPending) {

            window.requestAnimationFrame(() => {
                this.state.onScroll(event);
                this.scrollEventPending = false;
            });

            this.scrollEventPending = true;
        }
    }

    /**
     * Handles keydown events
     *
     * @param {KeyboardEvent} event The keyboard event object.
     */
    onKeyDown(event) {
        if (this.state.onKeyDown && !event.defaultPrevented) {
            this.state.onKeyDown(event);
        }
    }

    /**
     * Handles keyup events
     *
     * @param {KeyboardEvent} event The keyboard event object.
     */
    onKeyUp(event) {
        if (this.state.onKeyUp && !event.defaultPrevented) {
            this.state.onKeyUp(event);
        }
    }

    /**
     * Handles contextmenu events
     *
     * @param {KeyboardEvent} event The keyboard event object.
     */
    onContextMenu(event) {
        if (this.state.onContextMenu && !event.defaultPrevented) {
            this.state.onContextMenu(event);
        }
    }
}

//// State classes for the state patterns

/**
 * State classes
 */
PieMenu.states = (() => {
    /**
     * The common super class for states showing the menu.
     */
    class ShowingState {
        /**
         * Handles mousemove events.
         *
         * Moves the menu or opens a sub menu.
         *
         * @param {MouseEvent} The mouse event object.
         */
        onMouseMove(event) {
            const clientToUser = this.menu.getClientToUser();
            const point = this.menu.getClientPosition(event)
                      .applyTransform(clientToUser);

            this.menu.follow(point);
            this.menu.resetLabelTimer();
        }

        /**
         * Handles mousedown events.
         *
         * Selects the secondary variant.
         *
         * @param {MouseEvent} The mouse event object.
         */
        onMouseDown(event) {
            this.menu.setVariant(1);
            event.preventDefault();
            event.stopPropagation();
        }

        /**
         * Handles mouseup events.
         *
         * Selects the primary variant.
         *
         * @param {MouseEvent} The mouse event object.
         */
        onMouseUp(event) {
            this.menu.setVariant(0);
            event.preventDefault();
            event.stopPropagation();
        }

        /**
         * Handles context events.
         *
         * Prevents the default.
         *
         * @param {Event} The event object.
         */
        onContextMenu(event) {
            event.preventDefault();
            event.stopPropagation();
        }

        /**
         * Handles keydown events.
         *
         * Selects the secondary variants if the alt key is pressed.
         *
         * @param {KeyboardEvent} The keyboard event object.
         */
        onKeyDown(event) {
            if (event.altKey) {
                this.menu.setVariant(1);
                event.preventDefault();
                event.stopPropagation();
            }

            let isESCPressed;

            if ('key' in event) {
                isESCPressed = (event.key === 'Esc');
            } else {
                isESCPressed = (event.keyCode === event.DOM_VK_ESCAPE);
            }

            if (isESCPressed) {
                this.menu.state = new Initial(this.menu, this.config);
            }
        }

        /**
         * Handles keyup events.
         *
         * Selects the primary variants if the alt key is released.
         *
         * @param {KeyboardEvent} The keyboard event object.
         */
        onKeyUp(event) {
            if (!event.altKey) {
                this.menu.setVariant(0);
                event.preventDefault();
                event.stopPropagation();
            }
        }

        /**
         * Handles scroll events.
         *
         * Moves the menu or opens a sub menu.
         *
         * @param {MouseEvent} The mouse event object.
         */
        onScroll(event) {
            const scrollPosition = new Vector2D(window.scrollX, window.scrollY);

            this.menu.followScroll(scrollPosition);
        }
    }

    /**
     * The initial state. The menu is hidden
     */
    class Initial {
        /*
         * @param {PieMenu} menu The menu.
         * @param {Object} config The configurations.
         */
        constructor(menu, config) {
            this.menu = menu;
            this.config = config;

            this.menu.setVariant(0);

            this.menu.hide();
        }

        /**
         * Handles context events.
         *
         * Prevents the default if going to open the menu.
         *
         * @param {Event} The event object.
         */
        onContextMenu(event) {
            if (!this.isOpenButton(event) || this.isSupressed(event)) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
        }

        /**
         * Handles mousedown events.
         *
         * If the correct button and modifiers is pressed, opens the menu and
         * transits to the Pressed state.
         *
         * @param {MouseEvent} The mouse event object.
         */
        onMouseDown(event) {
            if (!this.isOpenButton(event) || this.isSupressed(event)) {
                return;
            }

            const menu = this.menu;
            const config = this.config;

            function openMenu(pageState) {
                menu.container.style.display = 'inline';

                const clientPosition = menu.getClientPosition(event);
                const point = clientPosition.applyTransform(
                    menu.getClientToUser()
                );
                const context = detectContext(event.target);

                menu.container.style.display = 'inline';
                menu.openAt(
                    point, menu.contexts[context], event.target, pageState
                );
                menu.lastPoint = menu.getCenter();
                menu.lastScrollPosition = new Vector2D(
                    window.scrollX, window.scrollY
                );
            }

            queryPageState()
                .then(pageState => {
                    // FIXME:
                    // When user hits ESC or stop button on the address bar
                    // while loading the page, `document.readyState` stays
                    // `interactive`.
                    pageState.isLoading =
                        !menu.stopped && document.readyState !== 'complete';

                    return openMenu(pageState);
                })
                .catch(error => console.log(error));

            menu.state = new Pressed(menu, config);

            event.preventDefault();
            event.stopPropagation();
        }

        /**
         * @return {boolean}
         *     true iff the right button and required modifiers is pressed.
         * @param {MouseEvent} The mouse event object.
         * @protected
         */
        isOpenButton(event) {
            const button = getMouseButton(event);

            const isOpenButton = this.config.openButton == button;

            const ctrlGuard = !this.config.requireCtrl || event.ctrlKey;
            const shiftGuard = !this.config.requireShift || event.shiftKey;

            return isOpenButton && ctrlGuard && shiftGuard;
        }

        /**
         * @return {boolean}
         *     true if supressing modifiers is pressed.
         * @param {MouseEvent} The mouse event object.
         * @protected
         */
        isSupressed(event) {
            const supressedByCtrl =
                      this.config.isCtrlSupress && event.ctrlKey;

            const supressedByShift =
                      this.config.isShiftSupress && event.shiftKey;

            if (this.config.isCtrlSupress && this.config.isShiftSupress) {
                return supressedByCtrl && supressedByShift;
            } else {
                return supressedByCtrl || supressedByShift;
            }
        }

    }

    /**
     * The state the user is holding the right button without moving the mouse.
     */
    class Pressed extends ShowingState {
        /**
         * @param {PieMenu} menu The menu.
         * @param {Object} config The configurations.
         */
        constructor(menu, config) {
            super();
            this.menu = menu;
            this.config = config;
        }

        /**
         * Handles mousemove events.
         *
         * Transits to the Moved state.
         *
         * @param {MouseEvent} The mouse event object.
         */
        onMouseMove(event) {
            this.menu.state = new Moved(this.menu, this.config);

            super.onMouseMove(event);
        }

        /**
         * Handles scroll events.
         *
         * Transits to the Moved state.
         *
         * @param {MouseEvent} The mouse event object.
         */
        onScroll(event) {
            this.menu.state = new Moved(this.menu, this.config);

            super.onScroll(event);
        }

        /**
         * Handles mouseup events.
         *
         * Transits to the Released state if the released button is
         * the button opened the menu.
         *
         * @param {MouseEvent} The mouse event object.
         */
        onMouseUp(event) {
            if (getMouseButton(event) == this.config.openButton) {
                this.menu.state = new Released(this.menu, this.config);
                event.preventDefault();
                event.stopPropagation();
            } else {
                super.onMouseUp(event);
            }
        }
    }

    /**
     * The state the user is holding the right button and moved the mouse.
     *
     * Releasing the button activates a menu item.
     */
    class Moved extends ShowingState {
        /**
         * @param {PieMenu} menu The menu.
         * @param {Object} config The configurations.
         * @param {number=} startingButton The button activated this state.
         *     The config.openButton is used if omitted.
         */
        constructor(menu, config, startingButton) {
            super();

            if (startingButton === undefined) {
                startingButton = config.openButton;
            }

            this.menu = menu;
            this.config = config;
            this.startingButton = startingButton;
        }

        /**
         * Handles mouseup events.
         *
         * Activates the menu item and returns to the Initial state.
         *
         * @param {MouseEvent} The mouse event object.
         */
        onMouseUp(event) {
            if (getMouseButton(event) == this.startingButton) {
                const clientToUser = this.menu.getClientToUser();
                const point = this.menu.getClientPosition(event)
                          .applyTransform(clientToUser);

                try {
                    this.menu.activateItemAt(point);
                } catch (error) {
                    console.log('cannot activate item:', error);
                }

                this.menu.state = new Initial(this.menu, this.config);
                event.preventDefault();
                event.stopPropagation();
            } else {
                super.onMouseUp(event);
            }
        }
    }

    /**
     * The state the user released the right button without moving the mouse.
     *
     * Pressing and releasing the button activates a menu item.
     */
    class Released extends ShowingState{
        /**
         * @param {PieMenu} menu The menu.
         * @param {Object} config The configurations.
         */
        constructor(menu, config) {
            super();
            this.menu = menu;
            this.config = config;
        }

        /**
         * Handles mousedown events.
         *
         * Transits to the Moved state.
         *
         * @param {MouseEvent} The mouse event object.
         */
        onMouseDown(event) {
            const button = getMouseButton(event);

            this.menu.state = new Moved(this.menu, this.config, button);
            event.preventDefault();
            event.stopPropagation();
        };
    }

    return {
        Initial,
        Pressed,
        Moved,
        Released,
    };
})();

/**
 * Returns the mouse button pressed.
 *
 * Control + left button is treated as a right button on Mac.
 *
 * @return {number} The mouse button pressed.
 * @param {MouseEvent} The mouse event object.
 */
function getMouseButton(event) {
   const button = event.button;

    if (/^Mac/.test(navigator.platform)) {
        if (event.button == 0 && event.ctrlKey) {
            button = 2;
        }
    }

    return button;
}
