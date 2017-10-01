/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Commnunication functions between the content scripts and the add-on
 * about page states.
 */

'use strict';

/**
 * Asks the add-on about current page state.
 *
 * @return {Promise.<types.PageState>}
 */
function queryPageState() {
    return browser.runtime.sendMessage({
        name: 'requestQueryPageState',
    });
}
