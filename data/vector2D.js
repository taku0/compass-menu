/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * 2D vector class.
 */

"use strict";

function Vector2D() {
    if (!(this instanceof Vector2D)) {
        var vector = new Vector2D();

        return Vector2D.apply(vector, arguments);
    }

    switch (arguments.length) {
    case 0:
        return this;
    case 1:
        var point = arguments[0];

        this.x = point.x;
        this.y = point.y;

        return this;
    default:
        this.x = arguments[0];
        this.y = arguments[1];

        return this;
    }
}

Vector2D.prototype = {
    plus: function(other) new Vector2D(this.x + other.x, this.y + other.y),

    scale: function(factor) new Vector2D(factor * this.x, factor * this.y),

    diff: function(other) new Vector2D(this.x - other.x, this.y - other.y),

    nagate: function() new Vector2D(-this.x, -this.y),

    normSquared: function() this.x * this.x + this.y * this.y,

    norm: function() Math.sqrt(this.normSquared()),

    distanceSquared: function(other) this.diff(other).normSquared(),

    distance: function(other) Math.sqrt(this.distanceSquared()),

    normalize: function() this.scale(1.0 / this.norm()),

    applyTransform: function(matrix) {
        var x = matrix.a * this.x + matrix.c * this.y + matrix.e;
        var y = matrix.b * this.x + matrix.d * this.y + matrix.f;

        return new Vector2D(x, y);
    }
};