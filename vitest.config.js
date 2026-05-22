import { defineConfig, configDefaults } from 'vitest/config';

// vendor/soleat is the read-only ang-kl/gia submodule (§8.1 bridge, ADR-003).
// Soleat ships its own Telegram/Anthropic test suite that must never run in
// Gia-WA's preflight, so exclude the whole vendored tree.
export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, 'vendor/**'],
  },
});
