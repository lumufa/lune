// Patch child_process.spawnSync/spawn to add shell:true for Windows .cmd/.bat
// Node >=18.20.2 / >=20.12.1 / >=21.7.2 refuse to spawn .cmd/.bat without shell:true
// (CVE-2024-27980). The vendored Huawei hvigor-wrapper.js predates that fix and
// invokes pnpm.cmd without shell:true, so we monkey-patch spawnSync here.

'use strict';

if (process.platform !== 'win32') return;

const cp = require('child_process');

const needsShell = (command) =>
  typeof command === 'string' && /\.(cmd|bat)$/i.test(command);

const patch = (name) => {
  const original = cp[name];
  if (typeof original !== 'function') return;
  cp[name] = function patched(command, args, options) {
    if (needsShell(command)) {
      if (Array.isArray(args)) {
        options = options || {};
        if (!options.shell) {
          options = Object.assign({}, options, { shell: true });
        }
      } else if (args && typeof args === 'object' && !Array.isArray(args)) {
        // args is actually options
        if (!args.shell) {
          args = Object.assign({}, args, { shell: true });
        }
      }
    }
    return original.call(this, command, args, options);
  };
};

patch('spawn');
patch('spawnSync');
