"use strict";

var pageMenu = {
    icon: "#page",
    label: "page",
    children: [
        [
            {
                icon: "#bookmark",
                label: "bookmark",
                action: function() {console.log("bookmark");}
            }
        ],
        null,
        [
            {
                icon: "#save",
                label: "save_page",
                action: function() {console.log("save");}

            }
        ],
        null,
        [
            {
                icon: "#source",
                label: "page_source",
                action: function() {console.log("page_source");}
            }
        ],
        null,
        [
            {
                icon: "#info",
                label: "page_info",
                action: function() {console.log("page_info");}
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
                label: "next_window",
                action: function() {console.log("next_window");}
            }
        ],
        null,
        [
            {
                icon: "#stop",
                label: "close_window",
                action: function() {console.log("close_window");}
            },
            {
                icon: "#undo",
                label: "undo_close_window",
                action: function() {console.log("undo_close_window");}
            }
        ],
        null,
        [
            {
                icon: "#back",
                label: "previous_window",
                action: function() {console.log("previous_window");}
            }
        ],
        null,
        [
            {
                icon: "#new",
                label: "new_window",
                action: function() {console.log("new_window");}
            },
            {
                icon: "#new",
                label: "duplicate_window",
                action: function() {console.log("duplicate_window");}
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
                label: "next_tab",
                action: function() {console.log("next_tab");}
            }
        ],
        null,
        [
            {
                icon: "#stop",
                label: "close_tab",
                action: function() {console.log("close_tab");}
            },
            {
                icon: "#undo",
                label: "undo_close_tab",
                action: function() {console.log("undo_close_tab");}
            }
        ],
        null,
        [
            {
                icon: "#back",
                label: "previous_tab",
                action: function() {console.log("previous_tab");}
            }
        ],
        null,
        [
            {
                icon: "#new",
                label: "new_tab",
                action: function() {console.log("new_tab");}
            },
            {
                icon: "#new",
                label: "duplicate_tab",
                action: function() {console.log("duplicate_tab");}
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
                action: function() {console.log("forward");}
            },
            {
                icon: "#last",
                label: "last",
                classes: ["forward"],
                action: function() {console.log("last");}
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
                action: function() {console.log("reload");}
            },
            {
                icon: "#reload",
                label: "reload_without_cache",
                classes: ["reload"],
                action: function() {console.log("reload without cache");}
            },
            {
                icon: "#stop",
                label: "stop",
                classes: ["stop"],
                action: function() {console.log("stop");}
            }
        ],
        null, // developer menu?
        [
            {
                icon: "#back",
                label: "back",
                classes: ["back"],
                action: function() {console.log("back");}
            },
            {
                icon: "#first",
                label: "first",
                classes: ["back"],
                action: function() {console.log("back");}
            }
        ],
        [
            windowMenu
        ],
        [
            {
                icon: "#up",
                label: "up",
                action: function() {console.log("up");}
            },
            {
                icon: "#open_location",
                label: "open_location",
                action: function() {console.log("open_location");}
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
                action: function() {console.log("open_selection");}
            },
            {
                icon: "#open_link",
                label: "open_selection_in_new_tab",
                action: function() {console.log("open_selection_in_new_tab");}
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
                label: "search_web",
                action: function() {console.log("search_web");}
            },
            {
                icon: "#search",
                label: "search_web_in_new_tab",
                action: function() {console.log("search_web_in_new_tab");}
            }
        ],
        [
            windowMenu
        ],
        [
            {
                icon: "#copy",
                label: "copy_selection",
                action: function() {console.log("search_web");}
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
                action: function() {console.log("view_image");}
            },
            {
                icon: "#open_link",
                label: "view_image_in_new_tab",
                action: function() {console.log("view_image_in_new_tab");}
            }
        ],
        [
            pageMenu
        ],
        [
            {
                icon: "#save",
                label: "save_image",
                action: function() {console.log("save_image");}
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
                action: function() {console.log("copy_image_location");}
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
                action: function() {console.log("open_link_in_new_tab");}
            }
        ],
        [
            pageMenu
        ],
        [
            {
                icon: "#save",
                label: "save_link",
                action: function() {console.log("save_link");}
            }
        ],
        [
            navigationSubMenu
        ],
        [
            {
                icon: "#open_link",
                label: "open_link_in_new_window",
                action: function() {console.log("open_link_in_new_window");}
            }
        ],
        [
            windowMenu
        ],
        [
            {
                icon: "#copy",
                label: "copy_location",
                action: function() {console.log("copy_location");}
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
                action: function() {console.log("copy_text");}
            }
        ],
        [
            pageMenu
        ],
        [
            {
                icon: "#paste",
                label: "paste_text",
                action: function() {console.log("paste_text");}
            }
        ],
        [
            navigationSubMenu
        ],
        [
            {
                icon: "#cut",
                label: "cut_text",
                action: function() {console.log("cut_text");}
            }
        ],
        [
            windowMenu
        ],
        [
            {
                icon: "#undo",
                label: "undo_text",
                action: function() {console.log("undo_text");}
            },
            {
                icon: "#redo",
                label: "redo_text",
                action: function() {console.log("redo_text");}
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
                action: function() {console.log("view_frame");}
            },
            {
                icon: "#open_link",
                label: "view_frame_in_new_tab",
                action: function() {console.log("view_frame_in_new_tab");}
            }
        ],
        [
            {
                icon: "#reload",
                label: "reload_frame",
                action: function() {console.log("reload_frame");}
            },
            {
                icon: "#reload",
                label: "reload_frame_without_cache",
                action: function() {console.log("reload_frame_without_cache");}
            }
        ],
        [
            {
                icon: "#save",
                label: "save_frame",
                action: function() {console.log("save_frame");}
            }
        ],
        null,
        [
            {
                icon: "#source",
                label: "frame_source",
                action: function() {console.log("frame_source");}
            }
        ],
        [
            pageMenu
        ],
        [
            {
                icon: "#info",
                label: "frame_info",
                action: function() {console.log("frame_info");}
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
function hideForwardIfLast(target, pageState, menuItem, config) {
    if (pageState.isLast) {
        return hideIfClassOf(menuItem, "forward");
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
    chooseReloadOrStop
];