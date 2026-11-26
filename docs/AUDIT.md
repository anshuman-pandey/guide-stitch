# Audit checkpoint — 26 November 2026

Public source: https://github.com/anshuman-pandey/guide-stitch

Reviewed source head: `72b371f40ba1af8dc48d5ee24eafb5eb8ff2e6f1`. Latest recorded [CI run](https://github.com/anshuman-pandey/guide-stitch/actions/runs/43703025193) is success at this head.

Fresh local core check:

```text
✔ reject executable image URLs (3.357911ms)
✔ source excludes paths and tokens (0.409838ms)
✔ concurrent changes cannot overwrite newer revision (1.939162ms)
✔ move, delete and preserve original guide (1.119329ms)
✔ validate captions and movement boundaries (0.543216ms)
✔ HTML export escapes markup and never exports sources (0.826322ms)
✔ Markdown references portable images and escapes HTML (0.414075ms)
✔ zip headers and directory are present (21.479411ms)
✔ capture persists step and removes URL secrets (9.78919ms)
✔ simultaneous captures serialize without losing a step (0.519259ms)
✔ permission failure leaves stored guide unchanged (0.567707ms)
✔ wrong tab refuses capture (1.498877ms)
✔ stale editor cannot overwrite captured step (0.873098ms)
✔ guide delete clears active reference and images (2.45457ms)
✔ foreign sender rejected (0.256499ms)
✔ missing activeTab permission gives a useful recovery action (0.560734ms)
ℹ tests 16
ℹ suites 0
ℹ pass 16
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 144.767686
```

Releases: None returned by GitHub. No hosted demo URL was verified. A source archive or preview release is not a hosted deployment.

Remaining checks:

- Actual user-invoked toolbar/shortcut screenshot capture
- External distribution

This refresh corrects the publication checkpoint and preserves the earlier dated workflow results. It does not claim fresh browser, hardware or production security acceptance. Next: complete the listed acceptance checks and verify a persistent HTTPS deployment where required.
