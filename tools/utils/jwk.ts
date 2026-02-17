import { type Static, Type as T } from "typebox";
import { Compile } from "typebox/compile";

const JWK_SCHEMA = T.Object({
  kty: T.Literal("EC"),
  crv: T.Literal("P-384"),
  alg: T.Literal("ES384"),
  x: T.String(),
  y: T.String(),
  key_ops: T.Tuple([T.Literal("verify")]),
  use: T.Literal("sig"),
  kid: T.String(),
  iat: T.Optional(T.Number()),
  exp: T.Optional(T.Number()),
}, { additionalProperties: false });

export type JWK = Static<typeof JWK_SCHEMA>;

const VALIDATOR = Compile(JWK_SCHEMA);

export function isJWK(jwk: unknown): jwk is JWK {
  const valid = VALIDATOR.Check(jwk);

  if (valid) return valid;

  const errors = VALIDATOR.Errors(jwk);

  throw new AggregateError(errors, "Invalid JWK");
}
