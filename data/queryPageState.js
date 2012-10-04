/*
 * Commnunication functions between the content scripts and the add-on
 * about page states.
 */

"use strict";

var nextUniqueID = 0;

/**
 * @return {*} An unique id.
 */
function allocateUniqueID() {
    return nextUniqueID++;
}

/**
 * The dictionary from the message IDs to the callback functions
 * passed to requestPageState.
 *
 * @type {Object.<string, types.PageState>}
 */
var pageStateHandlers = {};

/**
 * Asks the add-on about current page state.
 *
 * The function is asynchronous.
 *
 * @param {function(types.PageState)} onPageState
 *     The callback function called with the page state.
 */
function queryPageState(onPageState) {
    var messageID = allocateUniqueID();

    pageStateHandlers[messageID] = onPageState;

    self.port.emit("requestPageState", messageID);
}

/**
 * The function called from the add-on with the page state.
 *
 * @param {{id: *, pageState: types.PageState}} message
 *     The message sent from the add-on.
 *     The id is the message id attached to requestPageState message
 *     from queryPageState.
 */
function onPageState(message) {
    var id = message.id;
    var pageState = message.pageState;

    var handler = pageStateHandlers[id];

    delete pageStateHandlers[id];

    if (handler) {
        handler(pageState);
    }
}
