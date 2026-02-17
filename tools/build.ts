/**
 * @file Script to build the JWK sets for both production and staging environments by reading
 *       individual JWK files from their respective directories and compiling them into a single
 *       JSON file for each environment in the dist directory.
 */

import { join } from "@std/path";
import JSONC from "tiny-jsonc";
import { isJWK, type JWK } from "./utils/jwk.ts";
import { nowAsNumericDate } from "./utils/mod.ts";

const BASE_DIR = join(import.meta.dirname!, "..");
const ENVIRONMENTS = ["production", "staging"] as const;

for (const env of ENVIRONMENTS) {
  const jwkSet: { keys: JWK[] } = { keys: [] };

  const inputDir = join(BASE_DIR, env);
  for await (const entry of Deno.readDir(inputDir)) {
    if (entry.isFile && /\.jwk(\.jsonc?)?$/i.test(entry.name)) {
      const str = await Deno.readTextFile(join(inputDir, entry.name));
      const jwk = JSONC.parse(str);
      if (!isJWK(jwk)) {
        console.error(`Invalid JWK in file: ${entry.name}`);
        continue;
      }

      const now = nowAsNumericDate();
      if (jwk.iat && jwk.iat > now) continue; // Skip keys that are not yet valid
      if (jwk.exp && jwk.exp < now) continue; // Skip expired keys

      jwkSet.keys.push(jwk);
    }
  }

  // Remove any extraneous properties from the JWKs to ensure a clean output
  jwkSet.keys = jwkSet.keys.map(({ kty, use, key_ops, alg, kid, crv, x, y }) => ({
    kty,
    use,
    key_ops,
    alg,
    kid,
    crv,
    x,
    y,
  }));

  await Deno.mkdir(join(BASE_DIR, "dist"), { recursive: true });

  await Deno.writeTextFile(join(BASE_DIR, "dist", `${env}.json`), JSON.stringify(jwkSet));
}
