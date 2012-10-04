/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * The menu definition.
 * 
 * There are several menus, one for each contexts.
 * Each menu is an array of menu item while a menu item is 
 * an array of variants.
 * Variants are primary variant and secondary variant.
 * Pressing alt select secondary variant.
 * See also types.Variant for detail.
 * 
 * Null menu item represents empty item.
 * 
 * The menu items are filtered by menu filters.
 * Menu filters tweak the menu item; it hides the disabled menu or 
 * replace menu items depend on page state.
 */

"use strict";

var pageMenu = {
    icon: "#page",
    label: "page",
    children: [
        [
            {
                icon: "#bookmark",
                label: "bookmark",
                action: function() {requestCommand("Browser:AddBookmarkAs");}
            }
        ],
        null,
        [
            {
                icon: "#save",
                label: "save_page",
                action: function() {requestCommand("Browser:SavePage");}

            }
        ],
        null,
        [
            {
                icon: "#source",
                label: "view_page_source",
                action: function() {requestCommand("View:PageSource");}
            }
        ],
        null,
        [
            {
                icon: "#info",
                label: "view_page_info",
                action: function() {requestCommand("View:PageInfo");}
            }
        ],
        null
    ]
};

var windowMenu = {
    icon: "#window",
    label: "window",
    children: [
        [
            {
                icon: "#forward",
                label: "view_next_window",
                action: function() {requestActivateWindowRelative(1);}
            }
        ],
        null,
        [
            {
                icon: "#stop",
                label: "close_window",
                action: function() {requestCommand("cmd_closeWindow");}
            },
            {
                icon: "#undo",
                label: "undo_close_window",
                action: function() {requestCommand("History:UndoCloseWindow");}
            }
        ],
        null,
        [
            {
                icon: "#back",
                label: "view_previous_window",
                action: function() {requestActivateWindowRelative(-1);}
            }
        ],
        null,
        [
            {
                icon: "#new",
                label: "open_new_window",
                action: function() {requestCommand("cmd_newNavigator");}
            },
            {
                icon: "#new",
                label: "duplicate_window",
                action: function() {requestDuplicateWindow();}
            }
        ],
        null
    ]
};

var tabMenu = {
    icon: "#tab",
    label: "tab",
    children: [
        [
            {
                icon: "#forward",
                label: "view_next_tab",
                action: function() {requestCommand("Browser:NextTab");}
            }
        ],
        null,
        [
            {
                icon: "#stop",
                label: "close_tab",
                action: function() {requestCommand("cmd_close");}
            },
            {
                icon: "#undo",
                label: "undo_close_tab",
                action: function() {requestCommand("History:UndoCloseTab");}
            }
        ],
        null,
        [
            {
                icon: "#back",
                label: "view_previous_tab",
                action: function() {requestCommand("Browser:PrevTab");}
            }
        ],
        null,
        [
            {
                icon: "#new",
                label: "open_new_tab",
                action: function() {requestCommand("cmd_newNavigatorTab");}
            },
            {
                icon: "#new",
                label: "duplicate_tab",
                action: function() {requestDuplicateTab();}
            }
        ],
        null
    ]
};

var navigationMenu = {
    icon: "#navigation",
    label: "navigation",
    children: [
        [
            {
                icon: "#forward",
                label: "forward",
                classes: ["forward"],
                action: function() {history.forward();}
            },
            {
                icon: "#last",
                label: "go_to_last",
                classes: ["forward"],
                action: function() {requestGoToLast();}
            }
        ],
        [
            pageMenu
        ],
        [
            // see chooseReloadOrStop
            {
                icon: "#reload",
                label: "reload",
                classes: ["reload"],
                action: function() {requestCommand("Browser:Reload");}
            },
            {
                icon: "#reload",
                label: "reload_without_cache",
                classes: ["reload"],
                action: function() {requestCommand("Browser:ReloadSkipCache");}
            },
            {
                icon: "#stop",
                label: "stop",
                classes: ["stop"],
                action: function() {requestCommand("Browser:Stop");}
            }
        ],
        null, // developer menu?
        [
            {
                icon: "#back",
                label: "back",
                classes: ["back"],
                action: function() {history.back();}
            },
            {
                icon: "#first",
                label: "go_to_first",
                classes: ["back"],
                action: function() {requestGoToFirst();}
            }
        ],
        [
            windowMenu
        ],
        [
            {
                icon: "#up",
                label: "up",
                classes: ["up"],
                action: function() {requestGoUp();}
            },
            {
                icon: "#open_location",
                label: "open_location",
                action: function() {requestCommand("Browser:OpenLocation");}
            }
        ],
        [
            tabMenu
        ]
    ]
};

var navigationSubMenu = {
    icon: navigationMenu.icon,
    label: navigationMenu.label,
    children: [
        navigationMenu.children[0],
        null,
        navigationMenu.children[2],
        null,
        navigationMenu.children[4],
        null,
        navigationMenu.children[6]
    ]
};

var selectionMenu = {
    icon: "#selection",
    label: "selection",
    children: [
        [
            {
                icon: "#open_link",
                label: "open_selection",
                action: function() {
                    var selection = window.getSelection();

                    requestOpenURLInCurrentTab(selection.toString());
                }
            },
            {
                icon: "#open_link",
                label: "open_selection_in_new_tab",
                action: function() {
                    var selection = window.getSelection();

                    requestOpenURLInNewTab(selection.toString());
                }
            }
        ],
        [
            pageMenu
        ],
        null, // translate menu?
        [
            navigationSubMenu
        ],
        [
            {
                icon: "#search",
                label: "search_the_web",
                action: function() {
                    var selection = window.getSelection();

                    requestSearchWeb(selection.toString(), false);
                }
            },
            {
                icon: "#search",
                label: "search_the_web_in_new_tab",
                action: function() {
                    var selection = window.getSelection();

                    requestSearchWeb(selection.toString(), true);
                }
            }
        ],
        [
            windowMenu
        ],
        [
            {
                icon: "#copy",
                label: "copy_selection",
                action: function() {requestCommand("cmd_copy");}
            }
        ],
        [
            tabMenu
        ]
    ]
};

var imageMenu = {
    icon: "#page",
    label: "image",
    children: [
        [
            {
                icon: "#open_link",
                label: "view_image",
                action: function(menu) {
                    var url = menu.target.src;

                    requestOpenURLInCurrentTab(url);
                }
            },
            {
                icon: "#open_link",
                label: "view_image_in_new_tab",
                action: function(menu) {
                    var url = menu.target.src;

                    requestOpenURLInNewTab(url);
                }
            }
        ],
        [
            pageMenu
        ],
        [
            {
                icon: "#save",
                label: "save_image",
                action: function(menu) {
                    var url = menu.target.src;

                    requestSaveImageURL(url, location.toString());
                }
            }
        ],
        [
            navigationSubMenu
        ],
        null, // block image?
        [
            windowMenu
        ],
        [
            {
                icon: "#copy",
                label: "copy_image_location",
                action: function(menu) {
                    var url = menu.target.src;

                    requestCopyText(url);
                }
            }
            // copy image?
        ],
        [
            tabMenu
        ]
    ]
};

var imageSubMenu = {
    icon: imageMenu.icon,
    label: imageMenu.label,
    children: [
        imageMenu.children[0],
        null,
        imageMenu.children[2],
        null,
        imageMenu.children[4],
        [
            pageMenu
        ],
        imageMenu.children[6],
        null
    ]
};

var linkMenu = {
    icon: "#link",
    label: "link",
    children: [
        [
            {
                icon: "#open_link",
                label: "open_link_in_new_tab",
                action: function(menu) {
                    var url = extractLinkURL(menu.target);

                    requestOpenURLInNewTab(url);
                }
            }
        ],
        [
            pageMenu
        ],
        [
            {
                icon: "#save",
                label: "save_link",
                action: function(menu) {
                    var url = extractLinkURL(menu.target);

                    requestSaveURL(url);
                }
            }
        ],
        [
            navigationSubMenu
        ],
        [
            {
                icon: "#open_link",
                label: "open_link_in_new_window",
                action: function(menu) {
                    var url = extractLinkURL(menu.target);

                    requestOpenURLInNewWindow(url);
                }
            }
        ],
        [
            windowMenu
        ],
        [
            {
                icon: "#copy",
                label: "copy_location",
                action: function(menu) {
                    var url = extractLinkURL(menu.target);

                    requestCopyText(url);
                }
            }
        ],
        [
            tabMenu
        ]
    ]
};

var imageLinkMenu = {
    icon: linkMenu.icon,
    label: linkMenu.label,
    children: [
        linkMenu.children[0],
        [
            imageSubMenu
        ],
        linkMenu.children[2],
        linkMenu.children[3],
        linkMenu.children[4],
        linkMenu.children[5],
        linkMenu.children[6],
        linkMenu.children[7]
    ]
};

// TODO save, play, pause, mute, show media controls, copy location
var audioMenu = navigationMenu;

// TODO save, play, pause, mute, show media controls, copy location, fullscreen, view
var videoMenu = navigationMenu;

var textMenu = {
    icon: "#text",
    label: "text",
    children: [
        [
            {
                icon: "#copy",
                label: "copy_text",
                action: function() {requestCommand("cmd_copy");}
            }
        ],
        [
            pageMenu
        ],
        [
            {
                icon: "#paste",
                label: "paste_text",
                action: function() {requestCommand("cmd_paste");}
            }
        ],
        [
            navigationSubMenu
        ],
        [
            {
                icon: "#cut",
                label: "cut_text",
                action: function() {requestCommand("cmd_cut");}
            }
        ],
        [
            windowMenu
        ],
        [
            {
                icon: "#undo",
                label: "undo_text",
                action: function() {requestCommand("cmd_undo");}
            },
            {
                icon: "#redo",
                label: "redo_text",
                action: function() {requestCommand("cmd_redo");}
            }
        ],
        [
            tabMenu
        ]
    ]
};

var frameMenu = {
    icon: "#frame",
    label: "frame",
    children: [
        [
            {
                icon: "#open_link",
                label: "view_frame",
                action: function() {
                    requestOpenURLInCurrentTab(location.toString());
                }
            },
            {
                icon: "#open_link",
                label: "view_frame_in_new_tab",
                action: function() {
                    requestOpenURLInNewTab(location.toString());
                }
            }
        ],
        [
            {
                icon: "#reload",
                label: "reload_frame",
                action: function() {location.reload();}
            },
            {
                icon: "#reload",
                label: "reload_frame_without_cache",
                action: function() {location.reload(true);}
            }
        ],
        [
            {
                icon: "#save",
                label: "save_frame",
                action: function() {
                    requestSaveURL(location.toString());
                }
            }
        ],
        null,
        [
            {
                icon: "#source",
                label: "view_frame_source",
                action: function() {
                    requestShowFrameSource();
                }
            }
        ],
        [
            pageMenu
        ],
        [
            {
                icon: "#info",
                label: "view_frame_info",
                action: function() {
                    requestShowFrameInfo();
                }
            }
        ],
        null
    ]
};

var frameNavigationMenu = {
    icon: navigationMenu.icon,
    label: navigationMenu.label,
    children: [
        navigationMenu.children[0],
        [
            frameMenu
        ],
        navigationMenu.children[2],
        navigationMenu.children[3],
        navigationMenu.children[4],
        navigationMenu.children[5],
        navigationMenu.children[6],
        navigationMenu.children[7]
    ]
};

var contexts = {
    page: navigationMenu.children,
    selection: selectionMenu.children,
    image: imageMenu.children,
    imageLink: imageLinkMenu.children,
    link: linkMenu.children,
    audio: audioMenu.children,
    video: videoMenu.children,
    text: textMenu.children,
    frame: frameNavigationMenu.children
};

/**
 * Evaluates an XPath expression and Returns the result.
 *
 * If a number, string, or boolean result type is specified,
 * the result is converted to a JavaScript primitive value.
 *
 * If the FIRST_ORDERED_NODE_TYPE is specified as a result type,
 * the result is the single node value.
 *
 * @param {string} xpath An XPath expression.
 * @param {Node} node The context node for the query.
 * @param {number=} resultType A constant values indicating result type
 *     defined at XPathResult.
 * @return {*} Result of the XPath expression.
 */
function evaluateXPath(xpath, node, resultType) {
    var document = node.ownerDocument || node;
    var documentElement = document.documentElement;
    var namespaceResolver =
        document.createNSResolver(documentElement);

    resultType = resultType || XPathResult.ANY_TYPE;

    var result =  document.evaluate(xpath,
                                    node,
                                    namespaceResolver,
                                    resultType,
                                    null);

    switch (resultType) {
    case XPathResult.NUMBER_TYPE:
        return result.numberValue;
    case XPathResult.STRING_TYPE:
        return result.stringValue;
    case XPathResult.BOOLEAN_TYPE:
        return result.booleanValue;
    case XPathResult.FIRST_ORDERED_NODE_TYPE:
        return result.singleNodeValue;
    default:
        return result;
    }
}

/**
 * @return {string} The link target URL of the node.
 *
 * @param {Node} node A descendant node of anchor nodes.
 */
function extractLinkURL(node) {
    var anchorNode =
        evaluateXPath("(ancestor-or-self::a | ancestor-or-self::area)[@href]",
                      node,
                      XPathResult.FIRST_ORDERED_NODE_TYPE);

    // The href property returns always a valid (i.e. not a relative) URL.
    return anchorNode.href;
}

/**
 * Requests the add-on to execute a XUL command (e.g. cmd_copy, Browser:Reload).
 *
 * The function is asynchronous.
 *
 * @param {string} commandName The name of the command to be executed.
 */
function requestCommand(commandName) {
    self.port.emit("requestCommand", commandName);
}

/**
 * Requests the add-on to activate another window.
 *
 * The function is asynchronous.
 *
 * @param {number} offset A relative index of the window to be activated.
 *     The index of the current window is 0.
 */
function requestActivateWindowRelative(offset) {
    self.port.emit("requestActivateWindowRelative", offset);
}

/**
 * Requests the add-on to open a URL in the current tab.
 *
 * Note that if the page is in a frame,
 * location = url only change the location of the frame.
 *
 * The function is asynchronous.
 *
 * @param {string} url a URL to be opened.
 */
function requestOpenURLInCurrentTab(url) {
    self.port.emit("requestOpenURLInCurrentTab", url);
}

/**
 * Requests the add-on to open a URL in a new window.
 *
 * The function is asynchronous.
 *
 * @param {string} url a URL to be opened.
 */
function requestOpenURLInNewWindow(url) {
    self.port.emit("requestOpenURLInNewWindow", url);
}

/**
 * Requests the add-on to open a URL in a new tab.
 *
 * The function is asynchronous.
 *
 * @param {string} url a URL to be opened.
 */
function requestOpenURLInNewTab(url) {
    self.port.emit("requestOpenURLInNewTab", url);
}

/**
 * Requests the add-on to duplicate the current window.
 *
 * The function is asynchronous.
 */
function requestDuplicateWindow() {
    self.port.emit("requestDuplicateWindow");
}

/**
 * Requests the add-on to duplicate the current tab.
 *
 * The function is asynchronous.
 */
function requestDuplicateTab() {
    self.port.emit("requestDuplicateTab");
}

/**
 * Requests the add-on to go to the first page in the history.
 *
 * The function is asynchronous.
 */
function requestGoToFirst() {
    self.port.emit("requestGoToFirst");
}

/**
 * Requests the add-on to go to the last page in the history.
 *
 * The function is asynchronous.
 */
function requestGoToLast() {
    self.port.emit("requestGoToLast");
}

/**
 * Requests the add-on to search the web.
 *
 * The function is asynchronous.
 *
 * @param {string} searchText A string to search.
 * @param {boolean} useNewTab If true, search in a new tab.
 */
function requestSearchWeb(searchText, useNewTab) {
    self.port.emit("requestSearchWeb", searchText, useNewTab);
}

/**
 * Requests the add-on to go up path hierarchy.
 *
 * The function is asynchronous.
 */
function requestGoUp() {
    self.port.emit("requestGoUp");
}

/**
 * Requests the add-on to save a URL.
 *
 * The function is asynchronous.
 *
 * @param {string} url A URL to be saved.
 * @param {string} referrer A URL of the referrer.
 */
function requestSaveURL(url, referrer) {
    self.port.emit("requestSaveURL", url, referrer);
}

/**
 * Requests the add-on to save an image URL.
 *
 * The function is asynchronous.
 *
 * @param {string} url A URL to be saved.
 * @param {string} referrer A URL of the referrer.
 */
function requestSaveImageURL(url, referrer) {
    self.port.emit("requestSaveImageURL", url, referrer);
}

/**
 * Requests the add-on to copy text.
 *
 * The function is asynchronous.
 *
 * @param {string} text A string to be copied
 */
function requestCopyText(text) {
    self.port.emit("requestCopyText", text);
}

/**
 * Requests the add-on to show the frame source.
 *
 * The function is asynchronous.
 */
function requestShowFrameSource() {
    self.port.emit("requestShowFrameSource");
}

/**
 * Requests the add-on to show the frame information.
 *
 * The function is asynchronous.
 */
function requestShowFrameInfo() {
    self.port.emit("requestShowFrameInfo");
}

/**
 * @return {boolean} true if the variant has the given class name.
 * @param {types.Variant} variant The variant to be tested.
 * @param {string} className The class name to be tested.
 */
function isMenuClassOf(variant, className) {
    return variant &&
        variant.classes &&
        variant.classes.indexOf(className) > -1;
}

/**
 * @return {types.MenuItem} A new menu item excluding variants
 *     that has the given class name.
 * @param {types.MenuItem} menuItem The origianl menu item.
 * @param {string} className The class name.
 */
function hideIfClassOf(menuItem, className) {
    if (!menuItem) {
        return menuItem;
    }

    function isNotClassOf(variant) {
        return !isMenuClassOf(variant, className);
    }

    return menuItem.filter(isNotClassOf);
}

/**
 * Returns an empty array if the menu item is a back menu and
 * there is no previous history.
 *
 * @param {Node} target The target node.
 * @param {types.PageState} pageState The state of the page.
 * @param {types.MenuItem} menuItem The original menu item.
 * @param {Object.<string, *>} config An configurations.
 * @return {types.MenuItem} The new menu item.
 */
// FIXME graying out instead of removing?
function hideBackIfFirst(target, pageState, menuItem, config) {
    if (pageState.isFirst) {
        return hideIfClassOf(menuItem, "back");
    } else {
        return menuItem;
    }
}

/**
 * Returns an empty array if the menu item is a forward menu and
 * there is no next history.
 *
 * @param {Node} target The target node.
 * @param {types.PageState} pageState The state of the page.
 * @param {types.MenuItem} menuItem The original menu item.
 * @param {Object.<string, *>} config An configurations.
 * @return {types.MenuItem} The new menu item.
 */
// FIXME graying out instead of removing?
function hideForwardIfLast(target, pageState, menuItem, config) {
    if (pageState.isLast) {
        return hideIfClassOf(menuItem, "forward");
    } else {
        return menuItem;
    }
}

/**
 * Returns an empty array if the menu item is a go up menu and
 * the URL path is at the root.
 *
 * @param {Node} target The target node.
 * @param {types.PageState} pageState The state of the page.
 * @param {types.MenuItem} menuItem The original menu item.
 * @param {Object.<string, *>} config An configurations.
 * @return {types.MenuItem} The new menu item.
 */
// FIXME graying out instead of removing?
function hideGoUpIfTop(target, pageState, menuItem, config) {
    if (pageState.isTop) {
        return hideIfClassOf(menuItem, "up");
    } else {
        return menuItem;
    }
}

/**
 * Choose reload or stop depending on page state.
 *
 * @param {Node} target The target node.
 * @param {types.PageState} pageState The state of the page.
 * @param {types.MenuItem} menuItem The original menu item.
 * @param {Object.<string, *>} config An configurations.
 * @return {types.MenuItem} The new menu item.
 */
function chooseReloadOrStop(target, pageState, menuItem, config) {
    if (pageState.isLoading) {
        return hideIfClassOf(menuItem, "reload");
    } else {
        return hideIfClassOf(menuItem, "stop");
    }
}

/**
 * An array of menu filters.
 *
 * @see types.MenuFilter
 * @type {Array.<types.MenuFilter>}
 */
var menuFilters = [
    hideBackIfFirst,
    hideForwardIfLast,
    hideGoUpIfTop,
    chooseReloadOrStop
];