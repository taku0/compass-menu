/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * The menu definition.
 *
 * There are several menus, one for each contexts.
 * Each menu is an array of menu items while a menu item is
 * an array of variants.
 * Variants are primary variant or secondary variant.
 * Pressing alt selects the secondary variant.
 * See also types.Variant for detail.
 *
 * Null menu item represents empty item.
 *
 * The menu items are filtered by menu filters.
 * Menu filters tweak the menu item; it hides the disabled menu or
 * replace menu items depend on page state.
 */

'use strict';

const pageMenu = {
    icon: '#page',
    label: 'page',
    children: [
        [
            {
                icon: '#bookmark',
                label: 'bookmark',
                action: (menu) => requestCreateBookmark(
                    menu.pageState.topURL, menu.pageState.topTitle
                ),
            },
        ],
        null,
        [
            {
                icon: '#save',
                label: 'save_page',
                action: (menu) => saveURL(menu.pageState.topURL),
            },
        ],
        null,
        [
            {
                icon: '#source',
                label: 'view_page_source',
                action: (menu) => requestShowPageSource(
                  menu.pageState.topURL
                ),
            },
        ],
        null,
        null,
        null,
    ],
};

const windowMenu = {
    icon: '#window',
    label: 'window',
    children: [
        [
            {
                icon: '#forward',
                label: 'view_next_window',
                action: () => requestActivateWindowRelative(1),
            },
        ],
        null,
        [
            {
                icon: '#stop',
                label: 'close_window',
                action: () => requestCloseWindow(),
            },
            {
                icon: '#undo',
                label: 'undo_close_window',
                action: () => requestUndoCloseWindow(),
            },
        ],
        null,
        [
            {
                icon: '#back',
                label: 'view_previous_window',
                action: () => requestActivateWindowRelative(-1),
            },
        ],
        null,
        [
            {
                icon: '#new',
                label: 'open_new_window',
                action: () => requestOpenNewWindow(),
            },
            {
                icon: '#new',
                label: 'duplicate_window',
                action: () => requestDuplicateWindow(),
            },
        ],
        null,
    ],
};

const tabMenu = {
    icon: '#tab',
    label: 'tab',
    children: [
        [
            {
                icon: '#forward',
                label: 'view_next_tab',
                action: () => requestActivateTabRelative(1),
            },
        ],
        null,
        [
            {
                icon: '#stop',
                label: 'close_tab',
                action: () => requestCloseTab(),
            },
            {
                icon: '#undo',
                label: 'undo_close_tab',
                action: () => requestUndoCloseTab(),
            },
        ],
        null,
        [
            {
                icon: '#back',
                label: 'view_previous_tab',
                action: () => requestActivateTabRelative(-1),
            },
        ],
        null,
        [
            {
                icon: '#new',
                label: 'open_new_tab',
                action: () => requestOpenNewTab(),
            },
            {
                icon: '#new',
                label: 'duplicate_tab',
                action: () => requestDuplicateTab(),
            },
        ],
        null,
    ],
};

const navigationMenu = {
    icon: '#navigation',
    label: 'navigation',
    children: [
        [
            {
                icon: '#forward',
                label: 'forward',
                classes: ['forward'],
                action: () => history.forward(),
            },
            {
                icon: '#last',
                label: 'go_to_last',
                classes: ['forward'],
                action: () => {
                    const length = history.length;

                    for (let i = 0; i < length; i++) {
                        history.go(i);
                    }
                },
            },
        ],
        [
            pageMenu
        ],
        [
            // see chooseReloadOrStop
            {
                icon: '#reload',
                label: 'reload',
                classes: ['reload'],
                action: () => requestReloadTab(),
            },
            {
                icon: '#reload',
                label: 'reload_without_cache',
                classes: ['reload'],
                action: () => requestReloadTab(true),
            },
            {
                icon: '#stop',
                label: 'stop',
                classes: ['stop'],
                action: (menu) => {
                    window.stop();

                    menu.stopped = true;
                },
            },
        ],
        null, // developer menu?
        [
            {
                icon: '#back',
                label: 'back',
                classes: ['back'],
                action: () => history.back(),
            },
            {
                icon: '#first',
                label: 'go_to_first',
                classes: ['back'],
                action: () => {
                    const length = history.length;

                    for (let i = 0; i < length; i++) {
                        history.go(-i);
                    }
                },
            },
        ],
        [
            windowMenu,
        ],
        [
            {
                icon: '#up',
                label: 'up',
                classes: ['up'],
                action: (menu) => goUp(menu),
            },
        ],
        [
            tabMenu,
        ],
    ],
};

const navigationSubMenu = {
    icon: navigationMenu.icon,
    label: navigationMenu.label,
    children: [
        navigationMenu.children[0],
        null,
        navigationMenu.children[2],
        null,
        navigationMenu.children[4],
        null,
        navigationMenu.children[6],
    ],
};

const selectionMenu = {
    icon: '#selection',
    label: 'selection',
    children: [
        [
            {
                icon: '#open_link',
                label: 'open_selection',
                classes: ['open_selection'],
                action: () => {
                    const selection = window.getSelection().toString().trim();

                    openURLInCurrentTab(selection.toString());
                },
            },
            {
                icon: '#open_link',
                label: 'open_selection_in_new_tab',
                classes: ['open_selection'],
                action: () => {
                    const selection = window.getSelection().toString().trim();

                    requestOpenURLInNewTab(selection.toString());
                },
            },
        ],
        [
            pageMenu,
        ],
        null, // translate menu?
        [
            navigationSubMenu,
        ],
        [
            {
                icon: '#search',
                label: 'search_the_web',
                action: () => {
                    const selection = window.getSelection();

                    requestSearchWeb(selection.toString(), false);
                },
            },
            {
                icon: '#search',
                label: 'search_the_web_in_new_tab',
                action: () => {
                    const selection = window.getSelection();

                    requestSearchWeb(selection.toString(), true);
                },
            },
        ],
        [
            windowMenu,
        ],
        [
            {
                icon: '#copy',
                label: 'copy_selection',
                action: () => document.execCommand('copy'),
            },
        ],
        [
            tabMenu,
        ],
    ],
};

const imageMenu = {
    icon: '#page',
    label: 'image',
    children: [
        [
            {
                icon: '#open_link',
                label: 'view_image',
                action: (menu) => {
                    const url = menu.target.src;

                    openURLInCurrentTab(url);
                },
            },
            {
                icon: '#open_link',
                label: 'view_image_in_new_tab',
                action: (menu) => {
                    const url = menu.target.src;

                    requestOpenURLInNewTab(url);
                },
            },
        ],
        [
            pageMenu,
        ],
        [
            {
                icon: '#save',
                label: 'save_image',
                action: (menu) => {
                    const url = menu.target.src;

                    saveImageURL(url);
                },
            },
        ],
        [
            navigationSubMenu,
        ],
        null,
        [
            windowMenu,
        ],
        [
            {
                icon: '#copy',
                label: 'copy_image_location',
                action: (menu) => {
                    const url = menu.target.src;

                    copyText(url);
                },
            },
        ],
        [
            tabMenu,
        ],
    ],
};

const imageSubMenu = {
    icon: imageMenu.icon,
    label: imageMenu.label,
    children: [
        imageMenu.children[0],
        null,
        imageMenu.children[2],
        null,
        imageMenu.children[4],
        [
            pageMenu,
        ],
        imageMenu.children[6],
        null,
    ],
};

const linkMenu = {
    icon: '#link',
    label: 'link',
    children: [
        [
            {
                icon: '#open_link',
                label: 'open_link_in_new_tab',
                action: (menu) => {
                    const url = extractLinkURL(menu.target);

                    requestOpenURLInNewTab(url);
                },
            },
        ],
        [
            pageMenu,
        ],
        [
            {
                icon: '#save',
                label: 'save_link',
                action: (menu) => {
                    const url = extractLinkURL(menu.target);

                    saveURL(url);
                },
            },
        ],
        [
            navigationSubMenu,
        ],
        [
            {
                icon: '#open_link',
                label: 'open_link_in_new_window',
                action: (menu) => {
                    const url = extractLinkURL(menu.target);

                    requestOpenURLInNewWindow(url);
                },
            },
        ],
        [
            windowMenu,
        ],
        [
            {
                icon: '#copy',
                label: 'copy_location',
                action: (menu) => {
                    const url = extractLinkURL(menu.target);

                    copyText(url);
                },
            },
        ],
        [
            tabMenu,
        ],
    ],
};

const imageLinkMenu = {
    icon: linkMenu.icon,
    label: linkMenu.label,
    children: [
        linkMenu.children[0],
        [
            imageSubMenu,
        ],
        linkMenu.children[2],
        linkMenu.children[3],
        linkMenu.children[4],
        linkMenu.children[5],
        linkMenu.children[6],
        linkMenu.children[7],
    ],
};

// TODO save, play, pause, mute, show media controls, copy location
const audioMenu = navigationMenu;

// TODO save, play, pause, mute, show media controls, copy location, fullscreen, view
const videoMenu = navigationMenu;

const textMenu = {
    icon: '#text',
    label: 'text',
    children: [
        [
            {
                icon: '#copy',
                label: 'copy_text',
                action: () => document.execCommand('copy'),
            },
        ],
        [
            pageMenu,
        ],
        [
            {
                icon: '#paste',
                label: 'paste_text',
                action: (menu) => paste(menu.target),
            },
        ],
        [
            navigationSubMenu,
        ],
        [
            {
                icon: '#cut',
                label: 'cut_text',
                action: () => document.execCommand('cut'),
            },
        ],
        [
            windowMenu,
        ],
        [
            // Not supported?
            // {
            //     icon: '#undo',
            //     label: 'undo_text',
            //     action: () => document.execCommand('undo'),
            // },
            // {
            //     icon: '#redo',
            //     label: 'redo_text',
            //     action: () => document.execCommand('redo'),
            // },
        ],
        [
            tabMenu,
        ],
    ],
};

const frameMenu = {
    icon: '#frame',
    label: 'frame',
    children: [
        [
            {
                icon: '#open_link',
                label: 'view_frame',
                action: () => openURLInCurrentTab(window.location.href),
            },
            {
                icon: '#open_link',
                label: 'view_frame_in_new_tab',
                action: () => requestOpenURLInNewTab(window.location.href),
            },
        ],
        [
            {
                icon: '#reload',
                label: 'reload_frame',
                action: () => window.location.reload(),
            },
            {
                icon: '#reload',
                label: 'reload_frame_without_cache',
                action: () => window.location.reload(true),
            },
        ],
        [
            {
                icon: '#save',
                label: 'save_frame',
                action: () => saveURL(window.location.href),
            },
        ],
        null,
        [
            {
                icon: '#source',
                label: 'view_frame_source',
                action: () => requestShowPageSource(window.location.href),
            },
        ],
        [
            pageMenu,
        ],
        null,
        null,
    ]
};

const frameNavigationMenu = {
    icon: navigationMenu.icon,
    label: navigationMenu.label,
    children: [
        navigationMenu.children[0],
        [
            frameMenu,
        ],
        navigationMenu.children[2],
        navigationMenu.children[3],
        navigationMenu.children[4],
        navigationMenu.children[5],
        navigationMenu.children[6],
        navigationMenu.children[7],
    ],
};

const contexts = {
    page: navigationMenu.children,
    selection: selectionMenu.children,
    image: imageMenu.children,
    imageLink: imageLinkMenu.children,
    link: linkMenu.children,
    audio: audioMenu.children,
    video: videoMenu.children,
    text: textMenu.children,
    frame: frameNavigationMenu.children,
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
    const document = node.ownerDocument || node;

    function resolveNamespace(prefix) {
        if (prefix === 'xhtml') {
            return 'http://www.w3.org/1999/xhtml';
        } else {
            return null;
        }
    }

    resultType = resultType || XPathResult.ANY_TYPE;

    const result =  document.evaluate(
        xpath,
        node,
        resolveNamespace,
        resultType,
        null
    );

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
    const xpath =
        '(ancestor-or-self::xhtml:a | ancestor-or-self::xhtml:area)[@href]';
    const anchorNode =
        evaluateXPath(xpath, node, XPathResult.FIRST_ORDERED_NODE_TYPE);

    // The href property returns always a valid (i.e. not a relative) URL.
    return anchorNode.href;
}


/**
 * Requests the add-on to create a bookmark.
 *
 * The function is asynchronous.
 *
 * @param {string} url The URL of the bookmark.
 * @param {string} title The title of the bookmark.
 */
function requestCreateBookmark(url, title) {
    browser.runtime.sendMessage({
        name: 'requestCreateBookmark',
        url,
        title,
    });
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
    browser.runtime.sendMessage({
        name: 'requestActivateWindowRelative',
        offset,
    });
}

/**
 * Requests the add-on to activate another tab.
 *
 * The function is asynchronous.
 *
 * @param {number} offset A relative index of the tab to be activated.
 *     The index of the current tab is 0.
 */
function requestActivateTabRelative(offset) {
    browser.runtime.sendMessage({
        name: 'requestActivateTabRelative',
        offset,
    });
}

/**
 * Requests the add-on to close the window.
 *
 * The function is asynchronous.
 */
function requestCloseWindow() {
    browser.runtime.sendMessage({
        name: 'requestCloseWindow',
    });
}

/**
 * Requests the add-on to close the tab.
 *
 * The function is asynchronous.
 */
function requestCloseTab() {
    browser.runtime.sendMessage({
        name: 'requestCloseTab',
    });
}

/**
 * Requests the add-on to undo closing a window.
 *
 * The function is asynchronous.
 */
function requestUndoCloseWindow() {
    browser.runtime.sendMessage({
        name: 'requestUndoCloseWindow',
    });
}

/**
 * Requests the add-on to undo closing a tab.
 *
 * The function is asynchronous.
 */
function requestUndoCloseTab() {
    browser.runtime.sendMessage({
        name: 'requestUndoCloseTab',
    });
}

/**
 * Requests the add-on to open a new window.
 *
 * The function is asynchronous.
 */
function requestOpenNewWindow() {
    browser.runtime.sendMessage({
        name: 'requestOpenNewWindow',
    });
}

/**
 * Requests the add-on to open a new tab.
 *
 * The function is asynchronous.
 */
function requestOpenNewTab() {
    browser.runtime.sendMessage({
        name: 'requestOpenNewTab',
    });
}

/**
 * Open a URL in the current tab.
 *
 * @param {string} url a URL to be opened.
 */
function openURLInCurrentTab(url) {
    window.top.location.href = url;
}

/**
 * Requests the add-on to open a URL in a new window.
 *
 * The function is asynchronous.
 *
 * @param {string} url a URL to be opened.
 */
function requestOpenURLInNewWindow(url) {
    browser.runtime.sendMessage({
        name: 'requestOpenURLInNewWindow',
        url,
    });
}

/**
 * Requests the add-on to open a URL in a new tab.
 *
 * The function is asynchronous.
 *
 * @param {string} url a URL to be opened.
 */
function requestOpenURLInNewTab(url) {
    browser.runtime.sendMessage({
        name: 'requestOpenURLInNewTab',
        url,
    });
}

/**
 * Requests the add-on to duplicate the current window.
 *
 * The function is asynchronous.
 */
function requestDuplicateWindow() {
    browser.runtime.sendMessage({
        name: 'requestDuplicateWindow'
    });
}

/**
 * Requests the add-on to duplicate the current tab.
 *
 * The function is asynchronous.
 */
function requestDuplicateTab() {
    browser.runtime.sendMessage( {
        name: 'requestDuplicateTab'
    });
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
    browser.runtime.sendMessage({
        name: 'requestSearchWeb',
        searchText,
        useNewTab,
    });
}

/**
 * Returns the parent URL of the given URL.
 *
 * Example:
 *   http://example.org/abc/def → http://example.org/abc/
 *   http://example.org/abc/def/ → http://example.org/abc/
 *   http://example.org/ → http://example.org/
 *   other-scheme:/abc/def → other-scheme:/abc
 *   other-scheme:/abc → other-scheme:
 *
 * @return {string} The parent URL of the given URL.
 * @param {string} url A URL
 */
function getUpURL(url) {
    let lastSlashIndex = url.lastIndexOf('/');
    const firstColonIndex = url.indexOf(':');

    if (lastSlashIndex === url.length - 1) {
        // 'http://example.org/a/' -> 'http://example.org/'
        // 'http://example.org/' -> does nothing

        lastSlashIndex = url.lastIndexOf('/', url.length - 2);
    }

    if (lastSlashIndex === -1 ||
        lastSlashIndex === firstColonIndex + 2) {
        return url;
    }

    return url.substring(0, lastSlashIndex + 1);
}

/**
 * Go up path hierarchy.
 */
function goUp(menu) {
    const upURL = getUpURL(menu.pageState.topURL);

    if (upURL !== menu.pageState.topURL) {
        openURLInCurrentTab(upURL);
    }
}

/**
 * Saves a URL.
 *
 * @param {string} url A URL to be saved.
 */
async function saveURL(url) {
    const currentOrigin = new URL(window.location.href).origin;
    const targetOrigin = new URL(url).origin;

    if (currentOrigin == targetOrigin) {
        const sharpIndex = url.indexOf('#');

        if (sharpIndex !== -1) {
            url = url.substring(0, sharpIndex);
        }

        return doSaveURL(url, '');
    }

    const response = await fetch(url, {
        mode: 'no-cors',
        credentials: 'include',
        redirect: 'follow',
    });

    const blob = await response.blob();

    let lastSlashIndex = url.lastIndexOf('/');
    const firstColonIndex = url.indexOf(':');

    if (lastSlashIndex === url.length - 1) {
        lastSlashIndex = url.lastIndexOf('/', url.length - 2);
    }

    let filename;

    if (lastSlashIndex === -1 ||
        lastSlashIndex === firstColonIndex + 2) {

        filename = 'index.html';
    } else {
        filename = url.substring(lastSlashIndex + 1);
    }

    return doSaveURL(URL.createObjectURL(blob), filename);
}

async function doSaveURL(url, filename) {
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.target = '_blank';
    anchor.download = filename;
    document.body.append(anchor);
    anchor.click();
    document.body.removeChild(anchor);
}

/**
 * Saves an image URL.
 *
 * @param {string} url A URL to be saved.
 */
function saveImageURL(url) {
    saveURL(url);
}

/**
 * Copy text.
 *
 * @param {string} text A string to be copied
 */
function copyText(text) {
    const p = document.createElement('p');

    p.textContent = text;

    document.body.appendChild(p);

    p.focus();

    const selection = window.getSelection();

    selection.removeAllRanges();

    const range = document.createRange();

    range.selectNode(p);

    selection.addRange(range);

    document.execCommand('copy');

    document.body.removeChild(p);
}

/**
 * Requests the add-on to show the page source.
 *
 * The function is asynchronous.
 *
 * @param {string} url A URL to show source.
 */
function requestShowPageSource(url) {
    requestOpenURLInNewTab('view-source:' + url);
}

/**
 * Requests the add-on to reload the top frame.
 */
function requestReloadTab(bypassCache) {
    browser.runtime.sendMessage({
        name: 'requestReloadTab',
        bypassCache,
    });
}

function paste(target) {
    // `document.execCommand('paste');` modifies its `textContent` rather than
    // the `value` property.  So, if the `value` of the `target` is different
    // to its `textContent` (i.e. the user edited its text), the pasted text
    // is not reflected.
    //
    // Therefore, this function pastes the text into the new textarea, then
    // modifies `target.value` manually.

    const selectionStart = target.selectionStart;
    const selectionEnd = target.selectionEnd;
    const selectionDirection = target.selectionDirection;

    const newTextArea = document.createElement('textarea');

    newTextArea.contentEditable = true;
    newTextArea.style.width = "0px";
    newTextArea.style.height = "0px";
    target.parentNode.insertBefore(newTextArea, target);
    newTextArea.focus();
    document.execCommand('paste');

    const pasted = newTextArea.value;

    console.log(pasted);

    target.parentNode.removeChild(newTextArea);

    const oldText = target.value;
    const newText = oldText.slice(0, selectionStart) +
        pasted +
        oldText.slice(selectionEnd, oldText.length);

    target.value = newText;

    target.focus();

    target.setSelectionRange(
        selectionStart + pasted.length,
        selectionStart + pasted.length,
        selectionDirection
    );
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

    return menuItem.filter((variant) => !isMenuClassOf(variant, className));
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
    const url = pageState.topURL;

    if (url === getUpURL(url)) {
        return hideIfClassOf(menuItem, 'up');
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
        return hideIfClassOf(menuItem, 'reload');
    } else {
        return hideIfClassOf(menuItem, 'stop');
    }
}

function hideOpenSelectionForInvalidURL(target, pageState, menuItem, config) {
    const selection = window.getSelection().toString().trim();
    const validSchemes = ["http", "https", "ftp", "file"];

    if (!validSchemes.some(scheme => selection.startsWith(scheme + '://'))) {
        return hideIfClassOf(menuItem, 'open_selection');
    } else {
        return menuItem;
    }
}

/**
 * An array of menu filters.
 *
 * @see types.MenuFilter
 * @type {Array.<types.MenuFilter>}
 */
const menuFilters = [
    hideGoUpIfTop,
    chooseReloadOrStop,
    hideOpenSelectionForInvalidURL,
];
