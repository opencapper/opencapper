import { writeFile } from "node:fs/promises";
import openapiTS, { astToString, COMMENT_HEADER } from "openapi-typescript";

const base = process.env.OPENEV_API_URL ?? "http://127.0.0.1:8085";
const out = "src/lib/api/schema.d.ts";

type Operation = { operationId?: string };
type Spec = { paths?: Record<string, Record<string, Operation>> };

const spec: Spec = await (await fetch(`${base}/v1/openapi.json`)).json();

// utoipa names operations after the handler, so two handlers called `history` collide and
// openapi-typescript would type the second path with the first one's parameters and response.
const seen = new Set<string>();
for (const [path, methods] of Object.entries(spec.paths ?? {})) {
  for (const op of Object.values(methods)) {
    if (!op.operationId) continue;
    if (seen.has(op.operationId)) op.operationId = `${op.operationId}${path.replace(/[^a-z0-9]+/gi, "_")}`;
    seen.add(op.operationId);
  }
}

const ast = await openapiTS(JSON.stringify(spec));
await writeFile(out, `${COMMENT_HEADER}${astToString(ast)}`);
console.log(`${base}/v1/openapi.json -> ${out}`);
