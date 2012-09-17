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
    plus: function(other) {
        return new Vector2D(this.x + other.x, this.y + other.y);
    },

    scale: function(factor) {
        return new Vector2D(factor * this.x, factor * this.y);
    },

    diff: function(other) {
        return new Vector2D(this.x - other.x, this.y - other.y);
    },

    nagate: function() {
        return new Vector2D(-this.x, -this.y);
    },

    normSquared: function() {
        return this.x * this.x + this.y * this.y;
    },

    norm: function() {
        return Math.sqrt(this.normSquared());
    },

    distanceSquared: function(other) {
        return this.diff(other).normSquared();
    },

    distance: function(other) {
        return Math.sqrt(this.distanceSquared());
    },

    normalize: function() {
        return this.scale(1.0 / this.norm());
    },

    applyTransform: function(matrix) {
        var x = matrix.a * this.x + matrix.c * this.y + matrix.e;
        var y = matrix.b * this.x + matrix.d * this.y + matrix.f;

        return new Vector2D(x, y);
    }
};