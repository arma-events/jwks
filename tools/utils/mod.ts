export function logIfTerminal(...data: unknown[]) {
  if (!Deno.stdout.isTerminal()) return;

  console.log(...data);
}

export function warnIfTerminal(...data: unknown[]) {
  if (!Deno.stdout.isTerminal()) return;

  console.warn(...data);
}

export const nowAsNumericDate = () => Math.floor(Date.now() / 1000);
