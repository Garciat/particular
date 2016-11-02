var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const TAU = 2 * Math.PI;
class Vec2 {
    constructor(x, y) {
        this.x = x || 0;
        this.y = y || 0;
    }
    clone() {
        return new Vec2(this.x, this.y);
    }
    distanceTo(v) {
        return v.clone().sub_(this).length();
    }
    lengthSq() {
        return this.x * this.x + this.y * this.y;
    }
    length() {
        return Math.sqrt(this.lengthSq());
    }
    norm() {
        return this.clone().sdiv_(this.length());
    }
    perpCW() {
        return new Vec2(-this.y, this.x);
    }
    perpCCW() {
        return new Vec2(this.y, -this.x);
    }
    add(v) {
        return this.clone().add_(v);
    }
    add_(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }
    sub(v) {
        return this.clone().sub_(v);
    }
    sub_(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }
    smul(k) {
        return this.clone().smul_(k);
    }
    smul_(k) {
        this.x *= k;
        this.y *= k;
        return this;
    }
    sdiv(k) {
        return this.clone().sdiv_(k);
    }
    sdiv_(k) {
        this.x /= k;
        this.y /= k;
        return this;
    }
    static zero() {
        return Vec2.fromXY(0, 0);
    }
    static fromXY(x, y) {
        return new Vec2(x, y);
    }
    static fromRads(r) {
        return Vec2.fromXY(Math.cos(r), Math.sin(r));
    }
    static fromAngle(a) {
        return Vec2.fromRads(a / 360 * TAU);
    }
}
function uniformI(a, b) {
    return Math.floor(a + (b - a) * Math.random());
}
function uniformF(a, b) {
    return a + (b - a) * Math.random();
}
function randomHsla() {
    return randomHslaWithHue(uniformF(0, 1));
}
function randomHslaWithHue(hue) {
    return hslToGlColor(hue, 1, uniformF(0.20, 0.80));
}
function hslaToColor(hsla) {
    return `hsla(${hsla[0]}, ${hsla[1]}%, ${hsla[2]}%, ${hsla[3]})`;
}
function randomDirectionVec2() {
    return Vec2.fromRads(Math.random() * TAU);
}
// === ENTITIES
class Particle {
    constructor(pos, spd, trace, shapeID) {
        this.deleted = false;
        this.active = false;
        this.trace = Boolean(trace);
        this.pos = pos.clone();
        this.spd = spd.clone();
        this.path = [];
        this.shapeID = shapeID;
    }
}
class Force {
    constructor(pos, value, shapeID) {
        this.pos = pos.clone();
        this.value = value;
        this.shapeID = shapeID;
    }
}
// === STATE
const SCREENW = document.body.clientWidth;
const SCREENH = document.body.clientHeight;
const FORCE_RADIUS = 10;
let particles = [];
let forces = [];
let mousePositions = [];
let mousePosition = Vec2.zero();
let mouseSpeed = Vec2.zero();
let shouldProduce = false;
let shiftPressed = false;
let controlPressed = false;
let altPressed = false;
let clickDown = null;
let friction = false;
let circleRendererGlob = null;
// === HELPERS
function putParticle(bag, x, y) {
    const size = uniformI(2, 6);
    const color = randomHsla();
    const shapeID = circleRendererGlob.addCircle(x, y, size, color);
    bag.push(new Particle(new Vec2(x, y), Vec2.zero(), false, shapeID));
}
function produceParticlesAtPos(bag, pos, n) {
    for (let i = 0; i < n; ++i) {
        const spd = randomDirectionVec2().smul_(5 * Math.random() + 5);
        const size = uniformI(2, 6);
        const color = randomHsla();
        const shapeID = circleRendererGlob.addCircle(pos.x, pos.y, size, color);
        bag.push(new Particle(pos, spd, false, shapeID));
    }
    circleRendererGlob.flushCircles();
}
function updateMouseSpeed(pos) {
    mousePositions.push(pos);
    if (mousePositions.length === 11) {
        mousePositions.shift();
    }
    const n = mousePositions.length;
    let spd = Vec2.zero();
    for (var i = 1; i < n; ++i) {
        spd.add_(mousePositions[i]);
        spd.sub_(mousePositions[i - 1]);
    }
    spd.sdiv_(n);
    mouseSpeed = spd;
}
function cleanOutOfBounds(bag) {
    var nP = bag.length;
    var ds = 0;
    for (var iP = 0; iP < nP; ++iP) {
        var p = bag[iP];
        if (p.deleted) {
            ds += 1;
            continue;
        }
        if (!checkBounds(p)) {
            p.deleted = true;
        }
    }
    if (ds > 5000) {
        return bag.filter(p => !p.deleted);
    }
    return null;
}
function checkBounds(subject) {
    return subject.pos.x >= 0 &&
        subject.pos.y >= 0 &&
        subject.pos.x <= SCREENW &&
        subject.pos.y <= SCREENH;
}
// === EVENTS
window.addEventListener('touchend', function (ev) {
    shouldProduce = false;
});
window.addEventListener('mousemove', function (ev) {
    const pos = Vec2.fromXY(ev.clientX, ev.clientY);
    if (clickDown === 1 && particles.length > 0) {
        const lastParticle = particles[particles.length - 1];
        if (pos.distanceTo(lastParticle.pos) > 25) {
            const size = uniformI(2, 6);
            const color = circleRendererGlob.getCircleColor(lastParticle.shapeID);
            const shapeID = circleRendererGlob.addCircle(pos.x, pos.y, size, color);
            particles.push(new Particle(pos, Vec2.zero(), true, shapeID));
            circleRendererGlob.flushCircles();
        }
    }
    else if (clickDown === 2 && forces.length > 0) {
        if (controlPressed) {
        }
        else {
            const lastForce = forces[forces.length - 1];
            if (pos.distanceTo(lastForce.pos) > 25) {
                const color = circleRendererGlob.getCircleColor(lastForce.shapeID);
                const shapeID = circleRendererGlob.addCircle(pos.x, pos.y, FORCE_RADIUS, color);
                forces.push(new Force(pos, lastForce.value, shapeID));
                circleRendererGlob.flushCircles();
            }
        }
    }
    mousePosition = pos;
});
window.addEventListener('mousedown', function (ev) {
    const pos = Vec2.fromXY(ev.clientX, ev.clientY);
    if (ev.button === 0) {
        if (shiftPressed) {
        }
        else {
            shouldProduce = true;
        }
    }
    else if (ev.button === 1) {
        const size = uniformI(2, 6);
        const color = randomHsla();
        const shapeID = circleRendererGlob.addCircle(pos.x, pos.y, size, color);
        particles.push(new Particle(pos, Vec2.zero(), true, shapeID));
        circleRendererGlob.flushCircles();
    }
    else if (ev.button === 2) {
        let forceValue = 10;
        let color = [1, 1, 1, 1];
        if (shiftPressed) {
            forceValue *= -1;
            color = [0, 0, 1, 1];
        }
        const shapeID = circleRendererGlob.addCircle(pos.x, pos.y, FORCE_RADIUS, color);
        forces.push(new Force(pos, forceValue, shapeID));
        circleRendererGlob.flushCircles();
    }
    clickDown = ev.button;
});
window.addEventListener('mouseup', function (ev) {
    if (ev.button === 0) {
        shouldProduce = false;
    }
    particles.filter(p => p.trace).forEach(p => p.active = true);
    clickDown = null;
});
window.addEventListener('keydown', function (ev) {
    if (ev.keyCode === 16) {
        shiftPressed = true;
    }
    else if (ev.keyCode === 17) {
        controlPressed = true;
    }
    else if (ev.keyCode === 18) {
        altPressed = true;
    }
    else if (ev.keyCode === 32) {
        particles = [];
    }
    else if (ev.keyCode === 70) {
        friction = !friction;
    }
    else if (ev.keyCode === 68) {
        forces = forces.filter(f => f.pos.distanceTo(mousePosition) > FORCE_RADIUS);
    }
    else if (ev.keyCode === 72) {
    }
    else if (ev.keyCode === 90) {
        forces = forces.slice(0, forces.length - 1);
    }
    else if (ev.keyCode === 86) {
    }
});
window.addEventListener('keyup', function (ev) {
    if (ev.keyCode === 16) {
        shiftPressed = false;
    }
    else if (ev.keyCode === 17) {
        controlPressed = false;
    }
    else if (ev.keyCode === 18) {
        altPressed = false;
    }
});
setInterval(function () {
    updateMouseSpeed(mousePosition);
    if (shouldProduce) {
        produceParticlesAtPos(particles, mousePosition, uniformI(10, 20));
    }
}, 16);
// clean up out-of-bounds particles
setInterval(function () {
    var newParticles = cleanOutOfBounds(particles);
    if (newParticles) {
        particles = newParticles;
    }
}, 5000);
// === DRAWING
function applySpeed(subject) {
    subject.pos.x += subject.spd.x;
    subject.pos.y += subject.spd.y;
}
function applyGravity(sink, subject) {
    let fx = sink.pos.x;
    let fy = sink.pos.y;
    let sx = subject.pos.x;
    let sy = subject.pos.y;
    let dx = fx - sx;
    let dy = fy - sy;
    let dd = dx * dx + dy * dy;
    if (dd <= FORCE_RADIUS * FORCE_RADIUS) {
        return;
    }
    let k = sink.value / dd;
    let vx = dx * k;
    let vy = dy * k;
    subject.spd.x += vx;
    subject.spd.y += vy;
}
function applyFriction(subject) {
    subject.spd.x -= 0.05 * subject.spd.x;
    subject.spd.y -= 0.05 * subject.spd.y;
}
function drawVector(ctx, pos, vec, scale, color) {
    const vecS = pos.add(vec.smul(scale));
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(vecS.x, vecS.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
}
function simulate() {
    var nP = particles.length;
    var nF = forces.length;
    for (var iP = 0; iP < nP; ++iP) {
        var particle = particles[iP];
        if (particle.deleted) {
            continue;
        }
        if (particle.trace && !particle.active) {
            continue;
        }
        applySpeed(particle);
        for (var iF = 0; iF < nF; ++iF) {
            applyGravity(forces[iF], particle);
        }
        if (friction) {
            applyFriction(particle);
        }
        if (particle.trace) {
            particle.path.push(particle.pos.clone());
        }
    }
}
function updateParticlePositions() {
    var nP = particles.length;
    for (var iP = 0; iP < nP; ++iP) {
        var particle = particles[iP];
        if (particle.deleted) {
            continue;
        }
        circleRendererGlob.updateCircle(particle.shapeID, particle.pos.x, particle.pos.y);
    }
}
function physicsLoop() {
    simulate();
    updateParticlePositions();
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const canvas = document.createElement('canvas');
        canvas.width = SCREENW;
        canvas.height = SCREENH;
        document.body.appendChild(canvas);
        const gl = canvas.getContext('webgl');
        console.log(gl.getSupportedExtensions());
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.disable(gl.DEPTH_TEST);
        const circleRenderer = new CircleRenderer(gl);
        yield circleRenderer.initialize();
        circleRendererGlob = circleRenderer;
        if (location.hash.length > 0) {
            const args = location.hash.slice(1).split('&').map(s => s.split('=')).reduce((o, p) => (o[p[0]] = p[1], o), {});
            if (args['fill']) {
                const n = parseInt(args['fill']);
                for (let i = 0; i < n; ++i) {
                    let x = SCREENW * Math.random();
                    let y = SCREENH * Math.random();
                    putParticle(particles, x, y);
                }
                circleRenderer.flushCircles();
            }
        }
        function loop() {
            requestAnimationFrame(loop);
            physicsLoop();
            gl.clearColor(0, 0, 0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            circleRenderer.draw();
        }
        loop();
        canvas.addEventListener('touchstart', function (ev) {
            ev.preventDefault();
            const touch = ev.touches[0];
            const pos = Vec2.fromXY(touch.clientX, touch.clientY);
            mousePosition = pos;
            shouldProduce = true;
        });
        canvas.addEventListener('touchmove', function (ev) {
            const touch = ev.touches[0];
            const pos = Vec2.fromXY(touch.clientX, touch.clientY);
            mousePosition = pos;
        });
        canvas.addEventListener('contextmenu', function (ev) {
            ev.preventDefault();
        });
    });
}
