/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Menu command functions.
 *
 * Those functions are called from content scripts via messages through port.
 *
 * Some functions use low level functions or services.
 */

"use strict";

var {Cc, Ci} = require("chrome");
var windowUtils = require("sdk/window/utils");
var windows = require("sdk/windows").browserWindows;
var tabs = require("sdk/tabs");
var clipboard = require("sdk/clipboard");
var preferencesService = require("sdk/preferences/service");

/**
 * Executes a XUL command (e.g. cmd_copy, Browser:Reload)
 * requested from content script.
 *
 * @param {string} commandName The name of the command to be executed.
 */
function executeCommand(commandName) {
    var window = windowUtils.getMostRecentBrowserWindow();
    var document = window.document;
    var command = document.getElementById(commandName);

    if (command) {
        command.doCommand();
    } else {
        console.error("Unknown command: " + commandName);
    }
}

/**
 * Activates another window.
 *
 * @param {number} offset A relative index of the window to be activated.
 *     The index of the current window is 0.
 */
function activateWindowRelative(offset) {
    var activeWindow = windows.activeWindow;
    var windowArray = [win for each (win in windows)];
    var activeWindowIndex = windowArray.indexOf(activeWindow);

    var index = activeWindowIndex + offset;

    index = index % windowArray.length;

    if (index < 0) {
        index += windowArray.length;
    }

    windowArray[index].activate();
}

/**
 * Opens a URL in the current tab.
 *
 * @param {Worker} worker The worker for the current page.
 * @param {string} url A URL to be opened.
 */
function openURLInCurrentTab(worker, url) {
    worker.tab.url = url;
}

/**
 * Opens a URL in a new window.
 *
 * @param {string} url A URL to be opened.
 */
function openURLInNewWindow(url) {
    windows.open(url);
}

/**
 * Opens a URL in a new tab.
 *
 * @param {string} url A URL to be opened.
 */
function openURLInNewTab(url) {
    var loadInBackground =
        preferencesService.get("browser.tabs.loadInBackground", true);

    tabs.open({
                  url: url,
                  inBackground: loadInBackground
              });
}

/**
 * Duplicates the current window.
 *
 * @param {Worker} worker The worker for the current page.
 */
function duplicateWindow(worker) {
    openURLInNewWindow(worker.url);
}

/**
 * Duplicates the current tab.
 *
 * @param {Worker} worker The worker for the current page.
 */
function duplicateTab(worker) {
    openURLInNewTab(worker.url);
}

/**
 * Goes to the first page in the history.
 */
function goToFirst() {
    var window = windowUtils.getMostRecentBrowserWindow();

    var webNavigation = window.getWebNavigation();

    webNavigation.gotoIndex(0);
}

/**
 * Goes to the last page in the history.
 */
function goToLast() {
    var window = windowUtils.getMostRecentBrowserWindow();

    var webNavigation = window.getWebNavigation();

    webNavigation.gotoIndex(webNavigation.sessionHistory.count - 1);
}

/**
 * Goes up path hierarchy.
 *
 * Example:
 *   http://example.org/abc/def → http://example.org/abc/
 *   http://example.org/abc/def/ → http://example.org/abc/
 *   http://example.org/ → does nothing
 *   other-scheme:/abc/def → other-scheme:/abc
 *   other-scheme:/abc → other-scheme:
 *
 * @param {Worker} worker The worker for the current page.
 */
function goUp(worker) {
    var upURL = getUpURL(worker.url);

    if (upURL !== worker.url) {
        worker.tab.url = upURL;
    }
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
    var lastSlashIndex = url.lastIndexOf("/");
    var firstColonIndex = url.indexOf(":");

    if (lastSlashIndex === url.length - 1) {
        // "http://example.org/abc/" -> "http://example.org/"
        // "http://example.org/" -> does nothing

        lastSlashIndex = url.lastIndexOf("/", url.length - 2);
    }

    if (lastSlashIndex == -1 || lastSlashIndex == firstColonIndex + 2) {
        return url;
    }

    return url.substring(0, lastSlashIndex + 1);
}

/**
 * Searches the web.
 *
 * @param {string} searchText A string to search.
 * @param {boolean} useNewTab If true, search in a new tab.
 */
function searchWeb(searchText, useNewTab) {
    var window = windowUtils.getMostRecentBrowserWindow();

    window.BrowserSearch.loadSearch(searchText, useNewTab);
}

/**
 * Saves a URL.
 *
 * @param {string} url A URL to be saved.
 * @param {string} referrer A URL of the referrer.
 */
function saveURL(url, referrer) {
    var window = windowUtils.getMostRecentBrowserWindow();

    urlSecurityCheck(url);
    window.saveURL(url, null, null, false, false,
                   makeURI(referrer), getCurrentFrameDocument());
}

/**
 * Saves an image URL.
 *
 * @param {string} url A URL to be saved.
 * @param {string} referrer A URL of the referrer.
 */
function saveImageURL(url, referrer) {
    var window = windowUtils.getMostRecentBrowserWindow();

    urlSecurityCheck(url);
    window.saveImageURL(url, null, "SaveImageTitle", false, false,
                        makeURI(referrer), getCurrentFrameDocument());
}

function makeURI(url) {
  var ioService =
          Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
  return ioService.newURI(url, null, null);
}

function urlSecurityCheck(url) {
    // FIXME I am not sure what the urlSecurityCheck does and
    //       what is the nodePrincipal.

    var window = windowUtils.getMostRecentBrowserWindow();
    var doc = getCurrentFrameDocument();

    window.urlSecurityCheck(url, doc.nodePrincipal);
}

/**
 * Copies the given text.
 *
 * @param {string} text A string to be copied
 */
function copyText(text) {
    clipboard.set(text);
}

/**
 * Shows the current frame source.
 */
function showFrameSource() {
    var window = windowUtils.getMostRecentBrowserWindow();
    var doc = getCurrentFrameDocument();

    window.BrowserViewSourceOfDocument(doc);
}

/**
 * Shows the current frame information.
 */
function showFrameInfo() {
    var window = windowUtils.getMostRecentBrowserWindow();
    var doc = getCurrentFrameDocument();

    window.BrowserPageInfo(doc);
}

function getCurrentFrameDocument() {
    var focusManager =
        Cc["@mozilla.org/focus-manager;1"].getService(Ci.nsIFocusManager);

    // This is the frame document if the menu is in the frame,
    // unless the focus is moved.
    var doc = focusManager.focusedWindow.document;

    if (doc.getElementsByClassName("supress-compass-menu").length > 0) {
        // The menu itself has a focus.
        // Returns the document of its parent frame.
        return doc.defaultView.parent.document;
    } else {
        return doc;
    }
}

exports.commandMap = {
    requestCommand: executeCommand,
    requestActivateWindowRelative: activateWindowRelative,
    requestOpenURLInNewWindow: openURLInNewWindow,
    requestOpenURLInNewTab: openURLInNewTab,
    requestGoToFirst: goToFirst,
    requestGoToLast: goToLast,
    requestSearchWeb: searchWeb,
    requestSaveURL: saveURL,
    requestSaveImageURL: saveImageURL,
    requestCopyText: copyText,
    requestShowFrameSource: showFrameSource,
    requestShowFrameInfo: showFrameInfo
};

exports.commandWithWorkerMap = {
    requestOpenURLInCurrentTab: openURLInCurrentTab,
    requestDuplicateWindow: duplicateWindow,
    requestDuplicateTab: duplicateTab,
    requestGoUp: goUp
};

exports.getUpURL = getUpURL;
