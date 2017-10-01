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

'use strict';

browser.runtime.onMessage.addListener((message, sender) => {
    if (message.name === 'requestQueryPageState') {
        return Promise.resolve({
            topURL: sender.tab.url,
            topTitle: sender.tab.title,
        });
    }

    const command = commandMap[message.name];

    if (command) {
        return Promise.resolve(command(message, sender));
    } else {
        return Promise.reject(new Error(`unknown command: ${message.name}`));
    }
});
