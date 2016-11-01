const TAU = 2 * Math.PI;

class Vec2 {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x || 0;
        this.y = y || 0;
    }

    clone() {
        return new Vec2(this.x, this.y);
    }

    distanceTo(v: Vec2) {
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

    add(v: Vec2) {
        return this.clone().add_(v);
    }

    add_(v: Vec2) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    sub(v: Vec2) {
        return this.clone().sub_(v);
    }

    sub_(v: Vec2) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }

    smul(k: number) {
        return this.clone().smul_(k);
    }

    smul_(k: number) {
        this.x *= k;
        this.y *= k;
        return this;
    }

    sdiv(k: number) {
        return this.clone().sdiv_(k);
    }

    sdiv_(k: number) {
        this.x /= k;
        this.y /= k;
        return this;
    }

    static zero() {
        return Vec2.fromXY(0, 0);
    }

    static fromXY(x: number, y: number) {
        return new Vec2(x, y);
    }

    static fromRads(r: number) {
        return Vec2.fromXY(Math.cos(r), Math.sin(r));
    }

    static fromAngle(a: number) {
        return Vec2.fromRads(a / 360 * TAU);
    }
}

function uniformI(a: number, b: number) {
    return Math.floor(a + (b - a) * Math.random());
}

function uniformF(a: number, b: number) {
    return a + (b - a) * Math.random();
}

function randomHsla() {
    return randomHslaWithHue(uniformF(0, 1));
}

function randomHslaWithHue(hue: number) {
    return hslToGlColor(hue, 1, uniformF(0.20, 0.80));
}

function hslaToColor(hsla: number[]) {
    return `hsla(${hsla[0]}, ${hsla[1]}%, ${hsla[2]}%, ${hsla[3]})`;
}

function randomDirectionVec2() {
    return Vec2.fromRads(Math.random() * TAU);
}

// === ENTITIES

class Particle {
    deleted: boolean;
    active: boolean;
    trace: boolean;
    pos: Vec2;
    spd: Vec2;
    path: Vec2[];
    shapeID: number;

    constructor(pos: Vec2, spd: Vec2, trace: boolean, shapeID: number) {
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
    pos: Vec2;
    value: number;
    shapeID: number;

    constructor(pos: Vec2, value: number, shapeID: number) {
        this.pos = pos.clone();
        this.value = value;
        this.shapeID = shapeID;
    }
}

// === STATE

const SCREENW = document.body.clientWidth;
const SCREENH = document.body.clientHeight;

const FORCE_RADIUS = 10;

let particles: Particle[] = [];

let forces: Force[] = [];

let mousePositions: Vec2[] = [];

let mousePosition = Vec2.zero();

let mouseSpeed = Vec2.zero();

let shouldProduce = false;

let shiftPressed = false;

let controlPressed = false;

let altPressed = false;

let clickDown: number = null;

let friction = false;

let circleRendererGlob: CircleRenderer = null;

// === HELPERS

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
    } else if (clickDown === 2 && forces.length > 0) {
        if (controlPressed) {
            // wall
        } else {
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
            // particle generator
        } else {
            shouldProduce = true;
        }
    } else if (ev.button === 1) {
        const size = uniformI(2, 6);
        const color = randomHsla();
        const shapeID = circleRendererGlob.addCircle(pos.x, pos.y, size, color);
        particles.push(new Particle(pos, Vec2.zero(), true, shapeID));
        circleRendererGlob.flushCircles();
    } else if (ev.button === 2) {
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
    if (ev.keyCode === 16) { // shift
        shiftPressed = true;
    } else if (ev.keyCode === 17) { // control
        controlPressed = true;
    } else if (ev.keyCode === 18) { // alt
        altPressed = true;
    } else if (ev.keyCode === 32) { // space
        particles = [];
    } else if (ev.keyCode === 70) { // f
        friction = !friction;
    } else if (ev.keyCode === 68) { // d
        forces = forces.filter(f => f.pos.distanceTo(mousePosition) > FORCE_RADIUS);
    } else if (ev.keyCode === 72) { // h
        // toggle show forces
    } else if (ev.keyCode === 90) { // z
        forces = forces.slice(0, forces.length - 1);
    } else if (ev.keyCode === 86) { // v
        // toggle show particle speed vector
    }
});

window.addEventListener('keyup', function (ev) {
    if (ev.keyCode === 16) { // shift
        shiftPressed = false;
    } else if (ev.keyCode === 17) { // control
        controlPressed = false;
    } else if (ev.keyCode === 18) { // alt
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
}, 5000)

// === DRAWING

function applyGravity(sink, subject) {
    const dpos = sink.pos.sub(subject.pos);
    const dd = dpos.length();

    if (dd <= FORCE_RADIUS) {
        return;
    }

    const ir2 = Math.pow(dd, 2);

    const vel = dpos.sdiv(dd).smul(100 * sink.value / ir2);

    subject.spd.add_(vel);
}

function applyFriction(subject) {
    subject.spd.add_(subject.spd.smul(-0.05));
}

function drawVector(ctx, pos, vec, scale, color) {
    const vecS = pos.add(vec.smul(scale));
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(vecS.x, vecS.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2
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

        particle.pos.add_(particle.spd);

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

setInterval(physicsLoop, 20);

async function main() {

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
    await circleRenderer.initialize();

    circleRendererGlob = circleRenderer;
    
    function loop() {
        requestAnimationFrame(loop);

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
}
