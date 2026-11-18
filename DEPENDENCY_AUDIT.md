# NutritionPro dependency audit

**Audit date:** 19 November 2026. **Branch:** `development/nutritionpro-foundation`.

## Remediation status

The initial full `npm audit` reported six findings (3 moderate, 1 high and 2 critical) in direct development tools Vite 5.4.21 / Vitest 2.1.9 and their test/build transitive graph. We updated the development toolchain to pinned Vite 6.4.6, Vitest 4.1.12 and `@vitejs/plugin-react` 5.2.0 using npm 11.6.3 with regular peer-dependency resolution; no `--force`, `--legacy-peer-deps` or ad hoc dependency override was used. The resolved graph is Vite 6.4.6, Vitest 4.1.12, `@vitest/mocker` 4.1.12 and esbuild 0.25.12. The old tinypool 1.1.1 and vite-node 2.1.9 paths are no longer present. Node 22.23.4 satisfies the selected package engine ranges, and the React plugin's peer range includes Vite 6.

Vite 6.4.4 had a separate `server.fs.deny` query bypass. The official advisory says 6.4.4 is affected and 6.4.5 is patched; this project pins Vite 6.4.6. [15]

## Remaining full-audit finding

The production-only audit `npm audit --omit=dev` reports **0 vulnerabilities**. Full `npm audit` reports **5 high-severity package paths** stemming from one advisory, GHSA-fc5q-39xc-vjpf: Picomatch ReDoS through single-branch repeated extglob patterns. The resolved `picomatch` is 4.0.7, also used by Vite/fdir/tinyglobby and Vitest. The official advisory currently lists affected `<=4.0.7` and **no patched release**. Registry checks show 4.0.7 as latest and 4.0.8/4.0.9 are not published. [16] [17]

The advisory concerns patterns supplied to Picomatch. It is in development/test tooling here, not a direct production dependency. Still, it must not be described as resolved or harmless without verifying how an affected path handles untrusted globs. We did not add an override to an unpublished, unverified version. Upstream picomatch pull request #194 is merged, but its author explicitly says it is **not** a security fix and does not generally resolve the ReDoS issue; it is not a basis to mark this advisory fixed. [18]

This means the **full** `npm audit` remains nonzero until the upstream publishes an official fix or an independently verified alternative dependency path removes the affected implementation. Production dependencies remain clean.

## Verification after toolchain upgrade

On 19 November 2026, `npm ci` completed with Node 22.23.4/npm 10.9.9; `npx tsc -b --pretty false` passed; `npm test` passed **81/81 tests across 17/17 files**; and `npm run build` passed under Vite 6.4.6. The build retains the known lazy-loaded ExcelJS chunk warning (940.19 kB minified / 271.33 kB gzip). `npm audit --omit=dev` returned zero vulnerabilities. Full `npm audit` returned five high-severity package paths, all from the single unpatched Picomatch advisory above. Current branch CI is pending the follow-up push.

## Original advisories

The initial six findings included Vitest mocker path traversal/manual-mock code injection, Vitest server handling, esbuild dev-server request exposure, tinypool prototype-pollution/RCE, and Vite/launch-editor issues. The affected packages and advisory URLs were captured at the time of audit. [1]–[14]

## Sources

[1]: https://github.com/advisories/GHSA-82fw-gwwq-j7x9 "Vitest @vitest/mocker path traversal advisory"
[2]: https://github.com/advisories/GHSA-qxg6-89mg-rqv8 "Vitest @vitest/mocker manual mock code-injection advisory"
[3]: https://github.com/advisories/GHSA-67mh-4wv8-2f99 "esbuild development server cross-origin request advisory"
[4]: https://github.com/advisories/GHSA-5gmw-xhrv-c9v3 "Tinypool prototype-pollution RCE advisory"
[5]: https://github.com/advisories/GHSA-85c8-ppgw-ccpr "Tinypool run options RCE advisory"
[6]: https://github.com/advisories/GHSA-5xrq-8626-4rwp "Vitest UI-server file-read and execution advisory"
[7]: https://github.com/vitejs/vite/security/advisories/GHSA-4w7w-66w2-5vf9 "Vite optimized-dependency path traversal advisory"
[8]: https://github.com/vitejs/vite/security/advisories/GHSA-v6wh-96g9-6wx3 "launch-editor NTLMv2 disclosure advisory"
[9]: https://github.com/vitejs/vite/security/advisories/GHSA-698v-4r3x-3vcv "launch-editor percent escaping advisory"
[10]: https://github.com/vitejs/vite/security/advisories/GHSA-r825-w8mm-5pxw "launch-editor command-argument advisory"
[11]: https://github.com/vitejs/vite/security/advisories/GHSA-587h-7wmj-h5pm "launch-editor file-existence check advisory"
[12]: https://github.com/vitejs/vite/security/advisories/GHSA-9jrq-w75r-8gcw "Vite custom-middleware cross-origin script advisory"
[13]: https://github.com/vitejs/vite/security/advisories/GHSA-rq7h-c2jc-7f22 "Vite filesystem allow-list advisory"
[14]: https://github.com/vitejs/vite/security/advisories/GHSA-fx2h-pf6j-xcff "Vite Windows alternate-path deny-list advisory"
[15]: https://github.com/vitejs/vite/security/advisories/GHSA-8g5g-mxqh-grgj "Vite 6.4.4 server.fs.deny query bypass"
[16]: https://github.com/advisories/GHSA-fc5q-39xc-vjpf "Picomatch repeated-extglob ReDoS advisory"
[17]: https://www.npmjs.com/package/picomatch?activeTab=versions "Picomatch npm package versions"
[18]: https://github.com/micromatch/picomatch/pull/194 "Picomatch upstream extglob parsing pull request"
