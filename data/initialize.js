/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Initialization routines
 *
 * Those codes bridge the SVG DOM and the CompassMenu object
 * as well as attach the menu to the page.
 * Those codes depend heavily on details of the SVG document.
 *
 * An iframe with SVG document is injected into document body.
 * Since we should avoid slowdown of page loading as much as possible,
 * the menu icons are loaded when the user presses a mouse button.
 *
 * We need the iframe to be populated when a mouse button is pressed,
 * so that we need to insert the iframe element before mouse press events.
 *
 * We initialize the menu with following steps:
 * 1. Wait for the insertion of the body element.
 * 2. Inject an iframe element with menu.svg into the body element.
 * 3. When the user presses a mouse button, load the menu icons asynchronously.
 */

'use strict';

/**
 * Range generator.
 *
 * @param {number} start The start of the range, inclusive
 * @param {number} end The end of the range, exclusive
 */
function* range(start, end) {
    for (let i = start; i < end; i++) {
        yield i;
    }
}

/**
 * @return {Array.<Node>} The elements with id prefix0, ..., prefix7
 * @param {Document} ownerDocument The document contains the elements.
 * @param {string} prefix The prefix of the ID.
 */
function getNumberedElements(ownerDocument, prefix) {
    return [...range(0, 8)]
        .map((i) => ownerDocument.getElementById(prefix + i));
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
    function textSetter(
        balloonElement,
        textElement,
        getBoundingBox,
        rectFillElement, rectStrokeElement,
        circleFillElement, circleStrokeElement,
        isLeftToRight
    ) {
        function doSetText(text) {
            balloonElement.style.display = 'inline';
            textElement.style.display = 'inline';

            textElement.textContent = text;

            const boundingBox = getBoundingBox(textElement);
            const widthText = boundingBox.width.toString();

            rectFillElement.setAttribute('width', widthText);
            rectStrokeElement.setAttribute('width', widthText);

            if (isLeftToRight) {
                const left = textElement.x.baseVal.getItem(0).value;
                const x = left + boundingBox.width;

                circleFillElement.setAttribute('cx', x);
                circleStrokeElement.setAttribute('cx', x);
            } else {
                const right = textElement.x.baseVal.getItem(0).value;
                const x = right - boundingBox.width;

                circleFillElement.setAttribute('cx', x);
                circleStrokeElement.setAttribute('cx', x);

                rectFillElement.setAttribute('x', x);
                rectStrokeElement.setAttribute('x', x);
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
    const shadowTextElement = ownerDocument.getElementById('shadow_text');

    /**
     * Returns the bounding box of the givien element excluding transformations.
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

        const boundingBox = shadowTextElement.getBBox();

        shadowTextElement.style.display = 'none';

        return boundingBox;
    }

    const balloonElements = getNumberedElements(ownerDocument, 'balloon');
    const textElements = getNumberedElements(ownerDocument, 'text');
    const rectFillElements = getNumberedElements(ownerDocument, 'rect_fill');
    const rectStrokeElements =
              getNumberedElements(ownerDocument, 'rect_stroke');
    const circleFillElements =
              getNumberedElements(ownerDocument, 'circle_fill');
    const circleStrokeElements =
              getNumberedElements(ownerDocument, 'circle_stroke');

    const getBoundingBoxes = [
        simpleGetBoundingBox, simpleGetBoundingBox,
        tiltedGetBoundingBox, simpleGetBoundingBox,
        simpleGetBoundingBox, simpleGetBoundingBox,
        tiltedGetBoundingBox, simpleGetBoundingBox
    ];

    const isLeftToRights = [
        true, true, false, false,
        false, false, true, true
    ];

    return [...range(0, 8)]
        .map(
            (i) => textSetter(
                balloonElements[i], textElements[i],
                getBoundingBoxes[i],
                rectFillElements[i], rectStrokeElements[i],
                circleFillElements[i], circleStrokeElements[i],
                isLeftToRights[i]
            )
        );
}

/**
 * The initialization routine.
 *
 * The function is called when the user pressed button
 * before the menu is initialized.
 *
 * @param {MouseEvent} event The mouse event.
 * @param {HTMLIFrameElement} iframe The iframe containing the menu.
 * @param {Object.<string, *>} config The add-on configuration.
 */
function initialize(event, iframe, config) {
    iframe.style.visibility = 'visible';

    const ownerDocument = iframe.contentDocument;

    /** The element representing the entire menu including labels */
    const menuNode = ownerDocument.getElementById('menu');

    // If the page is zoomed, it seems that content size may be rounded up
    // while iframe size may be rounded down.
    // I am not sure this is specified.
    // FIXME: assuming menuNode.getAttribute('width') is in px.
    iframe.style.width = parseInt(menuNode.getAttribute('width')) + 1 + 'px';
    iframe.style.height = parseInt(menuNode.getAttribute('height')) + 1 + 'px';

    /** The element representing the outer ring. */
    const outer = ownerDocument.getElementById('outer');

    /** The element representing the inner hole. */
    const hole = ownerDocument.getElementById('hole');

    /** The elements representing the menu item icons. */
    const itemElements = getNumberedElements(ownerDocument, 'item');

    /** The elements representing the children indicator. */
    const markerElements = getNumberedElements(ownerDocument, 'marker');

    /**
     * An array of functions setting label text.
     * Passing null to functions hides balloon.
     */
    const textSetters = createTextSetters(ownerDocument);

    const menu = new PieMenu(
        iframe,
        menuNode,
        outer,
        hole,
        itemElements,
        markerElements,
        textSetters,
        contexts,
        menuFilters,
        config
    );

    loadIconsAsync(ownerDocument);

    menu.onMouseDown(event);

    browser.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== 'local') {
            return;
        }

        Object.keys(changes).forEach(key => {
            menu.config[key] = changes[key].newValue;
        });
    });
}

/**
 * Loads menu icons asynchronously and inject them into the SVG document.
 */
function loadIconsAsync(ownerDocument) {
    // XMLHttpRequest fails silently for custom URL scheme.
    // xlink:href does not work neither.
    // Using iframe instead.

    const iframe = document.createElement('iframe');

    iframe.src = browser.extension.getURL('data/menu_icons.svg');

    iframe.onload = () => {
        ownerDocument.documentElement.appendChild(
            iframe.contentDocument.getElementById('icon_defs')
        );
        document.body.removeChild(iframe);
    };

    iframe.style.display = 'none';

    document.body.appendChild(iframe);
}

/**
 * @return {Promise.<Object.<string, *>>} Configuration of the add-on.
 */
async function getConfiguration() {
    return await browser.storage.local.get({
        /** The mouse button to open the menu. */
        openButton: 2,

        /** If true, opens the menu only if Ctrl key is pressed.  */
        requireCtrl: false,

        /** If true, opens the menu only if Shift key is pressed.  */
        requireShift: false,

        /**
         * If true, does not open the menu if Ctrl key is pressed.
         *
         * If both isCtrlSupress and isShiftSupress is true,
         * does not open the menu if both Ctrl and Shift key is pressed.
         */
        isCtrlSupress: false,

        /**
         * If true, does not open the menu if Shift key is pressed.
         *
         * If both isCtrlSupress and isShiftSupress is true,
         * does not open the menu if both Ctrl and Shift key is pressed.
         */
        isShiftSupress: true,

        /**
         * The delay in milliseconds from opening the menu to
         * showing the labels.
         */
        labelDelay: 500,
    });
}

/**
 * Injects an iframe element into body and adds an event listener for
 * mousepress events to initialize the menu.
 *
 * The function is called when the body element is inserted.
 */
async function onBodyAdded() {
    // document.body.dataset seems not to be ready.
    if (document.documentElement.getAttribute('data-supress-compass-menu')) {
        // The document is the menu itself
        // (or some document not willing CompassMenu).
        // Supressing the menu.

        return;
    }

    const config = await getConfiguration();


    class CompassMenuRoot extends HTMLElement {
    }

    customElements.define('org-tatapa-compass-menu-root', CompassMenuRoot);

    const root = document.createElement('org-tatapa-compass-menu-root');

    document.body.appendChild(root);

    const shadow = root.attachShadow({mode: 'closed'});

    const iframe = document.createElement('iframe');

    iframe.style.borderStyle = 'none';
    iframe.style.outline = 'none';
    iframe.style.backgroundColor = 'transparent';
    iframe.style.position = 'absolute';
    iframe.style.margin = '0';
    iframe.style.padding = '0';
    iframe.style.left = '0';
    iframe.style.top = '0';
    iframe.style.zIndex = '2147483647';
    // This was `iframe.style.style.display = 'none'` but it causes getBBox
    // to raise an error in Firefox 58.
    iframe.style.visibility = 'hidden';

    iframe.src = browser.extension.getURL('data/menu.svg');

    shadow.appendChild(iframe);

    function listener(event) {
        window.removeEventListener('mousedown', listener, false);

        initialize(event, iframe, config);
    };

    window.addEventListener('mousedown', listener, false);
}

if (document.body) {
    onBodyAdded();
} else {
    const onMutate = (records) => {
        if (document.body) {
            mutationObserver.disconnect();

            onBodyAdded();
        }
    };

    const mutationObserver = new MutationObserver(onMutate);

    mutationObserver.observe(
        document.documentElement, {
            childList: true
        }
    );
}
