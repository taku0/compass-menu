// TODO オプション
// TODO use destructive assignment, expression closures, bind
// TODO フチを濃くする?
// TODO z-index調整

var data = require("self").data;
var pageMod = require("page-mod");
var windowUtils = require("window-utils");
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

pageMod.PageMod({
    include: ['*'],
    contentScriptWhen: 'start',
    contentScriptFile: [
        data.url('vector2D.js'),
        data.url('menuItems.js'),
        data.url('detectContext.js'),
        data.url('menu.js')
    ],
    contentScriptOptions: {
        svgSource: data.load('menu.svg'),
        localizedLabels: localizedLabels
    },
    onAttach: function(worker) {
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
