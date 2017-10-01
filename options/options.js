/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

'use strict';

const i18nElements = document.querySelectorAll('*[data-i18n]');

i18nElements.forEach(element => {
    const message = browser.i18n.getMessage(element.dataset.i18n);

    if (message) {
        element.textContent = message;
    }
});


function bind(key, value) {
    const element = document.getElementById(key);

    if (element.type === 'checkbox') {
        element.checked = value;

        element.addEventListener('change', () => {
            const keys = {};

            keys[key] = element.checked;

            browser.storage.local.set(keys);
        });
    } else {
        element.value = value;

        element.addEventListener('change', () => {
            const keys = {};

            keys[key] = element.value;

            browser.storage.local.set(keys);
        });
    }
}

const options = {
    'openButton': 2,
    'requireCtrl': false,
    'requireShift': false,
    'isCtrlSupress': false,
    'isShiftSupress': true,
    'labelDelay': 500,
}

browser.storage.local.get(Object.keys(options))
    .then(currentOptions => {
        Object.keys(options).forEach(key => {
            const value = (key in currentOptions) ?
                      currentOptions[key] : options[key];

            bind(key, value);
        });
    });
