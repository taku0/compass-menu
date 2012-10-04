/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Localized menu labels.
 * 
 * Since content scripts are not localized, we pass a mapping from
 * key to localized label.
 */

"use strict";

var _ = require("l10n").get;

var keys = [
    "page",
    "bookmark",
    "save_page",
    "view_page_source",
    "view_page_info",
    "window",
    "view_next_window",
    "close_window",
    "undo_close_window",
    "view_previous_window",
    "open_new_window",
    "duplicate_window",
    "tab",
    "view_next_tab",
    "close_tab",
    "undo_close_tab",
    "view_previous_tab",
    "open_new_tab",
    "duplicate_tab",
    "navigation",
    "forward",
    "go_to_last",
    "reload",
    "reload_without_cache",
    "stop",
    "back",
    "go_to_first",
    "up",
    "open_location",
    "selection",
    "open_selection",
    "open_selection_in_new_tab",
    "search_the_web",
    "search_the_web_in_new_tab",
    "copy_selection",
    "image",
    "view_image",
    "view_image_in_new_tab",
    "save_image",
    "copy_image_location",
    "link",
    "open_link_in_new_tab",
    "save_link",
    "open_link_in_new_window",
    "copy_location",
    "text",
    "copy_text",
    "paste_text",
    "cut_text",
    "undo_text",
    "redo_text",
    "frame",
    "view_frame",
    "view_frame_in_new_tab",
    "reload_frame",
    "reload_frame_without_cache",
    "save_frame",
    "view_frame_source",
    "view_frame_info"
];

var localizedLabels = {};

keys.forEach(function(key) {
                 localizedLabels[key] = _(key);
             });

exports.localizedLabels = localizedLabels;
