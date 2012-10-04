/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * The main routines.
 * 
 * Declares page mod and communicates with content scripts.
 */

"use strict";

var data = require("self").data;
var pageMod = require("page-mod");
var windowUtils = require("window-utils");
var simplePrefs = require("simple-prefs");
var collection = require("collection");
var localizedLabels = require("./localized_labels").localizedLabels;
var {commandMap, commandWithWorkerMap, getUpURL} = require("./commands");

/**
 * Provides the content script with the page state.
 *
 * Emits pageState event with an object with fields:
 *   isFirst: true iff the current page is the first page in history.
 *   isLast: true iff the current page is the last page in history.
 *   isTop: true iff the current URL path is at the root
 *     (e.g. http://example.org/).
 *   isLoading: true iff the browser is loading the page.
 *
 * @param {Worker} worker The worker requested the page state.
 */
function onRequestPageState(worker){
    return function(messageID) {
        var window = windowUtils.activeBrowserWindow;

        var stopCommand = window.XULBrowserWindow.stopCommand;
        var isLoading = stopCommand.getAttribute("disabled") != "true";

        var isTop = worker.url === getUpURL(worker.url);

        var pageState = {
            isFirst: !window.getWebNavigation().canGoBack,
            isLast: !window.getWebNavigation().canGoForward,
            isTop: isTop,
            isLoading: isLoading
        };

        var message = {id: messageID, pageState: pageState};

        worker.port.emit("pageState", message);
    };
}

/**
 * @return {Object.<string, *>} Configuration of the add-on.
 */
function getConfiguration() {
    return {
        /** The mouse button to open the menu. */
        openButton: simplePrefs.prefs.openButton,

        /** If true, opens the menu only if Ctrl key is pressed.  */
        requireCtrl: simplePrefs.prefs.requireCtrl,

        /** If true, opens the menu only if Shift key is pressed.  */
        requireShift: simplePrefs.prefs.requireShift,

        /**
         * If true, does not open the menu if Ctrl key is pressed.
         *
         * If both isCtrlSupress and isShiftSupress is true,
         * does not open the menu if both Ctrl and Shift key is pressed.
         */
        isCtrlSupress: simplePrefs.prefs.isCtrlSupress,

        /**
         * If true, does not open the menu if Shift key is pressed.
         *
         * If both isCtrlSupress and isShiftSupress is true,
         * does not open the menu if both Ctrl and Shift key is pressed.
         */
        isShiftSupress: simplePrefs.prefs.isShiftSupress,

        /**
         * The delay in milliseconds from opening the menu to
         * showing the labels.
         */
        labelDelay: simplePrefs.prefs.labelDelay
    };
}

/**
 * The configuration of the add-on.
 */
var config = getConfiguration();

var workers = new collection.Collection();

for (let key in config) {
    simplePrefs.on(key, function() {
                       config = getConfiguration();

                       for (var worker in workers) {
                           worker.port.emit("configChanged", config);
                       }
                   });
}

pageMod.PageMod({
    include: ['*'],
    contentScriptWhen: 'start',
    contentScriptFile: [
        data.url('vector2D.js'),
        data.url('menuItems.js'),
        data.url('detectContext.js'),
        data.url('menu.js'),
        data.url('queryPageState.js'),
        data.url('initialize.js')
    ],
    contentScriptOptions: {
        svgSource: data.load('menu.svg'),
        localizedLabels: localizedLabels,
        config: config
    },
    onAttach: function(worker) {
        workers.add(worker);

        worker.on("detatch", function() {
                      workers.remove(worker);
                  });

        worker.port.on("requestPageState", onRequestPageState(worker));

        for (let eventName in commandMap) {
            if (commandMap.hasOwnProperty(eventName)) {
                let command = commandMap[eventName];

                worker.port.on(eventName, command);
            }
        }

        for (let eventName in commandWithWorkerMap) {
            if (commandWithWorkerMap.hasOwnProperty(eventName)) {
                let command = commandWithWorkerMap[eventName];

                worker.port.on(eventName, command.bind(null, worker));
            }
        }
    }
});
