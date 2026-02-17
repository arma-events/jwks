# jwks.arma.events

This repository manages the JSON Web Key (JWK) Set served at
[jwks.arma.events](https://jwks.arma.events). It is deployed automatically via GitHub Pages.

## Prerequisites

- [Deno](https://deno.com/) 2.6 or higher

## Usage

This project includes tools to manage JWKs efficiently.

### Generate a Key Pair

Use the `gen` task to create a new JWK key pair. The public key is automatically saved to the
repository (`production/` or `staging/`), and the private key is printed to your terminal.

```bash
deno task gen <key-name> [comment]
```

**Options:**

- `-p, --production`: Save key for the `production` environment (Default: `false`)
- `-s, --staging`: Save key for the `staging` environment (Default: `true`, unless `--production` is
  set)
- `-f, --force`: Force overwrite an existing key

**Example:**

```bash
# Generate a staging key
deno task gen my-service-key "Key for the microservice"

# Generate a production key
deno task gen -p production-key
```

> [!Warning]
> The private key is output to the console. **Store it securely.** Do not commit it to the
> repository.

### Build JWK Sets

The `build` task compiles individual key files into single JSON Web Key Sets (JWKS) for
distribution.

```bash
deno task build
```

This command:

1. reads keys from `production/` and `staging/`
2. verifies they are valid JWKs
3. generates `dist/production.json` and `dist/staging.json`

## Directory Structure

- `production/` - Public keys for the production environment.
- `staging/` - Public keys for the staging environment.
- `tools/` - Deno scripts for key generation and building.
- `dist/` - Generated output (served by GitHub Pages).

## Deployment

Changes to the `main` branch trigger a deployment to GitHub Pages, serving the contents of the
`dist/` directory.
