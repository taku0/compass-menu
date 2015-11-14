// Allow resource URLs to be loaded into iframes.
// Based on:
//   https://bugzilla.mozilla.org/show_bug.cgi?id=792479#c64
//   https://bitbucket.org/snippets/mathflair/7RbbE

var { Cc, Ci, Cu, Cr, Cm } = require("chrome");
var { Class } = require('sdk/core/heritage');
var { Unknown, Factory } = require('sdk/platform/xpcom');
var extensionID = 'compass_menu-at-tatapa-dot-org';
var myResourceScheme = 'res-compass-menu-at-tatapa-dot-org'; // _ is prohibited

/**
 * The protocol hander for resource:// URL scheme.
 */
var resourceProtocolHandler = Cc["@mozilla.org/network/io-service;1"]
    .getService(Ci.nsIIOService)
    .getProtocolHandler('resource');

/**
 * The protocol hander for res-compass-menu-at-tatapa-dot-org:// URL scheme.
 */
var MyResourceProtocolHandler = Class({
    extends: Unknown,
    interfaces: [ 'nsIProtocolHandler' ],

    defaultPort:   -1,
    protocolFlags: Ci.nsIProtocolHandler.URI_STD
        | Ci.nsIProtocolHandler.URI_LOADABLE_BY_ANYONE
        | Ci.nsIProtocolHandler.URI_SAFE_TO_LOAD_IN_SECURE_CONTEXT
        | Ci.nsIProtocolHandler.URI_IS_LOCAL_RESOURCE,
    scheme: myResourceScheme,

    newURI: function (spec, originCharset, baseURI) {
        let uri = Cc["@mozilla.org/network/standard-url;1"]
                .createInstance(Ci.nsIStandardURL);

        uri.init(uri.URLTYPE_STANDARD,
                 this.defaultPort,
                 spec,
                 originCharset,
                 baseURI);

        return uri.QueryInterface(Ci.nsIURI);
    },

    newChannel: function (uri) {
        // Ensure the URI has the correct form.
        if (uri.spec.indexOf(MyResourceProtocolHandler.Prefix + "data/") != 0) {
            throw Cr.NS_ERROR_ILLEGAL_VALUE;
        }

        var resourceUri = resourceProtocolHandler
                .newURI(uri.spec.replace(MyResourceProtocolHandler.Scheme,
                                         "resource"),
                        uri.originCharset, null);
        var channel = resourceProtocolHandler.newChannel(resourceUri);

        channel.originalURI = uri;

        return channel;
    },

    allowPort: function (port, scheme) {
        return false;
    }
});

MyResourceProtocolHandler.Scheme = myResourceScheme;
MyResourceProtocolHandler.Prefix =
    MyResourceProtocolHandler.Scheme + "://"  + extensionID + "/";

// Circumvent CSP protections for these iframes.
function addResourceDomain(cspRules) {
    var rules            = cspRules.split(';'),
        protocolToAdd    =  ' ' + MyResourceProtocolHandler.Scheme + ':',
        frameSrcDefined  = false,
        scriptSrcDefined = false,
        defaultSrcIndex  = -1;

    for (var ii = 0; ii < rules.length; ii++) {
        if (rules[ii].toLowerCase().indexOf('script-src') != -1) {
            rules[ii] = rules[ii] + protocolToAdd;
            scriptSrcDefined = true;
        }

        if (rules[ii].toLowerCase().indexOf('frame-src') != -1) {
            rules[ii] = rules[ii] + protocolToAdd;
            frameSrcDefined = true;
        }

        if (rules[ii].toLowerCase().indexOf('default-src') != -1) {
            defaultSrcIndex = ii;
        }
    }

    // Some websites will put every thing in the default (default-src)
    // directive, without defining script-src. We need to modify those as well.
    if ((!scriptSrcDefined || !frameSrcDefined) && (defaultSrcIndex != -1)) {
        rules[defaultSrcIndex] = rules[defaultSrcIndex] + protocolToAdd;
    }

    return rules.join(';');
};

/**
 * Intercepts HTTP requests to modify Content-Security-Policy response headers.
 */
function httpExamineCallback(aSubject, aTopic, aData) {
    var httpChannel = aSubject.QueryInterface(Ci.nsIHttpChannel);

    if (httpChannel.responseStatus !== 200) {
        return;
    }

    // There is no clean way to check the presence of csp header.
    // An exception will be thrown if it is not there.
    // https://developer.mozilla.org/en-US/docs/XPCOM_Interface_Reference/nsIHttpChannel

    try {
        var cspRules = httpChannel.getResponseHeader("Content-Security-Policy");
        var newCSPRules = addResourceDomain(cspRules);

        httpChannel.setResponseHeader('Content-Security-Policy',
                                      newCSPRules,
                                      false);
    } catch (e) {
        try {
            // Fallback mechanism support.
            cspRules = httpChannel
                .getResponseHeader("X-Content-Security-Policy");
            newCSPRules = addResourceDomain(cspRules);

            httpChannel.setResponseHeader('X-Content-Security-Policy',
                                          newCSPRules,
                                          false);
        } catch (e) {
            // No csp headers defined.
            return;
        }
    }
};

/**
 * Registers a custom URL scheme handler and HTTP response interceptor.
 */
function allowResourceURLsToBeLoadedIntoIFrames() {
    Factory({
        Component: MyResourceProtocolHandler,
        contract: "@mozilla.org/network/protocol;1?name=" +
            MyResourceProtocolHandler.Scheme
    });

    Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService)
        .addObserver(httpExamineCallback, "http-on-examine-response", false);
}

exports.allowResourceURLsToBeLoadedIntoIFrames =
    allowResourceURLsToBeLoadedIntoIFrames;
