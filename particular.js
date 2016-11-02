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
        this.posX = pos.x;
        this.posY = pos.y;
        this.velX = spd.x;
        this.velY = spd.y;
        this.shapeID = shapeID;
    }
    distanceToVec2(v) {
        let dx = this.posX - v.x;
        let dy = this.posY - v.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    getPos() {
        return new Vec2(this.posX, this.posY);
    }
}
class Force {
    constructor(pos, value, shapeID) {
        this.posX = pos.x;
        this.posY = pos.y;
        this.value = value;
        this.shapeID = shapeID;
    }
    distanceToVec2(v) {
        let dx = this.posX - v.x;
        let dy = this.posY - v.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}
// === STATE
const SCREENW = document.body.clientWidth;
const SCREENH = document.body.clientHeight;
const WORLD_SCALE = 1;
const WORLDW = SCREENW * WORLD_SCALE;
const WORLDH = SCREENH * WORLD_SCALE;
const FORCE_RADIUS = 10 * WORLD_SCALE;
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
let particleRendererGlob = null;
// === HELPERS
function addParticle(x, y, size, color) {
    return particleRendererGlob.addParticle(x / WORLD_SCALE, y / WORLD_SCALE, size / WORLD_SCALE, color);
}
function putParticle(bag, x, y) {
    const size = uniformI(2, 6) * WORLD_SCALE;
    const color = randomHsla();
    const shapeID = addParticle(x, y, size, color);
    bag.push(new Particle(new Vec2(x, y), Vec2.zero(), false, shapeID));
}
function produceParticlesAtPos(bag, pos, n) {
    for (let i = 0; i < n; ++i) {
        const spd = randomDirectionVec2().smul_(uniformF(5, 10));
        const size = uniformI(2, 6) * WORLD_SCALE;
        const color = randomHsla();
        const shapeID = addParticle(pos.x, pos.y, size, color);
        bag.push(new Particle(pos, spd, false, shapeID));
    }
    particleRendererGlob.flushColors();
}
function updateMouseSpeed(pos) {
    mousePositions.push(pos);
    if (mousePositions.length === 11) {
        mousePositions.shift();
    }
    const n = mousePositions.length;
    let spd = Vec2.zero();
    for (let i = 1; i < n; ++i) {
        spd.add_(mousePositions[i]);
        spd.sub_(mousePositions[i - 1]);
    }
    spd.sdiv_(n);
    mouseSpeed = spd;
}
// === EVENTS
window.addEventListener('mousemove', function (ev) {
    const pos = Vec2.fromXY(ev.clientX, ev.clientY).smul(WORLD_SCALE);
    if (clickDown === 1 && particles.length > 0) {
        const lastParticle = particles[particles.length - 1];
        if (pos.distanceTo(lastParticle.getPos()) > 25 * WORLD_SCALE) {
            const size = uniformI(2, 6) * WORLD_SCALE;
            const color = particleRendererGlob.getParticleColor(lastParticle.shapeID);
            const shapeID = addParticle(pos.x, pos.y, size, color);
            particles.push(new Particle(pos, Vec2.zero(), true, shapeID));
            particleRendererGlob.flushColors();
        }
    }
    else if (clickDown === 2 && forces.length > 0) {
        if (controlPressed) {
        }
        else {
            const lastForce = forces[forces.length - 1];
            if (lastForce.distanceToVec2(pos) > 25 * WORLD_SCALE) {
                const color = particleRendererGlob.getParticleColor(lastForce.shapeID);
                const shapeID = addParticle(pos.x, pos.y, FORCE_RADIUS, color);
                forces.push(new Force(pos, lastForce.value, shapeID));
                particleRendererGlob.flushColors();
            }
        }
    }
    mousePosition = pos;
});
window.addEventListener('mousedown', function (ev) {
    const pos = Vec2.fromXY(ev.clientX, ev.clientY).smul(WORLD_SCALE);
    if (ev.button === 0) {
        if (shiftPressed) {
        }
        else {
            shouldProduce = true;
        }
    }
    else if (ev.button === 1) {
        const size = uniformI(2, 6) * WORLD_SCALE;
        const color = randomHsla();
        const shapeID = addParticle(pos.x, pos.y, size, color);
        particles.push(new Particle(pos, Vec2.zero(), true, shapeID));
        particleRendererGlob.flushColors();
    }
    else if (ev.button === 2) {
        let forceValue = 10;
        let color = [1, 1, 1, 1];
        if (shiftPressed) {
            forceValue *= -1;
            color = [0, 0, 1, 1];
        }
        const shapeID = addParticle(pos.x, pos.y, FORCE_RADIUS, color);
        forces.push(new Force(pos, forceValue, shapeID));
        particleRendererGlob.flushColors();
    }
    clickDown = ev.button;
});
window.addEventListener('mouseup', function (ev) {
    if (ev.button === 0) {
        shouldProduce = false;
    }
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
        forces = forces.filter(f => f.distanceToVec2(mousePosition) > FORCE_RADIUS);
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
// === PHYSICS
function computeForceAcceleration(force, posX, posY, velX, velY, outDV) {
    let fx = force.posX;
    let fy = force.posY;
    let sx = posX;
    let sy = posY;
    let dx = fx - sx;
    let dy = fy - sy;
    let dd = Math.sqrt(dx * dx + dy * dy);
    if (dd <= FORCE_RADIUS) {
        return;
    }
    let k = force.value / (dd * dd * dd);
    // let dd = dx * dx + dy * dy;
    // if (dd <= FORCE_RADIUS * FORCE_RADIUS) {
    //     return;
    // }
    // let k = force.value / dd;
    let vx = dx * k;
    let vy = dy * k;
    outDV.x += vx;
    outDV.y += vy;
}
function computeFrictionAcceleration(posX, posY, velX, velY, outDV) {
    outDV.x -= velX * 0.01;
    outDV.y -= velY * 0.01;
}
function computeAcceleration(posX, posY, velX, velY, outDV) {
    var nF = forces.length;
    for (var iF = 0; iF < nF; ++iF) {
        computeForceAcceleration(forces[iF], posX, posY, velX, velY, outDV);
    }
}
function evaluate(particle, t, dt, dx, dv, outDX, outDV) {
    let posX = particle.posX + dx.x * dt;
    let posY = particle.posY + dx.y * dt;
    let velX = particle.velX + dv.x * dt;
    let velY = particle.velY + dv.y * dt;
    outDX.x = velX;
    outDX.y = velY;
    computeAcceleration(posX, posY, velX, velY, outDV);
}
function integrate(particle, t, dt) {
    let dxA = new Vec2(0, 0);
    let dvA = new Vec2(0, 0);
    let dxB = new Vec2(0, 0);
    let dvB = new Vec2(0, 0);
    let dxC = new Vec2(0, 0);
    let dvC = new Vec2(0, 0);
    let dxD = new Vec2(0, 0);
    let dvD = new Vec2(0, 0);
    evaluate(particle, t, 0, new Vec2(0, 0), new Vec2(0, 0), dxA, dvA);
    evaluate(particle, t, dt * 0.5, dxA, dvA, dxB, dvB);
    evaluate(particle, t, dt * 0.5, dxB, dvB, dxC, dvC);
    evaluate(particle, t, dt, dxC, dvC, dxD, dvD);
    let dxdtX = 1.0 / 6.0 * (dxA.x + 2.0 * (dxB.x + dxC.x) + dxD.x);
    let dxdtY = 1.0 / 6.0 * (dxA.y + 2.0 * (dxB.y + dxC.y) + dxD.y);
    let dvdtX = 1.0 / 6.0 * (dvA.x + 2.0 * (dvB.x + dvC.x) + dvD.x);
    let dvdtY = 1.0 / 6.0 * (dvA.y + 2.0 * (dvB.y + dvC.y) + dvD.y);
    particle.posX += dxdtX * dt;
    particle.posY += dxdtY * dt;
    particle.velX += dvdtX * dt;
    particle.velY += dvdtY * dt;
}
function simulate(t, dt) {
    var nP = particles.length;
    for (var iP = 0; iP < nP; ++iP) {
        var particle = particles[iP];
        integrate(particle, t, dt);
    }
}
function updateParticlePositions() {
    const nP = particles.length;
    for (let iP = 0; iP < nP; ++iP) {
        const particle = particles[iP];
        particleRendererGlob.updateParticlePos(particle.shapeID, particle.posX / WORLD_SCALE, particle.posY / WORLD_SCALE);
    }
}
function physicsLoop(t, dt) {
    simulate(t, dt);
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
        const args = location.hash.slice(1)
            .split('&')
            .filter(s => s)
            .map(s => s.split('='))
            .reduce((o, [k, v]) => (o[k] = v, o), {});
        const renderer = args['renderer'] || 'circle';
        let particleRenderer;
        switch (renderer) {
            case 'circle':
                particleRenderer = new CircleRenderer(gl);
                break;
            case 'point':
                particleRenderer = new PointRenderer(gl);
                break;
            default:
                alert('no such renderer!');
                throw new Error();
        }
        yield particleRenderer.initialize();
        particleRendererGlob = particleRenderer;
        if (args['fill']) {
            const n = parseInt(args['fill']);
            for (let i = 0; i < n; ++i) {
                let x = SCREENW * Math.random() * WORLD_SCALE;
                let y = SCREENH * Math.random() * WORLD_SCALE;
                putParticle(particles, x, y);
            }
            particleRenderer.flushColors();
        }
        let lastT = performance.now();
        function loop(t) {
            requestAnimationFrame(loop);
            let dt = t - lastT;
            physicsLoop(t, dt);
            gl.clearColor(0, 0, 0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            particleRenderer.render();
            lastT = t;
        }
        loop(lastT);
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
        window.addEventListener('touchend', function (ev) {
            shouldProduce = false;
        });
    });
}
