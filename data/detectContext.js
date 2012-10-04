/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Functions detect the context of the menu.
 * 
 * The main function is detectContext.
 * The context is detected with detector functions.
 * Detector functions takes a node and returns boolean.
 * Detector functions are applied to the node in sequence and 
 * the associated context name of the detector function returning true first
 * is returned.
 * Typical detector function uses XPath returning boolean.
 */

"use strict";

/**
 * @return {function(Node): boolean} A function takes node and returns true iff
 *     the given XPath evalutes true
 * @param {string} xpath A XPath expression to be evaluated.
 */
function xPathDetector(xpath) {
    return function(node) {
        var document = node.ownerDocument || node;
        var documentElement = document.documentElement;
        var namespaceResolver =
            document.createNSResolver(documentElement);

        return document.evaluate(xpath,
                                 node,
                                 namespaceResolver,
                                 XPathResult.BOOLEAN_TYPE,
                                 null).booleanValue;
    };
}

/**
 * @return {boolean} true iff the selection is not empty
 */
function isSelected(node) {
    var document = node.ownerDocument;
    var selection = document.getSelection();

    return !selection.isCollapsed;
}

/**
 * @return {boolean} true iff the given node is in a frame
 */
function isInFrame(node) {
    var document = node.ownerDocument;
    var window = document.defaultView;

    return window.frameElement !== null;
}

/**
 * An array of context definitions.
 *
 * Context definition consists of detector function and context name.
 *
 * @type {Array.<{detector: function(Node): boolean, context: string}>}
 */
var contextDetectors = [
    {detector: isSelected, context: "selection"},
    {detector: xPathDetector("self::img and (ancestor::a[@href] or ancestor::area[@href])"), context: "imageLink"},
    {detector: xPathDetector("ancestor-or-self::a[@href] or ancestor-or-self::area[@href]"), context: "link"},
    {detector: xPathDetector("self::img"), context: "image"},
    {detector: xPathDetector("self::audio"), context: "audio"},
    {detector: xPathDetector("self::video"), context: "video"},
    {detector: xPathDetector("self::input[@type = 'text' or @type = 'password'] or self::textarea"), context: "text"},
    {detector: isInFrame, context: "frame"}
];

/**
 * @return {string} The context of the node.
 * @param {Node} node A node on which the menu opens.
 */
function detectContext(node) {
    for (let detector of contextDetectors) {
        if (detector.detector(node)) {
            return detector.context;
        }
    }

    return "page";
}
