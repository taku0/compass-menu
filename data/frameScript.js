try {
    // for Firefox 44 and newer
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1203159
    Components.utils.import("resource://devtools/Console.jsm");
} catch(e) {
    // for older
    Components.utils.import("resource://gre/modules/devtools/Console.jsm");
}

var listeners = {
    disableFrameScript: disableFrameScript,
    executeCommand: executeCommand,
    showFrameInfo: showFrameInfo
};

for (let key in listeners) {
    addMessageListener("compass_menu@tatapa.org:" + key, listeners[key]);
}

/**
 * Removes message listeners.
 */
function disableFrameScript() {
    console.log("disableFrameScript");

    for (let key in listeners) {
        removeMessageListener("compass_menu@tatapa.org:" + key, listeners[key]);
    }
}

function executeCommand(message) {
    var commandName = message.data.command;
    var command = content.document.getElementById(commandName);

    if (command) {
        command.doCommand();
    } else {
        console.error("Unknown command: " + commandName);
    }
}

/**
 * Shows the current frame information, if this window has the focus.
 */
function showFrameInfo(message) {
    var focusManager = Components
            .classes["@mozilla.org/focus-manager;1"]
            .getService(Components.interfaces.nsIFocusManager);

    let outerWindowIDOfContent = content
            .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
            .getInterface(Components.interfaces.nsIDOMWindowUtils)
            .outerWindowID;

    let outerWindowIDOfFocused = focusManager
            .focusedWindow
            .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
            .getInterface(Components.interfaces.nsIDOMWindowUtils)
            .outerWindowID;

    let outerWindowIDOfTop = focusManager
            .focusedWindow
            .top
            .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
            .getInterface(Components.interfaces.nsIDOMWindowUtils)
            .outerWindowID;

    var doc = focusManager.focusedWindow.document;

    if (outerWindowIDOfContent == outerWindowIDOfTop) {
        sendAsyncMessage("compass_menu@tatapa.org:showFrameInfo", {
            outerWindowID: outerWindowIDOfFocused
        }, {
            document: doc
        });
    }
}
