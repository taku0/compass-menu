/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Initialization routines
 * 
 * Those codes bridge SVG DOM and CompassMenu class
 * as well as attach the menu to the page.
 * Those codes heavily depend on details of SVG document.
 */

"use strict";

/**
 * Range generator.
 *
 * @param {number} start The start of the range, inclusive
 * @param {number} end The end of the range, exclusive
 */
function range(start, end) {
    for (var i = start; i < end; i++) {
        yield i;
    }
}

/**
 * @return {Array.<Node>} The elements with id prefix0, ..., prefix7
 * @param {Document} ownerDocument The document contains the elements.
 * @param {string} prefix The prefix of the ID.
 */
function getNumberedElements(ownerDocument, prefix) {
    return [ownerDocument.getElementById(prefix + i)
            for each (i in range(0, 8))];
}

/**
 * @return {Array.<function(string)>} An array of functions setting label text.
 *     Passing null to functions hides balloon.
 * @param {Document} ownerDocument The owner document.
 */
function createTextSetters(ownerDocument) {
    /**
     * @return {function(string)}
     *     A function updates text node and adjust balloon.
     *
     * @param {Node} balloonElement The group element grouping entire balloon.
     * @param {Node} textElement The text element.
     * @param {function(Node): SVGRect} getBoundingBox
     *   A function returns the size of the text element
     *   excluding transformations applied to the element.
     * @param {Node} rectFillElement
     *     The element filling the body of the balloon.
     * @param {Node} rectStrokeElement
     *     The element drawing the outline of the body of the balloon.
     * @param {Node} circleFillElement
     *     The element filling the opposite side of the tail.
     * @param {Node} circleStrokeElement
     *     The element drawing the outline of the opposite side of the tail.
     * @param {boolean} isLeftToRight
     *     true iff the text is from left to right.
     */
    function textSetter(balloonElement,
                        textElement,
                        getBoundingBox,
                        rectFillElement, rectStrokeElement,
                        circleFillElement, circleStrokeElement,
                        isLeftToRight) {
        function doSetText(text) {
            balloonElement.style.display = 'inline';
            textElement.style.display = 'inline';

            textElement.textContent = text;

            var boundingBox = getBoundingBox(textElement);
            var widthText = boundingBox.width.toString();

            rectFillElement.setAttribute("width", widthText);
            rectStrokeElement.setAttribute("width", widthText);

            if (isLeftToRight) {
                var left = textElement.x.baseVal.getItem(0).value;
                var x = left + boundingBox.width;

                circleFillElement.setAttribute("cx", x);
                circleStrokeElement.setAttribute("cx", x);
            } else {
                var right = textElement.x.baseVal.getItem(0).value;
                var x = right - boundingBox.width;

                circleFillElement.setAttribute("cx", x);
                circleStrokeElement.setAttribute("cx", x);

                rectFillElement.setAttribute("x", x);
                rectStrokeElement.setAttribute("x", x);
            }
        }

        return function(text) {
            if (text) {
                doSetText(text);
            } else {
                balloonElement.style.display = 'none';
                textElement.style.display = 'none';
            }
        };
    }

    /**
     * @return {SVGRect} The bounding box of the givien element.
     * @param {Node} textElement The element to be measured.
     */
    function simpleGetBoundingBox(textElement) {
        return textElement.getBBox();
    }

    /**
     * The invisible text element
     *
     * @type {Node}
     */
    var shadowTextElement = ownerDocument.getElementById("shadow_text");

    /**
     * Returns The bounding box of the givien element excluding transformations.
     *
     * The given element is assumed to have the same styles to
     * the shadow text element.
     *
     * @return {SVGRect} The bounding box of the givien element
     *     excluding transformations.
     * @param {Node} textElement The element to be measured.
     */
    function tiltedGetBoundingBox(textElement) {
        shadowTextElement.style.display = 'inline';

        shadowTextElement.textContent = textElement.textContent;

        var boundingBox = shadowTextElement.getBBox();

        shadowTextElement.style.display = 'none';

        return boundingBox;
    }

    var balloonElements = getNumberedElements(ownerDocument, "balloon");
    var textElements = getNumberedElements(ownerDocument, "text");
    var rectFillElements = getNumberedElements(ownerDocument, "rect_fill");
    var rectStrokeElements = getNumberedElements(ownerDocument, "rect_stroke");
    var circleFillElements = getNumberedElements(ownerDocument, "circle_fill");
    var circleStrokeElements = getNumberedElements(ownerDocument, "circle_stroke");

    var getBoundingBoxes = [
        simpleGetBoundingBox, simpleGetBoundingBox,
        tiltedGetBoundingBox, simpleGetBoundingBox,
        simpleGetBoundingBox, simpleGetBoundingBox,
        tiltedGetBoundingBox, simpleGetBoundingBox
    ];

    var isLeftToRights = [
        true, true, false, false,
        false, false, true, true
    ];

    return [
        textSetter(balloonElements[i], textElements[i], getBoundingBoxes[i],
                   rectFillElements[i], rectStrokeElements[i],
                   circleFillElements[i], circleStrokeElements[i],
                   isLeftToRights[i])
        for each (i in range(0, 8))
    ];
}

/**
 * The initialization routine.
 *
 * The function is called when the user pressed button
 * before the menu is initialized.
 *
 * If the body element is not created, does nothings and
 * waits for the next mouse down.
 *
 * @param {MouseEvent} event The mouse event.
 */
function initialize(event) {
    if (document.getElementsByClassName("supress-compass-menu").length > 0) {
        // The document is the menu itself
        // (or some document not willing CompassMenu).
        // Supressing the menu.
        window.removeEventListener("mousedown", initialize, true);
        return;
    }

    if (!document.body) {
        return;
    }

    window.removeEventListener("mousedown", initialize, true);

    self.port.on("pageState", onPageState);

    var iframe = document.createElement("iframe");

    iframe.style.borderStyle = "none";
    iframe.style.outline = "none";
    iframe.style.backgroundColor = "transparent";
    iframe.style.position = "absolute";
    iframe.style.margin = "0";
    iframe.style.padding = "0";
    iframe.style.zIndex = "2147483647";

    document.body.appendChild(iframe);

    var ownerDocument = iframe.contentDocument;

    ownerDocument.open();
    ownerDocument.write(self.options.svgSource);
    ownerDocument.close();

    ownerDocument.body.style.margin = "0";
    ownerDocument.body.style.padding = "0";

    /** The element representing the entire menu including labels */
    var menuNode = ownerDocument.getElementById("menu");

    iframe.style.width = menuNode.getAttribute("width");
    iframe.style.height = menuNode.getAttribute("height");

    /** The element representing the outer ring. */
    var outer = ownerDocument.getElementById("outer");

    /** The element representing the inner hole. */
    var hole = ownerDocument.getElementById("hole");

    /** The elements representing the menu item icons. */
    var itemElements = getNumberedElements(ownerDocument, "item");

    /** The elements representing the children indicator. */
    var markerElements = getNumberedElements(ownerDocument, "marker");

    /**
     * An array of functions setting label text.
     *     Passing null to functions hides balloon.
     */
    var textSetters = createTextSetters(ownerDocument);

    /**
     * The configuration of the add-on.
     */
    var config = self.options.config;

    var menu = new PieMenu(iframe,
                           menuNode,
                           outer,
                           hole,
                           itemElements,
                           markerElements,
                           textSetters,
                           contexts,
                           menuFilters,
                           config,
                           self.options.localizedLabels);

    self.port.on("configChanged", menu.setConfig.bind(menu));

    menu.onMouseDown(event);
}

window.addEventListener("mousedown", initialize, true);

self.port.on("configChanged", function(config) {
                 self.options.config = config;
             });
