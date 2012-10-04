/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 *  Types for JSDoc
 */

"use strict";

var types = types || {};

/**
 * The type of the menu item variant.
 *
 * There is two variants: primary and secondary.
 *
 * The primary variant is used when alt is released;
 * the secondary variant is used otherwise.
 *
 * The "icon" property is a URL reference to an element within
 * the SVG document.
 * The "label" property is a label text.
 * The "action" property is a function invoked when the item is activated.
 * The "action" property is required for leaf items.
 * The optional "classes" property is an array of class names.
 *     Menu filters may refer the class names.
 * The optional "children" property is an array of child menu items.
 *
 * @typedef {{icon: string,
 *            label: string,
 *            action: ?function(PieMenu),
 *            classes: ?Array.<string>
 *            children: ?Array.<types.MenuItem>}}
 */
types.Variant = null;

/**
 * The type of the menu item.
 *
 * The menu item is an array of variants.
 *
 * @typedef {Array.<types.Variant>}
 */
types.MenuItem = null;

/**
 * The type of the states of the page when the menu is created.
 *
 * The "isFirst" property is true iff there is no previous pages in the history.
 * The "isLast" property is true iff there is no next pages in the history.
 * The "isLoading" property is true iff the page is loading.
 *
 * @typedef {{isFirst: boolean,
 *            isLast: boolean,
 *            isLoading: boolean}}
 */
types.PageState = null;

/**
 * The type of the menu filters,
 * that is the functions that tweak the menu items.
 *
 * Menu filters takes the target node, the state of tha page,
 * an original menu item, and the configurations and return a new menu item.
 *
 * The filters are called just before the menu item is rendered.
 *
 * The filters may return a null or an empty array to hide the menu item.
 *
 * Any filter should not modify original menu item objects.
 *
 * @typedef {function(Node,
 *                    types.PageState,
 *                    types.MenuItem,
 *                    Object.<string, *>):
 *               ?types.MenuItem}
 */
types.MenuFilter = null;
