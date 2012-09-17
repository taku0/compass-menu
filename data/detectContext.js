"use strict";

/**
 * @return {function(Node): boolean} A function takes node and returns true if
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
 * @return {boolean} true if the selection is not empty
 */
function isSelected(node) {
    var document = node.ownerDocument;
    var selection = document.getSelection();

    return !selection.isCollapsed;
}

/**
 * @return {boolean} true if the given node is in a frame
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
 */
function detectContext(node) {
    for (var i = 0; i < contextDetectors.length; i++) {
        var detector = contextDetectors[i];

        if (detector.detector(node)) {
            return detector.context;
        }
    }

    return "page";
}
