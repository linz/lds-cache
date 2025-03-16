const cfg = {
  ...require('@linzjs/style/.eslintrc.cjs'),
};

// Disable no floating promises in tests until https://github.com/nodejs/node/issues/51292 is solved
const testOverrides = cfg.overrides.find((ovr) => ovr.files.find((f) => f.includes('.test.ts')));
testOverrides.rules['@typescript-eslint/no-floating-promises'] = 'off';

const tsOverrides = cfg.overrides.find((ovr) => ovr.files.find((f) => f.endsWith('*.ts')));
// node23 needs "import type" when importing types
tsOverrides.rules['@typescript-eslint/consistent-type-imports'] = 'error';

module.exports = cfg;
