import { Bodies, Body, Engine, Events, Render, Runner, World } from 'matter-js';
import { FRUITS } from './fruits.ts';

const WINDOW_WIDTH = 600;
const WINDOW_HEIGHT = 400;
const WALL_THICKNESS = 20;
const TOP_LINE_Y = 100;

const engine = Engine.create();
const render = Render.create({
  engine,
  element: document.body,
  options: {
    background: '#fafafa',
    wireframes: false,
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
  },
});

const world = engine.world;
const leftWall = Bodies.rectangle(0, WINDOW_HEIGHT / 2, WALL_THICKNESS, WINDOW_HEIGHT, {
  isStatic: true,
  render: { fillStyle: 'yellow' },
});
const rightWall = Bodies.rectangle(WINDOW_WIDTH, WINDOW_HEIGHT / 2, WALL_THICKNESS, WINDOW_HEIGHT, {
  isStatic: true,
  render: { fillStyle: 'yellow' },
});
const bottomWall = Bodies.rectangle(WINDOW_WIDTH / 2, WINDOW_HEIGHT, WINDOW_WIDTH, WALL_THICKNESS, {
  isStatic: true,
  render: { fillStyle: 'yellow' },
});
const topLine = Bodies.rectangle(WINDOW_WIDTH / 2, TOP_LINE_Y, WINDOW_WIDTH, 2, {
  label: 'top',
  isStatic: true,
  render: { fillStyle: 'yellow' },
  isSensor: true,
});

World.add(world, [leftWall, rightWall, bottomWall, topLine]);

Render.run(render);
Runner.run(Runner.create(), engine);

let current: { body: Body; fruit: { label: string; radius: number; color: string } } | null = null;

function addFruit() {
  const index = Math.floor(Math.random() * 5);
  const fruit = FRUITS[index];

  const body = Bodies.circle(300, -70 + (FRUITS[FRUITS.length - 1].radius - fruit.radius), fruit.radius, {
    plugin: {
      index: index,
      createdAt: new Date().getTime(),
    },
    render: {
      sprite: {
        texture: `${fruit.label}.png`,
        xScale: 1,
        yScale: 1,
      },
    },
    restitution: 0.25,
    isSleeping: true,
  });

  World.add(world, body);

  current = { body, fruit };
}

let interval: number | null = null;
window.onkeyup = e => {
  if (!current) return;
  if (interval && (e.code === 'KeyA' || e.code === 'KeyD')) clearInterval(interval);
};
window.onkeydown = e => {
  if (!current) return;

  if (e.code === 'KeyA' && current.body.position.x - current.fruit.radius > WALL_THICKNESS) {
    if (interval) clearInterval(interval);
    interval = setInterval(() => {
      if (!current || current.body.position.x - current.fruit.radius < WALL_THICKNESS) {
        if (interval) clearInterval(interval);
        return;
      }
      Body.setPosition(current.body, {
        x: current.body.position.x - 2,
        y: current.body.position.y,
      });
    }, 10);
  } else if (e.code === 'KeyD' && current.body.position.x + current.fruit.radius < WINDOW_WIDTH - WALL_THICKNESS) {
    if (interval) clearInterval(interval);
    interval = setInterval(() => {
      if (!current || current.body.position.x + current.fruit.radius > WINDOW_WIDTH - WALL_THICKNESS) {
        if (interval) clearInterval(interval);
        return;
      }
      Body.setPosition(current.body, {
        x: current.body.position.x + 2,
        y: current.body.position.y,
      });
    }, 10);
  } else if (e.code === 'KeyS') {
    setTimeout(addFruit, 500);
    current.body.isSleeping = false;
    current = null;
  }
};

Events.on(engine, 'collisionStart', e => {
  e.pairs.forEach(collision => {
    const indexA = collision.bodyA.plugin?.index;
    const indexB = collision.bodyB.plugin?.index;

    // collision between fruits
    if (Number.isInteger(indexA) && Number.isInteger(indexB)) {
      // merge fruits
      if (FRUITS.length - 1 >= indexA && indexA === indexB) {
        const newFruit = FRUITS[indexA + 1];
        World.remove(world, [collision.bodyA, collision.bodyB]);
        World.add(
          world,
          Bodies.circle(collision.collision.supports[0].x, collision.collision.supports[0].y, newFruit.radius, {
            plugin: {
              index: indexA + 1,
            },
            render: {
              sprite: {
                texture: `${newFruit.label}.png`,
                xScale: 1,
                yScale: 1,
              },
            },
            restitution: 0.25,
            isSleeping: false,
          }),
        );
      } else {
        // check Game Over
        if (collision.bodyA.position.y - (collision.bodyA.circleRadius || 0) < TOP_LINE_Y || collision.bodyB.position.y - (collision.bodyB.circleRadius || 0) < TOP_LINE_Y) {
          console.log(collision.bodyA, collision.bodyB);
          alert('Game Over');
        }
      }
    }
  });
});

addFruit();
