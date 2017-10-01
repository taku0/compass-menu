/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * 2D vector class.
 */

'use strict';

class Vector2D {
    constructor(x, y) {
        switch (arguments.length) {
        case 0:
            return;
        case 1:
            var point = x;

            this.x = point.x;
            this.y = point.y;

            return;
        default:
            this.x = x;
            this.y = y;

            return;
        }
    }

    plus(other) {
        return new Vector2D(this.x + other.x, this.y + other.y);
    }

    scale(factor) {
        return new Vector2D(factor * this.x, factor * this.y);
    }

    diff(other) {
        return new Vector2D(this.x - other.x, this.y - other.y);
    }

    nagate() {
        return new Vector2D(-this.x, -this.y);
    }

    normSquared() {
        return this.x * this.x + this.y * this.y;
    }

    norm() {
        return Math.sqrt(this.normSquared());
    }

    distanceSquared(other) {
        return this.diff(other).normSquared();
    }

    distance(other) {
        return Math.sqrt(this.distanceSquared());
    }

    normalize() {
        return this.scale(1.0 / this.norm());
    }

    applyTransform(matrix) {
        const x = matrix.a * this.x + matrix.c * this.y + matrix.e;
        const y = matrix.b * this.x + matrix.d * this.y + matrix.f;

        return new Vector2D(x, y);
    }
}
