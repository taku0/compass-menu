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

"use strict";

// FIXME What happens if CSS transforms are applied to
//       the body element and/or iframe element?

//// The menu class

/**
 * The menu.
 *
 * - Holds items
 * - Updates SVG DOM nodes
 * - Handles input, using the State pattern.
 *
 * The index of the menu item begins from 0 to 7.
 * The right item has the index 0.  The index increases clockwise.
 *
 * @constructor
 *
 * @param {Node} container An absolute-positioned node containing the menu.
 * @param {SVGLocatable} menuNode A SVG element represents menu.
 * @param {SVGLocatable} outer A SVG element represents
 *     the outer circle of the menu.
 * @param {SVGLocatable} hole A SVG element represents the hole of the menu.
 * @param {Array.<SVGStylable>} itemElements
 *     An array of SVG elements represents menu item.
 * @param {Array.<SVGStylable>} markerElements
 *     An array of SVG elements represents children indicator.
 * @param {Array.<function(string)>} textSetters
 *     An array of functions setting label text.
 *     Passing null to functions hides balloon.
 * @param {Object.<string, Array.<?types.MenuItem>>} context
 *     An map from context names to arrays of menu items.
 * @param {Array.<types.MenuFilter>} menuFilters
 *     An array of menu filters.
 * @param {Object.<string, *>} config A configuration.
 * @param {Object.<string, string>} localizedLabels
 *   An map from label keys to localized label strings.
 */
function PieMenu(container, menuNode, outer, hole,
                 itemElements, markerElements,
                 textSetters,
                 contexts, menuFilters, config,
                 localizedLabels) {
    if (!(this instanceof PieMenu)) {
        return new PieMenu();
    }

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
    this.localizedLabels = localizedLabels;

    this.variantIndex = 0;
    this.labelVisible = false;

    this.lastPoint = null;
    this.labelTimerID = null;

    var containerWindow = container.ownerDocument.defaultView;
    var menuWindow = menuNode.ownerDocument.defaultView;

    var windows;

    if (containerWindow === menuWindow) {
        windows = [containerWindow];
    } else {
        windows = [containerWindow, menuWindow];
    }

    function registerEventListener(win) {
        win.addEventListener("mousedown", this.onMouseDown.bind(this), true);
        win.addEventListener("mouseup", this.onMouseUp.bind(this), true);
        win.addEventListener("mousemove", this.onMouseMove.bind(this), true);
        win.addEventListener("scroll", this.onScroll.bind(this), true);
        win.addEventListener("keydown", this.onKeyDown.bind(this), true);
        win.addEventListener("keyup", this.onKeyUp.bind(this), true);
        win.addEventListener("contextmenu", this.onContextMenu.bind(this), true);
    }

    windows.forEach(registerEventListener, this);

    this.state = new PieMenu.states.Initial(this, config);

    return this;
}

/**
 * @return {SVGPoint} The center point of the menu, in the user coordinates.
 */
PieMenu.prototype.getCenter = function() {
    var box = this.outer.getBBox();

    var transform = this.outer.getTransformToElement(this.menuNode);

    var centerX = box.x + box.width / 2;
    var centerY = box.y + box.height / 2;

    return new Vector2D(centerX, centerY).applyTransform(transform);
};

/**
 * @return {SVGMatrix}
 *    The transforming matrix from the client coordinates
 *    (i.e. coordinates for MouseEvent#clientX) to user coordinates.
 */
PieMenu.prototype.getClientToUser = function() {
    return this.menuNode.getScreenCTM().inverse();
};

/**
 * @return {Vector2D}
 *   The client position of the mouse cursor in inner window coordinates.
 * @param {MouseEvent} event The mouse event.
 */
PieMenu.prototype.getClientPosition = function(event) {
    var containerWindow = this.container.ownerDocument.defaultView;
    var menuWindow = this.menuNode.ownerDocument.defaultView;

    var windowOffset;

    if (containerWindow === event.target.ownerDocument.defaultView) {
        var boundingClientRect = this.container.getBoundingClientRect();

        windowOffset =
            new Vector2D(-boundingClientRect.left, -boundingClientRect.top);
    } else {
        windowOffset = new Vector2D(0, 0);
    }

    return new Vector2D(event.clientX, event.clientY).plus(windowOffset);
};

/**
 * @return {SVGSVGElement} The owner "svg" element of the menu.
 */
PieMenu.prototype.getOwnerSVGElement = function() {
    var ownerSVGElement = this.menuNode.ownerSVGElement;

    return (ownerSVGElement === null) ? this.menuNode : ownerSVGElement;
};

/**
 * @param {number} x The translation amount in X.
 * @param {number} y The translation amount in Y.
 *
 * @return {SVGTransform} A SVGTransform that translates point.
 */
PieMenu.prototype.createTranslateTransform = function(x, y) {
    var transform = this.getOwnerSVGElement().createSVGTransform();

    transform.setTranslate(x, y);

    return transform;
};

/**
 * Moves the menu or open submenu, depending on the mouse cursor position.
 *
 * If the mouse cursor position is within menu, does nothing.
 * Otherwise, if the nearest menu item has submenu, opens it.
 * Otherwise, moves the menu.
 *
 * If the mouse cursor position is omitted, the last point is used.
 *
 * @param {{x: number, y: number}=} point The mouse cursor position,
 *     in the user coordinates.
 */
PieMenu.prototype.follow = function(point) {
    if (arguments.length == 0) {
        point = this.lastPoint;
    } else {
        this.lastPoint = point;
    }

    var center = this.getCenter();
    var distanceSq = center.distanceSquared(point);

    if (distanceSq > this.radius * this.radius) {
        var index = this.getItemIndex(point, center);

        if (this.hasChildren(index)) {
            this.openAt(point, this.getChildrenAt(index));
        } else {
            this.doFollow(point, center);
        }
    }
};

/**
 * Moves the menu.
 *
 * @param {{x: number, y: number}} point The mouse cursor position,
 *     in the user coordinates.
 * @param {{x: number, y: number}} center The center position,
 *     in the user coordinates.
 * @protected
 */
PieMenu.prototype.doFollow = function(point, center) {
    var diff = point.diff(center);

    var movement = diff.normalize().scale(diff.norm() - this.radius);

    this.moveBy(movement);

    this.hideLabelTexts();
};

/**
 * Moves the menu by the given offset.
 *
 * @param {{x: number, y: number}} movement The amount of the movement,
 *     in the user coordinates.
 */
PieMenu.prototype.moveBy = function(movement) {
    if (this.container.transform) {
        var translate = this.createTranslateTransform(movement.x, movement.y);
        var currentTransform = this.container.transform.baseVal;

        currentTransform.appendItem(translate, 0);
        currentTransform.consolidate();
    } else {
        var clientPosition =
            new Vector2D(this.container.offsetLeft, this.container.offsetTop);

        var clientMovement =
            movement.applyTransform(this.getClientToUser().inverse());

        var newPosition = clientPosition.plus(clientMovement);

        this.container.style.left = newPosition.x + "px";
        this.container.style.top = newPosition.y + "px";
    }
};

/**
 * @return {number} The index of the nearest menu item to
 *     the mouse cursor position.
 *
 * @param {{x: number, y: number}} point The mouse cursor position,
 *     in the user coordinates.
 * @param {{x: number, y: number}=} center The center point of the menu,
 *     in the user coordinates.
 */
PieMenu.prototype.getItemIndex = function(point, center) {
    if (!center) {
        center = this.getCenter();
    }

    var TwoPI = 2 * Math.PI;

    var diff = point.diff(center);

    var theta = Math.atan2(diff.y, diff.x);

    if (theta < 0) {
        theta += TwoPI;
    }

    if (15 / 16.0 * TwoPI < theta || theta <=  1 / 16.0 * TwoPI) {
        return 0;
    } else {
        return Math.floor((theta + 1 / 16.0 * TwoPI) * 8 / TwoPI);
    }
};

/**
 * Returns the current menu item variant.
 *
 * If the current variant is a secondary variant and the secondary variant is
 * not defined, the primary variant is returnd.
 *
 * @return {types.Variant} The current menu item variant.
 * @param {number} index The index of the menu item.
 */
PieMenu.prototype.getVariant = function(index) {
    var item = this.items[index];

    if (item) {
        var variant = item[this.variantIndex];

        if (variant) {
            return variant;
        } else {
            return item[0];
        }
    } else {
        return item;
    }
};

/**
 * @return {boolean} true iff the menu item at given index has submenus.
 *
 * @param {number} index The index of the menu item.
 */
PieMenu.prototype.hasChildren = function(index) {
    var variant = this.getVariant(index);

    return variant && variant.children && variant.children.length > 0;
};

/**
 * @return {types.MenuItem} The submenu items at given index.
 *
 * @param {number} index The index of the menu item.
 */
PieMenu.prototype.getChildrenAt = function(index) {
    return this.getVariant(index).children;
};

/**
 * Opens the menu at given position.
 *
 * If items, target, or pageState are specified,
 * this method updates the menu.
 *
 * @param {{x: number, y: number}} center The new position of the center.
 * @param {Array.<?type.MenuItem>=} items The new menu items.
 * @param {Node=} target The node on which the user pressed the mouse button.
 * @param {type.PageState=} pageState The state of the page.
 */
PieMenu.prototype.openAt = function(center, items, target, pageState) {
    this.container.style.display = "inline";

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
        var config = this.config;

        var modifyItems = function(menuFilter) {
            var modifyItem = function(item) {
                return menuFilter(target, pageState, item, config);
            };

            items = items.map(modifyItem);
        };

        this.menuFilters.forEach(modifyItems);

        this.items = items;
    }

    var oldCenter = this.getCenter();

    this.moveBy(center.diff(oldCenter));

    this.updateIcons();

    this.hideLabelTexts();
    this.resetLabelTimer();
};

/**
 * Updates icons.
 */
PieMenu.prototype.updateIcons = function() {
    for (var i = 0; i < 8; i++) {
        var variant = this.getVariant(i);

        if (variant) {
            var itemElement = this.itemElements[i];

            itemElement.style.display = "inline";
            itemElement.setAttributeNS("http://www.w3.org/1999/xlink",
                                       "href",
                                       variant.icon);

            var hasChildren = variant.children && variant.children.length > 0;

            this.markerElements[i].style.display =
                hasChildren ? "inline" : "none";
        } else {
            this.itemElements[i].style.display = "none";
            this.markerElements[i].style.display = "none";
        }
    }
};

/**
 * Resets timer showing label texts.
 */
PieMenu.prototype.resetLabelTimer = function() {
    this.clearLabelTimer();

    this.labelTimerID =
        setTimeout(this.updateLabelTexts.bind(this), this.config.labelDelay);
};

/**
 * Clears timer showing label texts.
 */
PieMenu.prototype.clearLabelTimer = function() {
    if (this.labelTimerID) {
        clearTimeout(this.labelTimerID);
    }
};

/**
 * Hides label texts.
 */
PieMenu.prototype.hideLabelTexts = function() {
    for (let textSetter of this.textSetters) {
        textSetter(null);
    }
    this.labelVisible = false;
    this.clearLabelTimer();
};

/**
 * Updates label texts if the labels are visible..
 */
PieMenu.prototype.updateLabelTextsIfVisible = function() {
    if (this.labelVisible) {
        this.updateLabelTexts();
    } else {
        this.hideLabelTexts();
        this.resetLabelTimer();
    }
}

/**
 * Updates label texts.
 */
PieMenu.prototype.updateLabelTexts = function() {
    for (var i = 0; i < 8; i++) {
        var variant = this.getVariant(i);

        var textSetter = this.textSetters[i];

        if (variant) {
            var localizedLabel = this.localizedLabels[variant.label];

            if (!localizedLabel) {
                localizedLabel = variant.label;
            }

            textSetter(localizedLabel);
        } else {
            textSetter(null);
        }
    }
    this.labelVisible = true;
};

/**
 * Activates the nearest menu item to the mouse cursor.
 *
 * Does nothing if the nearest menu item is empty.
 *
 * @param {{x: number, y: number}} point the mouse cursor position.
 */
PieMenu.prototype.activateItemAt = function(point) {
    var center = this.getCenter();
    var distanceSq = center.distanceSquared(point);

    if (distanceSq > this.holeRadius * this.holeRadius) {
        var index = this.getItemIndex(point);
        var variant = this.getVariant(index);

        if (variant && variant.action) {
            // Since some commands assume the current frame is the frame
            // containing the target node.
            this.target.ownerDocument.defaultView.focus();
            variant.action(this);
        }
    }
};

/**
 * Hides the menu.
 */
PieMenu.prototype.hide = function() {
    this.container.style.display = "none";
    this.hideLabelTexts();
};

/**
 * Sets variants.
 *
 * @param {number} variantIndex The new variant index.
 */
PieMenu.prototype.setVariant = function(variantIndex) {
    this.variantIndex = variantIndex;
    this.updateIcons();
    this.updateLabelTextsIfVisible();
};

/**
 * Sets a configuration.
 *
 * @param {Object.<string, *>} config A configuration.
 */
PieMenu.prototype.setConfig = function(config) {
    this.config = config;
    this.state.config = config;
};

/**
 * Handles mousedown events
 *
 * @param {MouseEvent} event The mouse event object.
 */
PieMenu.prototype.onMouseDown = function(event) {
    if (this.state.onMouseDown) {
        this.state.onMouseDown(event);
    }
};

/**
 * Handles mouserelease events
 *
 * @param {MouseEvent} event The mouse event object.
 */
PieMenu.prototype.onMouseUp = function(event) {
    if (this.state.onMouseUp) {
        this.state.onMouseUp(event);
    }
};

/**
 * Handles mousemove events
 *
 * @param {MouseEvent} event The mouse event object.
 */
PieMenu.prototype.onMouseMove = function(event) {
    if (this.state.onMouseMove) {
        this.state.onMouseMove(event);
    }
};

/**
 * Handles scroll events
 *
 * @param {Event} event The event object.
 */
PieMenu.prototype.onScroll = function(event) {
    if (this.state.onScroll) {
        this.state.onScroll(event);
    }
};

/**
 * Handles keydown events
 *
 * @param {KeyboardEvent} event The keyboard event object.
 */
PieMenu.prototype.onKeyDown = function(event) {
    if (this.state.onKeyDown) {
        this.state.onKeyDown(event);
    }
};

/**
 * Handles keyup events
 *
 * @param {KeyboardEvent} event The keyboard event object.
 */
PieMenu.prototype.onKeyUp = function(event) {
    if (this.state.onKeyUp) {
        this.state.onKeyUp(event);
    }
};

/**
 * Handles contextmenu events
 *
 * @param {KeyboardEvent} event The keyboard event object.
 */
PieMenu.prototype.onContextMenu = function(event) {
    if (this.state.onContextMenu) {
        this.state.onContextMenu(event);
    }
};

//// State classes for the State patterns

/**
 * State classes
 */
PieMenu.states = {
    /**
     * The common super class for states showing the menu.
     *
     * @constructor
     */
    ShowingState: function() {
    },

    /**
     * The initial state. The menu is hidden
     *
     * @constructor
     * @param {PieMenu} menu The menu.
     * @param {Object} config The configurations.
     */
    Initial: function(menu, config) {
        this.menu = menu;
        this.config = config;

        this.menu.setVariant(0);

        this.menu.hide();
    },

    /**
     * The state the user holding right button without moving the mouse.
     *
     * @constructor
     * @param {PieMenu} menu The menu.
     * @param {Object} config The configurations.
     */
    Pressed: function(menu, config) {
        this.menu = menu;
        this.config = config;
    },

    /**
     * The state the user holding right button after moving the mouse.
     *
     * Releasing the button activates a menu item.
     *
     * @constructor
     * @param {PieMenu} menu The menu.
     * @param {Object} config The configurations.
     * @param {number=} startingButton The button activated this state.
     *     The config.openButton is used if omitted.
     */
    Moved: function(menu, config, startingButton) {
        if (startingButton === undefined) {
            startingButton = config.openButton;
        }

        this.menu = menu;
        this.config = config;
        this.startingButton = startingButton;
    },

    /**
     * The state the user released right button without moving the mouse.
     *
     * Pressing and releasing the button activates a menu item.
     *
     * @constructor
     * @param {PieMenu} menu The menu.
     * @param {Object} config The configurations.
     */
    Released: function(menu, config) {
        this.menu = menu;
        this.config = config;
    }
};

PieMenu.states.Pressed.prototype = new PieMenu.states.ShowingState();
PieMenu.states.Moved.prototype = new PieMenu.states.ShowingState();
PieMenu.states.Released.prototype = new PieMenu.states.ShowingState();

/// State methods

/**
 * Handles mousemove events.
 *
 * Moves the menu or opens submenu.
 *
 * @param {MouseEvent} The mouse event object.
 */
PieMenu.states.ShowingState.prototype.onMouseMove = function(event) {
    var clientToUser = this.menu.getClientToUser();
    var point = this.menu.getClientPosition(event).applyTransform(clientToUser);

    this.menu.follow(point);
    this.menu.resetLabelTimer();
};

/**
 * Handles mousedown events.
 *
 * Selects the secondary variant.
 *
 * @param {MouseEvent} The mouse event object.
 */
PieMenu.states.ShowingState.prototype.onMouseDown = function(event) {
    this.menu.setVariant(1);
    event.preventDefault();
    event.stopPropagation();
};

/**
 * Handles mouseup events.
 *
 * Selects the primary variant.
 *
 * @param {MouseEvent} The mouse event object.
 */
PieMenu.states.ShowingState.prototype.onMouseUp = function(event) {
    this.menu.setVariant(0);
    event.preventDefault();
    event.stopPropagation();
};

/**
 * Handles context events.
 *
 * Prevents the default.
 *
 * @param {Event} The event object.
 */
PieMenu.states.ShowingState.prototype.onContextMenu = function(event) {
    event.preventDefault();
    event.stopPropagation();
};

/**
 * Handles keydown events.
 *
 * Selects the secondary variants if the alt key is pressed.
 *
 * @param {KeyboardEvent} The keyboard event object.
 */
PieMenu.states.ShowingState.prototype.onKeyDown = function(event) {
    if (event.altKey) {
        this.menu.setVariant(1);
        event.preventDefault();
        event.stopPropagation();
    }

    var isESCPressed;

    if ('key' in event) {
        isESCPressed = (event.key === "Esc");
    } else {
        isESCPressed = (event.keyCode === event.DOM_VK_ESCAPE);
    }

    if (isESCPressed) {
        this.menu.state = new PieMenu.states.Initial(this.menu, this.config);
    }
};

/**
 * Handles keyup events.
 *
 * Selects the primary variants if the alt key is released.
 *
 * @param {KeyboardEvent} The keyboard event object.
 */
PieMenu.states.ShowingState.prototype.onKeyUp = function(event) {
    if (!event.altKey) {
        this.menu.setVariant(0);
        event.preventDefault();
        event.stopPropagation();
    }
};

/**
 * Handles scroll events.
 *
 * Moves the menu or opens submenu.
 *
 * @param {MouseEvent} The mouse event object.
 */
PieMenu.states.ShowingState.prototype.onScroll = function(event) {
    menu.follow();
};

//// Initial state methods

/**
 * Handles context events.
 *
 * Prevents the default if opens the menu.
 *
 * @param {Event} The event object.
 */
PieMenu.states.Initial.prototype.onContextMenu = function(event) {
    if (this.isOpenButton(event) && !this.isSupressed(event)) {
        event.preventDefault();
        event.stopPropagation();
    }
};

/**
 * Handles mousedown events.
 *
 * If the correct button and modifiers is pressed, opens the menu and
 * transits to the Pressed state.
 *
 * @param {MouseEvent} The mouse event object.
 */
PieMenu.states.Initial.prototype.onMouseDown = function(event) {
    if (this.isOpenButton(event) && !this.isSupressed(event)) {
        var menu = this.menu;
        var config = this.config;

        var openMenu = function(pageState) {
            menu.container.style.display = 'inline';

            var clientPosition = menu.getClientPosition(event);
            var point = clientPosition.applyTransform(menu.getClientToUser());
            var context = detectContext(event.target);

            menu.container.style.display = 'inline';
            menu.openAt(point, menu.contexts[context], event.target, pageState);
        };

        queryPageState(openMenu);

        menu.state = new PieMenu.states.Pressed(menu, config);

        event.preventDefault();
        event.stopPropagation();
    }
};

/**
 * Returns the mouse button pressed.
 *
 * Control + left button is treated as a right button on Mac.
 *
 * @return {number} The mouse button pressed.
 * @param {MouseEvent} The mouse event object.
 */
function getMouseButton(event) {
   var button = event.button;

    if (/^Mac/.test(navigator.platform)) {
        if (event.button == 0 && event.ctrlKey) {
            button = 2;
        }
    }

    return button;
}

/**
 * @return {boolean}
 *     true iff the right button and required modifiers is pressed.
 * @param {MouseEvent} The mouse event object.
 * @protected
 */
PieMenu.states.Initial.prototype.isOpenButton = function(event) {
    var button = getMouseButton(event);

    var isOpenButton = this.config.openButton == button;

    var ctrlGuard = !this.config.requireCtrl || event.ctrlKey;
    var shiftGuard = !this.config.requireShift || event.shiftKey;

    return isOpenButton && ctrlGuard && shiftGuard;
};

/**
 * @return {boolean}
 *     true if supressing modifiers is pressed.
 * @param {MouseEvent} The mouse event object.
 * @protected
 */
PieMenu.states.Initial.prototype.isSupressed = function(event) {
    var supressedByCtrl =
        this.config.isCtrlSupress && event.ctrlKey;

    var supressedByShift =
        this.config.isShiftSupress && event.shiftKey;

    if (this.config.isCtrlSupress && this.config.isShiftSupress) {
        return supressedByCtrl && supressedByShift;
    } else {
        return supressedByCtrl || supressedByShift;
    }
};

//// Pressed state methods

/**
 * Handles mousemove events.
 *
 * Transits to the Moved state
 *
 * @param {MouseEvent} The mouse event object.
 */
PieMenu.states.Pressed.prototype.onMouseMove = function(event) {
    this.menu.state = new PieMenu.states.Moved(this.menu, this.config);

    PieMenu.states.ShowingState.prototype.onMouseMove.call(this, event);
};

/**
 * Handles scroll events.
 *
 * Transits to the Moved state
 *
 * @param {MouseEvent} The mouse event object.
 */
PieMenu.states.Pressed.prototype.onScroll = function(event) {
    this.menu.state = new PieMenu.states.Moved(this.menu, this.config);

    PieMenu.states.ShowingState.prototype.onMouseMove.call(this, event);
};

/**
 * Handles mouseup events.
 *
 * Transits to the Released state if the button opened the menu is released.
 *
 * @param {MouseEvent} The mouse event object.
 */
PieMenu.states.Pressed.prototype.onMouseUp = function(event) {
    if (getMouseButton(event) == this.config.openButton) {
        this.menu.state = new PieMenu.states.Released(this.menu, this.config);
        event.preventDefault();
        event.stopPropagation();
    } else {
        PieMenu.states.ShowingState.prototype.onMouseUp.call(this, event);
    }
};

//// Moved state methods

/**
 * Handles mouseup events.
 *
 * Activates the menu item and returns to Initial state.
 *
 * @param {MouseEvent} The mouse event object.
 */
PieMenu.states.Moved.prototype.onMouseUp = function(event) {
    if (getMouseButton(event) == this.startingButton) {
        var clientToUser = this.menu.getClientToUser();
        var point =
            this.menu.getClientPosition(event).applyTransform(clientToUser);

        this.menu.activateItemAt(point);
        this.menu.state = new PieMenu.states.Initial(this.menu, this.config);
        event.preventDefault();
        event.stopPropagation();
    } else {
        PieMenu.states.ShowingState.prototype.onMouseUp.call(this, event);
    }
};

//// Released state methods

/**
 * Handles mousedown events.
 *
 * Transits to the Moved state.
 *
 * @param {MouseEvent} The mouse event object.
 */
PieMenu.states.Released.prototype.onMouseDown = function(event) {
    var button = getMouseButton(event);

    this.menu.state = new PieMenu.states.Moved(this.menu, this.config, button);
    event.preventDefault();
    event.stopPropagation();
};
