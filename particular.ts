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
    shapeID: number;
    dynamicsID: number;

    constructor(shapeID: number, dynamicsID: number) {
        this.shapeID = shapeID;
        this.dynamicsID = dynamicsID;
    }

    distanceToVec2(v: Vec2) {
        return particleDynamics.getParticlePosVec2(this.dynamicsID).distanceTo(v);
    }
}

class Force {
    shapeID: number;
    dynamicsID: number;

    constructor(shapeID: number, dynamicsID: number) {
        this.shapeID = shapeID;
        this.dynamicsID = dynamicsID;
    }

    distanceToVec2(v: Vec2) {
        return particleDynamics.getParticlePosVec2(this.dynamicsID).distanceTo(v);
    }

    getValue() {
        return particleDynamics.getForceValue(this.dynamicsID);
    }
}

// === Particle Dynamics

class ParticleDynamics {
    static MAX_PARTICLES = 5000000;

    // struct particle { float x, y, dx, dy; };
    // struct force { float x, y, k; }

    particles: Float32Array;
    forces: Float32Array;

    particleCount: number;
    forceCount: number;

    constructor() {
        this.particles = new Float32Array(ParticleDynamics.MAX_PARTICLES);
        this.forces = new Float32Array(ParticleDynamics.MAX_PARTICLES);
        this.particleCount = 0;
        this.forceCount = 0;
    }

    addParticle(x: number, y: number, dx: number = 0, dy: number = 0) {
        const id = this.particleCount++;

        this.particles[id*4 + 0] = +x;
        this.particles[id*4 + 1] = +y;
        this.particles[id*4 + 2] = +dx;
        this.particles[id*4 + 3] = +dy;

        return id;
    }

    getParticlePosX(id: number) {
        return this.particles[id*4 + 0];
    }

    getParticlePosY(id: number) {
        return this.particles[id*4 + 1];
    }

    getParticlePosVec2(id: number) {
        let px = this.particles[id*4 + 0];
        let py = this.particles[id*4 + 1];
        return new Vec2(px, py);
    }

    clearParticleVelocities() {
        for (let id = 0; id < this.particleCount; ++id) {
            this.particles[id*4 + 2] = 0;
            this.particles[id*4 + 3] = 0;
        }
    }

    addForce(x: number, y: number, k: number) {
        const id = this.forceCount++;

        this.forces[id*3 + 0] = +x;
        this.forces[id*3 + 1] = +y;
        this.forces[id*3 + 2] = +k;

        return id;
    }

    getForceValue(id: number) {
        return this.forces[id*3 + 2];
    }

    applySpeed(id: number) {
        this.particles[id*4 + 0] += this.particles[id*4 + 2];
        this.particles[id*4 + 1] += this.particles[id*4 + 3];
    }

    applyGravity(pid: number, fid: number) {
        let fx = this.forces[fid*3 + 0];
        let fy = this.forces[fid*3 + 1];
        let px = this.particles[pid*4 + 0];
        let py = this.particles[pid*4 + 1];

        let dx = fx - px;
        let dy = fy - py;

        let dd = dx * dx + dy * dy;

        if (dd <= FORCE_RADIUS * FORCE_RADIUS) {
            return;
        }

        let k = this.forces[fid*3 + 2] / dd;

        let vx = dx * k;
        let vy = dy * k;

        this.particles[pid*4 + 2] += vx;
        this.particles[pid*4 + 3] += vy;
    }

    simulate(dt: number) {
        const nP = this.particleCount;
        const nF = this.forceCount;
        for (let iP = 0; iP < nP; ++iP) {

            this.applySpeed(iP);

            for (var iF = 0; iF < nF; ++iF) {
                const force = forces[iF];
                this.applyGravity(iP, iF);
            }
        }
    }
}

// === STATE

const SCREENW = document.body.clientWidth;
const SCREENH = document.body.clientHeight;

const FORCE_RADIUS = 10;

const particleDynamics = new ParticleDynamics();

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

let particleRendererGlob: ParticleRenderer = null;

// === HELPERS

function putParticle(bag: Particle[], x: number, y: number, dx: number = 0, dy: number = 0) {
    const size = uniformI(2, 6);
    const color = randomHsla();
    const shapeID = particleRendererGlob.addCircle(x, y, size, color);

    const dynID = particleDynamics.addParticle(x, y, dx, dy);

    bag.push(new Particle(shapeID, dynID));
}

function produceParticlesAtPos(bag: Particle[], pos: Vec2, n: number) {
    for (let i = 0; i < n; ++i) {
        const spd = randomDirectionVec2().smul_(5 * Math.random() + 5);
        putParticle(bag, pos.x, pos.y, spd.x, spd.y);
    }
    particleRendererGlob.flushCircles();
}

function updateMouseSpeed(pos: Vec2) {
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
    const pos = Vec2.fromXY(ev.clientX, ev.clientY);

    if (clickDown === 1 && particles.length > 0) {
        // tracer
    } else if (clickDown === 2 && forces.length > 0) {
        if (controlPressed) {
            // wall
        } else {
            const lastForce = forces[forces.length - 1];
            if (lastForce.distanceToVec2(pos) > 25) {
                const color = particleRendererGlob.getCircleColor(lastForce.shapeID);
                const shapeID = particleRendererGlob.addCircle(pos.x, pos.y, FORCE_RADIUS, color);
                const dynID = particleDynamics.addForce(pos.x, pos.y, lastForce.getValue())
                forces.push(new Force(shapeID, dynID));
                particleRendererGlob.flushCircles();
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
        // tracer
    } else if (ev.button === 2) {
        let forceValue = 10;
        let color = [1, 1, 1, 1];
        if (shiftPressed) {
            forceValue *= -1;
            color = [0, 0, 1, 1];
        }
        const shapeID = particleRendererGlob.addCircle(pos.x, pos.y, FORCE_RADIUS, color);
        const dynID = particleDynamics.addForce(pos.x, pos.y, forceValue)
        forces.push(new Force(shapeID, dynID));
        particleRendererGlob.flushCircles();
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
    if (ev.keyCode === 16) { // shift
        shiftPressed = true;
    } else if (ev.keyCode === 17) { // control
        controlPressed = true;
    } else if (ev.keyCode === 18) { // alt
        altPressed = true;
    } else if (ev.keyCode === 32) { // space
        for (let p of particles) {
            particleDynamics.clearParticleVelocities();
        }
    } else if (ev.keyCode === 70) { // f
        friction = !friction;
    } else if (ev.keyCode === 68) { // d
        forces = forces.filter(f => f.distanceToVec2(mousePosition) > FORCE_RADIUS);
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

// === PHYSICS

function updateParticlePositions() {
    particleRendererGlob.updateCircles(particleDynamics.particles);
}

function physicsLoop() {
    particleDynamics.simulate(0);
    updateParticlePositions();
}

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

    const args =
        location.hash.slice(1)
        .split('&')
        .filter(s => s)
        .map(s => s.split('='))
        .reduce((o, [k, v]) => (o[k] = v, o), {});

    const renderer = args['renderer'] || 'circle';

    let particleRenderer: ParticleRenderer;
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

    await particleRenderer.initialize();

    particleRendererGlob = particleRenderer;

    if (args['fill']) {
        const n = parseInt(args['fill']);
        for (let i = 0; i < n; ++i) {
            let x = SCREENW * Math.random();
            let y = SCREENH * Math.random();
            putParticle(particles, x, y);
        }
        particleRenderer.flushCircles();
    }
    
    function loop() {
        requestAnimationFrame(loop);

        physicsLoop();

        gl.clearColor(0, 0, 0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        particleRenderer.draw();
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

    window.addEventListener('touchend', function (ev) {
        shouldProduce = false;
    });
}
