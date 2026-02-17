/**
 * @file Script to generate a new JWK key pair and save the public key in the appropriate
 *       environment directory. The private key is printed to the console and should be
 *       securely stored by the user.
 */

import { parseArgs } from "@std/cli";
import { join } from "@std/path";
import { logIfTerminal, nowAsNumericDate, warnIfTerminal } from "./utils/mod.ts";

const flags = parseArgs(Deno.args, {
  boolean: ["help", "production", "staging", "force"],
  alias: {
    h: "help",
    p: "production",
    s: "staging",
    f: "force",
  },
  default: { production: false, staging: true, force: false },
  stopEarly: true,
});

const name = flags._[0]?.toString();

if (flags.help || !name) {
  const programName = "deno run gen";
  console.log(`
      usage: ${programName} [options] <name> [...<comment>]
      --help               Show Help
      -p, --production     Save key for production environment (Default: false)
      -s, --staging        Save key for staging environment (Default: true, if --production is not set)
      -f, --force          Force overwrite existing key
    `);
  Deno.exit(1);
}

let dir: string;
if (flags.production) dir = "production";
else if (flags.staging) dir = "staging";
else {
  console.error("Please specify either --production or --staging");
  Deno.exit(1);
}

const path = join(import.meta.dirname!, "..", dir, `${name}.jwk.jsonc`);

try {
  await Deno.lstat(path);

  if (flags.force) {
    warnIfTerminal(
      `%cWarning: %cOverwriting existing JWK with name %c${name} %c(--force is set)`,
      "color: yellow; font-weight: bold",
      "",
      "color: blue;  font-weight: bold; font-style: italic;",
      "\n",
    );
  } else {
    console.error(
      `%cError: %cJWK with name %c${name} %calready exists. Use --force to overwrite!`,
      "color: red; font-weight: bold;",
      "",
      "color: blue;  font-weight: bold; font-style: italic;",
      "",
    );
    Deno.exit(1);
  }
} catch (err) {
  if (!(err instanceof Deno.errors.NotFound)) throw err;
}

const ALGORITHM = { name: "ECDSA", namedCurve: "P-384" } as const satisfies EcKeyGenParams;

const { privateKey, publicKey } = await crypto.subtle.generateKey(ALGORITHM, true, [
  "sign",
  "verify",
]);

const iat = nowAsNumericDate();
const kid = crypto.randomUUID().substring(0, 4) + "_" + iat;

const jwkPublic = await crypto.subtle.exportKey("jwk", publicKey);
jwkPublic.use = "sig";
jwkPublic.ext = undefined;
const jwkPrivate = await crypto.subtle.exportKey("jwk", privateKey);
jwkPrivate.use = "sig";
jwkPrivate.ext = undefined;

const jwkPrivateStr = JSON.stringify({ ...jwkPrivate, kid }, undefined);

logIfTerminal("%cPrivate Key:", "text-decoration: underline; font-weight: bold;");
console.log(jwkPrivateStr);
logIfTerminal("%cDO NOT SHARE WITH ANYONE!!", "color: red; font-weight: bold; font-style: italic;");

const comment = flags._.slice(1).join(" ") ?? "";
const prefix = comment ? `// ${comment}\n` : "";

const jwkPublicStr = prefix + JSON.stringify({ ...jwkPublic, kid, iat }, undefined, 2) + "\n";

await Deno.writeTextFile(path, jwkPublicStr);
