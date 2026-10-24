import { cn } from "@/lib/utils";
import { useId } from "react";

type Point = readonly [number, number];
type Ring = readonly Point[];

const DEPTH: Point = [-15, 12.5];

const O_RINGS: readonly Ring[] = [
  [
    [0, 0],
    [92, 0],
    [92, 112],
    [0, 112],
  ],
  [
    [28, 28],
    [64, 28],
    [64, 84],
    [28, 84],
  ],
];

const C_RINGS: readonly Ring[] = [
  [
    [0, 0],
    [92, 0],
    [92, 28],
    [28, 28],
    [28, 84],
    [92, 84],
    [92, 112],
    [0, 112],
  ],
];

const FACE = "color-mix(in oklab, currentColor 30%, var(--background))";
const WALL_H = "color-mix(in oklab, currentColor 17%, var(--background))";
const WALL_V = "color-mix(in oklab, currentColor 8%, var(--background))";

function isInside(rings: readonly Ring[], x: number, y: number): boolean {
  let inside = false;
  for (const ring of rings) {
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i];
      const b = ring[(i + 1) % ring.length];
      if (!a || !b) continue;
      if (
        a[1] > y !== b[1] > y &&
        x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]
      ) {
        inside = !inside;
      }
    }
  }
  return inside;
}

type Wall = { d: string; fill: string; facing: boolean };

// Walls facing away from the viewer paint first so the visible ones win where they overlap.
function walls(rings: readonly Ring[]): Wall[] {
  const out: Wall[] = [];
  for (const ring of rings) {
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i];
      const b = ring[(i + 1) % ring.length];
      if (!a || !b) continue;
      const ex = b[0] - a[0];
      const ey = b[1] - a[1];
      const len = Math.hypot(ex, ey);
      let nx = ey / len;
      let ny = -ex / len;
      if (
        isInside(rings, (a[0] + b[0]) / 2 + nx / 2, (a[1] + b[1]) / 2 + ny / 2)
      ) {
        nx = -nx;
        ny = -ny;
      }
      out.push({
        d: `M${a[0]} ${a[1]}L${b[0]} ${b[1]}L${b[0] + DEPTH[0]} ${b[1] + DEPTH[1]}L${a[0] + DEPTH[0]} ${a[1] + DEPTH[1]}Z`,
        fill: ey === 0 ? WALL_H : WALL_V,
        facing: nx * DEPTH[0] + ny * DEPTH[1] > 0,
      });
    }
  }
  return out.toSorted((x, y) => Number(x.facing) - Number(y.facing));
}

function facePath(rings: readonly Ring[]): string {
  return rings
    .map((ring) => `M${ring.map((p) => `${p[0]} ${p[1]}`).join("L")}Z`)
    .join("");
}

const O_WALLS = walls(O_RINGS);
const C_WALLS = walls(C_RINGS);
const O_FACE = facePath(O_RINGS);
const C_FACE = facePath(C_RINGS);

function Block(props: { walls: Wall[]; face: string; grain: string }) {
  return (
    <g filter={`url(#${props.grain})`}>
      {props.walls.map((wall) => (
        <path key={wall.d} d={wall.d} style={{ fill: wall.fill }} />
      ))}
      <path d={props.face} fillRule="evenodd" style={{ fill: FACE }} />
    </g>
  );
}

export function CapperMark(props: { className?: string }) {
  const grain = `${useId().replace(/:/g, "")}-grain`;

  return (
    <svg
      aria-hidden
      viewBox="-50 -30 300 220"
      className={cn("text-primary group select-none", props.className)}
    >
      <defs>
        <filter id={grain} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="3.2"
            numOctaves="1"
            seed="7"
            result="noise"
          />
          <feColorMatrix
            in="noise"
            type="matrix"
            values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0.55 0 0 0 -0.27"
            result="speckle"
          />
          <feComposite
            in="speckle"
            in2="SourceGraphic"
            operator="in"
            result="grain"
          />
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="grain" />
          </feMerge>
        </filter>
      </defs>
      <g transform="rotate(-9 110 80)">
        <g transform="translate(10 4)">
          <g className="animate-mark-left transition-transform duration-300 ease-out [transform-box:fill-box] group-hover:-translate-x-3 group-hover:-rotate-5">
            <Block walls={O_WALLS} face={O_FACE} grain={grain} />
          </g>
        </g>
        <g transform="translate(120 18)">
          <g className="animate-mark-right transition-transform duration-300 ease-out [transform-box:fill-box] group-hover:translate-x-3 group-hover:rotate-5">
            <Block walls={C_WALLS} face={C_FACE} grain={grain} />
          </g>
        </g>
      </g>
    </svg>
  );
}
