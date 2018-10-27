/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Menu command functions.
 *
 * Those functions are called from content scripts via messages.
 */

'use strict';

/**
 * Activates another window.
 *
 * @param {number} offset A relative index of the window to be activated.
 *     The index of the current window is 0.
 */
async function activateWindowRelative({offset}, sender) {
    const windows = await  browser.windows.getAll({
        windowTypes: ['normal']
    });

    const currentWindowIndex = windows.findIndex(
        window => window.id === sender.tab.windowId
    );

    if (currentWindowIndex == -1) {
        return null;
    }

    const currentWindow = windows[currentWindowIndex];
    let index = currentWindowIndex + offset;

    index = index % windows.length;

    if (index < 0) {
        index += windows.length;
    }

    return await browser.windows.update(windows[index].id, { focused: true });
}

/**
 * Activates another tab.
 *
 * @param {number} offset A relative index of the tab to be activated.
 *     The index of the current tab is 0.
 */
async function activateTabRelative({offset}, sender) {
    const tabs = await  browser.tabs.query({ windowId: sender.tab.windowId });
    const currentTabIndex = sender.tab.index;
    let index = currentTabIndex + offset;

    index = index % tabs.length;

    if (index < 0) {
        index += tabs.length;
    }

    return await browser.tabs.update(tabs[index].id, { active: true });
}

/**
 * Opens a URL in a new window.
 *
 * @param {string} url A URL to be opened.
 */
async function openURLInNewWindow({url}, sender) {
    const currentWindow = await  browser.windows.get(sender.tab.windowId);

    return await browser.windows.create({
        url,
        incognito: currentWindow.incognito,
    });
}

/**
 * Opens a URL in a new tab.
 *
 * @param {string} url A URL to be opened.
 */
async function openURLInNewTab({url}) {
    return await browser.tabs.create({ url, active: false });
}

/**
 * Duplicates the current window.
 */
async function duplicateWindow(_, sender) {
    const currentWindow = await  browser.windows.get(sender.tab.windowId, {
        populate: true,
    });

    return await browser.windows.create({
        url: currentWindow.tabs.map(tab => tab.url),
        incognito: currentWindow.incognito,
    });
}

/**
 * Duplicates the current tab.
 */
function duplicateTab(_, sender) {
    return browser.tabs.duplicate(sender.tab.id);
}

/**
 * Searches the web.
 *
 * @param {string} searchText A string to search.
 * @param {boolean} useNewTab If true, search in a new tab.
 */
async function searchWeb({searchText, useNewTab}, sender) {
    const searchProperties = {
        query: searchText,
    };

    if (!useNewTab) {
        searchProperties.tabId = sender.tab.id;
    }

    browser.search.search(searchProperties);
}

/**
 * Saves a URL.
 *
 * @param {string} url A URL to be saved.
 */
function saveURL({url}) {
    return browser.downloads.download({ url, saveAs: true });
}

/**
 * Saves an image URL.
 *
 * @param {string} url A URL to be saved.
 */
function saveImageURL({url}) {
    return saveURL({url});
}

/**
 * Creates a bookmark.
 *
 * @param {string} url A URL of the page to bookmark.
 * @param {string} title The title of the bookmark.
 */
function createBookmark({url, title}) {
    return browser.bookmarks.create({ url, title });
}

/**
 * Closes the current window.
 */
function closeWindow(_, sender) {
    return browser.windows.remove(sender.tab.windowId);
}

/**
 * Closes the current tab.
 */
function closeTab(_, sender) {
    return browser.tabs.remove(sender.tab.id);
}

/**
 * Restores the last closed window.
 */
async function undoCloseWindow() {
    const sessions = await browser.sessions.getRecentlyClosed({
        maxResults: browser.sessions.MAX_SESSION_RESULTS
    });

    const windowSession = sessions.find(session => session.window);

    if (!windowSession) {
        return null;
    }

    return browser.sessions.restore(windowSession.window.sessionId);
}

/**
 * Restores the last closed tab.
 */
async function undoCloseTab() {
    const sessions = await browser.sessions.getRecentlyClosed({
        maxResults: browser.sessions.MAX_SESSION_RESULTS
    });

    const tabSession = sessions.find(session => session.tab);

    if (!tabSession) {
        return null;
    }

    return browser.sessions.restore(tabSession.tab.sessionId);
}

/**
 * Opens a new window.
 */
async function openNewWindow(_, sender) {
    const currentWindow = await  browser.windows.get(sender.tab.windowId);

    return await browser.windows.create({ incognito: currentWindow.incognito });
}

/**
 * Opens a new tab.
 */
async function openNewTab() {
    return await browser.tabs.create({ active: true });
}

async function reloadTab({bypassCache}, sender) {
    browser.tabs.reload(sender.tab.id, { bypassCache });
}

function writeTextToClipboard({text}) {
    return navigator.clipboard.writeText(text);
}

function readTextFromClipboard() {
    return navigator.clipboard.readText();
}

const commandMap = {
    requestActivateWindowRelative: activateWindowRelative,
    requestActivateTabRelative: activateTabRelative,
    requestOpenURLInNewWindow: openURLInNewWindow,
    requestOpenURLInNewTab: openURLInNewTab,
    requestDuplicateWindow: duplicateWindow,
    requestDuplicateTab: duplicateTab,
    requestSearchWeb: searchWeb,
    requestSaveURL: saveURL,
    requestSaveImageURL: saveImageURL,
    requestCreateBookmark: createBookmark,
    requestCloseWindow: closeWindow,
    requestCloseTab: closeTab,
    requestUndoCloseWindow: undoCloseWindow,
    requestUndoCloseTab: undoCloseTab,
    requestOpenNewWindow: openNewWindow,
    requestOpenNewTab: openNewTab,
    requestReloadTab: reloadTab,
    requestWriteTextToClipboard: writeTextToClipboard,
    requestReadTextFromClipboard: readTextFromClipboard,
};
