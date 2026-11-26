# Guide Stitch — installation and capture acceptance

Status: **public source preview** at [anshuman-pandey/guide-stitch](https://github.com/anshuman-pandey/guide-stitch). Source publication is verified; real toolbar capture and Chrome Web Store distribution are not. The owner authorized continued completion and publication on 26 November 2026.

Open-source alternative to Scribe and Guidejar for manually capturing browser steps, editing instructions, redacting screenshots and exporting portable HTML or Markdown guides. Local extension storage; MIT licensed. No automatic click tracking or feature-parity claim.

## Passed

- 16 unit/worker tests, including capture failure, serialization, stale updates and permission errors.
- Real Chromium extension editor: guide creation, editing, solid redaction, reload persistence, HTML export and reopen, Markdown ZIP export and guide deletion.
- These editor checks use a synthetic screenshot; they do not prove activeTab permission or actual toolbar capture.

## Remaining acceptance gate: real toolbar capture

The managed browser rejected chrome://extensions/ under its URL security policy. Alternate surfaces/workarounds were explicitly prohibited. This is a test-environment blocker, not a verified application failure.

On your own Chrome:

1. Download the source ZIP from this repository’s **Code → Download ZIP**, or clone `https://github.com/anshuman-pandey/guide-stitch.git`. Extract the ZIP if needed. Open chrome://extensions, enable Developer mode, click Load unpacked and choose the extracted folder containing manifest.json. Pin Guide Stitch.
2. From that folder run `python3 -m http.server 5140 --bind 127.0.0.1`. Open `http://127.0.0.1:5140/acceptance/capture-fixture.html?private=synthetic#test`.
3. Click the actual extension toolbar icon. Create a guide named “Toolbar acceptance”, then click Capture this step. Confirm the popup says Step 1 captured.
4. Close the popup, click Complete example action on the page, reopen Guide Stitch from its toolbar icon and capture again. Confirm Step 2 captured.
5. Review & export. Confirm two different screenshots show the before/after states. Redact the entire red PRIVATE TEST FIELD, reload the editor, and confirm the redaction persists.
6. Export HTML and Markdown ZIP. Open the HTML with networking disabled; inspect both screenshots. Confirm the private field is covered and the query/fragment are absent. Extract the ZIP and open its Markdown and PNGs.
7. Optional shortcut test: focus the fixture page and press Alt+Shift+S. Confirm exactly one additional step or report the observed error. Toolbar success and shortcut success must be reported separately.

Record browser/OS version and results. Do not use private customer data in this check. Existing exports and original source pages are not erased by redaction.

## Current next action

Complete the real toolbar acceptance above in an environment that permits extension installation and record the results. The current managed browser policy blocks that check; do not bypass it or treat synthetic editor tests as capture acceptance.

The independent source repository already exists. No new repository creation or repeated source-push authorization is needed. After capture acceptance passes, review the tested head and remaining release gates before publishing an extension package. Broader naming review and external distribution remain pending; no Chrome Web Store approval is claimed.

See [current audit](docs/AUDIT.md) for dated CI evidence. Earlier validation receipts describe their original test scope and are not proof of toolbar capture.
