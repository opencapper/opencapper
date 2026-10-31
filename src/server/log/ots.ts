import { OTS_UPGRADE_HOSTS } from "@/server/constants";
import { createHash } from "node:crypto";

const OTS_MAGIC = Buffer.from(
  "004f70656e54696d657374616d7073000050726f6f6600bf89e2e884e89294",
  "hex",
);
const OTS_VERSION = 0x01;
export const OP_SHA256 = 0x08;
export const OP_APPEND = 0xf0;
const OP_PREPEND = 0xf1;
export const OTS_FORK = 0xff;
const ATTESTATION = 0x00;
const PENDING_TAG = Buffer.from("83dfe30d2ef90c8e", "hex");
const BITCOIN_TAG = Buffer.from("0588960d73d71901", "hex");
const UNARY_OPS: Record<number, string> = {
  0x02: "sha1",
  0x03: "ripemd160",
  [OP_SHA256]: "sha256",
};
const MAX_DEPTH = 256;
const CALENDAR_URI = /^https:\/\/[a-zA-Z0-9.-]+(:[0-9]+)?(\/[a-zA-Z0-9._-]*)*$/;

type Attestation = { kind: "attestation"; tag: Buffer; payload: Buffer };
type Op = { kind: "op"; op: number; arg: Buffer | null; child: OtsNode };
type OtsItem = Attestation | Op;
export type OtsNode = OtsItem[];

class Reader {
  private pos = 0;
  constructor(private readonly buf: Buffer) {}

  byte(): number {
    if (this.pos >= this.buf.length) throw new Error("ots: truncated");
    return this.buf[this.pos++];
  }

  bytes(n: number): Buffer {
    if (this.pos + n > this.buf.length) throw new Error("ots: truncated");
    const out = this.buf.subarray(this.pos, this.pos + n);
    this.pos += n;
    return out;
  }

  varuint(): number {
    let value = 0;
    let shift = 0;
    for (;;) {
      const b = this.byte();
      value += (b & 0x7f) * 2 ** shift;
      if (!(b & 0x80)) return value;
      shift += 7;
      if (shift > 49) throw new Error("ots: varuint too long");
    }
  }

  varbytes(): Buffer {
    return this.bytes(this.varuint());
  }

  done(): boolean {
    return this.pos === this.buf.length;
  }
}

function varuint(n: number): Buffer {
  const out: number[] = [];
  let value = n;
  do {
    let b = value % 128;
    value = Math.floor(value / 128);
    if (value > 0) b |= 0x80;
    out.push(b);
  } while (value > 0);
  return Buffer.from(out);
}

function varbytes(buf: Buffer): Buffer {
  return Buffer.concat([varuint(buf.length), buf]);
}

function readItem(r: Reader, tag: number, depth: number): OtsItem {
  if (tag === ATTESTATION)
    return { kind: "attestation", tag: r.bytes(8), payload: r.varbytes() };
  if (tag === OP_APPEND || tag === OP_PREPEND)
    return {
      kind: "op",
      op: tag,
      arg: r.varbytes(),
      child: readNode(r, depth + 1),
    };
  if (UNARY_OPS[tag])
    return { kind: "op", op: tag, arg: null, child: readNode(r, depth + 1) };
  throw new Error(`ots: unknown op 0x${tag.toString(16)}`);
}

function readNode(r: Reader, depth: number): OtsNode {
  if (depth > MAX_DEPTH) throw new Error("ots: too deep");
  const items: OtsNode = [];
  let tag = r.byte();
  while (tag === OTS_FORK) {
    items.push(readItem(r, r.byte(), depth));
    tag = r.byte();
  }
  items.push(readItem(r, tag, depth));
  return items;
}

function writeItem(item: OtsItem): Buffer {
  if (item.kind === "attestation")
    return Buffer.concat([
      Buffer.from([ATTESTATION]),
      item.tag,
      varbytes(item.payload),
    ]);
  return Buffer.concat([
    Buffer.from([item.op]),
    item.arg ? varbytes(item.arg) : Buffer.alloc(0),
    writeNode(item.child),
  ]);
}

function writeNode(node: OtsNode): Buffer {
  return Buffer.concat(
    node.map((item, i) =>
      i < node.length - 1
        ? Buffer.concat([Buffer.from([OTS_FORK]), writeItem(item)])
        : writeItem(item),
    ),
  );
}

function apply(op: Op, msg: Buffer): Buffer {
  if (op.op === OP_APPEND && op.arg) return Buffer.concat([msg, op.arg]);
  if (op.op === OP_PREPEND && op.arg) return Buffer.concat([op.arg, msg]);
  return createHash(UNARY_OPS[op.op]).update(msg).digest();
}

export type OtsProof = { digest: Buffer; root: OtsNode };

export function parseOts(file: Buffer): OtsProof {
  const r = new Reader(file);
  if (!r.bytes(OTS_MAGIC.length).equals(OTS_MAGIC))
    throw new Error("ots: bad magic");
  if (r.varuint() !== OTS_VERSION) throw new Error("ots: bad version");
  if (r.byte() !== OP_SHA256) throw new Error("ots: not a sha256 proof");
  const digest = r.bytes(32);
  const root = readNode(r, 0);
  if (!r.done()) throw new Error("ots: trailing bytes");
  return { digest, root };
}

export function otsHeader(digest: Buffer): Buffer {
  return Buffer.concat([
    OTS_MAGIC,
    Buffer.from([OTS_VERSION, OP_SHA256]),
    digest,
  ]);
}

export function serializeOts(proof: OtsProof): Buffer {
  return Buffer.concat([otsHeader(proof.digest), writeNode(proof.root)]);
}

export function parseTimestamp(body: Buffer): OtsNode {
  const r = new Reader(body);
  const node = readNode(r, 0);
  if (!r.done()) throw new Error("ots: trailing bytes");
  return node;
}

export type BitcoinAttestation = { height: number; merkleRoot: Buffer };

// merkleRoot is the message at the attestation, in the block header's internal byte order.
export function bitcoinAttestations(proof: OtsProof): BitcoinAttestation[] {
  const out: BitcoinAttestation[] = [];
  const walk = (node: OtsNode, msg: Buffer) => {
    for (const item of node) {
      if (item.kind === "op") walk(item.child, apply(item, msg));
      else if (item.tag.equals(BITCOIN_TAG))
        out.push({
          height: new Reader(item.payload).varuint(),
          merkleRoot: msg,
        });
    }
  };
  walk(proof.root, proof.digest);
  return out;
}

export function hasPending(proof: OtsProof): boolean {
  const walk = (node: OtsNode): boolean =>
    node.some((item) =>
      item.kind === "op" ? walk(item.child) : item.tag.equals(PENDING_TAG),
    );
  return walk(proof.root);
}

function pendingUri(att: Attestation): string | null {
  try {
    const uri = new Reader(att.payload).varbytes().toString("utf8");
    return CALENDAR_URI.test(uri) && OTS_UPGRADE_HOSTS.has(new URL(uri).host)
      ? uri
      : null;
  } catch {
    return null;
  }
}

type FetchUpgrade = (
  calendar: string,
  commitment: Buffer,
) => Promise<Buffer | null>;

// Swaps every pending attestation the calendar has committed to Bitcoin for the calendar's path.
export async function upgradeOts(
  proof: OtsProof,
  fetchUpgrade: FetchUpgrade,
): Promise<{ proof: OtsProof; changed: boolean }> {
  let changed = false;
  const walk = async (node: OtsNode, msg: Buffer): Promise<OtsNode> => {
    const next: OtsNode = [];
    for (const item of node) {
      if (item.kind === "op") {
        next.push({ ...item, child: await walk(item.child, apply(item, msg)) });
        continue;
      }
      const uri = item.tag.equals(PENDING_TAG) ? pendingUri(item) : null;
      const body = uri ? await fetchUpgrade(uri, msg) : null;
      const upgraded = body ? safeTimestamp(body) : null;
      if (
        upgraded &&
        bitcoinAttestations({ digest: msg, root: upgraded }).length > 0
      ) {
        next.push(...upgraded);
        changed = true;
      } else next.push(item);
    }
    return next;
  };
  const root = await walk(proof.root, proof.digest);
  return { proof: { digest: proof.digest, root }, changed };
}

function safeTimestamp(body: Buffer): OtsNode | null {
  try {
    return parseTimestamp(body);
  } catch {
    return null;
  }
}
