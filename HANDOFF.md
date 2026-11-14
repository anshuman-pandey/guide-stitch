# Guide Stitch — owner-controlled launch handoff

Status: prepared local candidate, **not release-approved**. Existing independent checkout retained; nothing pushed or released during this pass.

Open-source alternative to Scribe and Guidejar for manually capturing browser steps, editing instructions, redacting screenshots and exporting portable HTML or Markdown guides. Local extension storage; MIT licensed. No automatic click tracking or feature-parity claim.

## Passed

- 16 unit/worker tests, including capture failure, serialization, stale updates and permission errors.
- Real Chromium extension editor: guide creation, editing, solid redaction, reload persistence, HTML export and reopen, Markdown ZIP export and guide deletion.
- These editor checks use a synthetic screenshot; they do not prove activeTab permission or actual toolbar capture.

## Remaining acceptance gate: real toolbar capture

The managed browser rejected chrome://extensions/ under its URL security policy. Alternate surfaces/workarounds were explicitly prohibited. This is a test-environment blocker, not a verified application failure.

On your own Chrome:

1. Extract the provided ZIP. Open chrome://extensions, enable Developer mode, click Load unpacked and choose the extracted folder containing manifest.json. Pin Guide Stitch.
2. From that folder run `python3 -m http.server 5140 --bind 127.0.0.1`. Open `http://127.0.0.1:5140/acceptance/capture-fixture.html?private=synthetic#test`.
3. Click the actual extension toolbar icon. Create a guide named “Toolbar acceptance”, then click Capture this step. Confirm the popup says Step 1 captured.
4. Close the popup, click Complete example action on the page, reopen Guide Stitch from its toolbar icon and capture again. Confirm Step 2 captured.
5. Review & export. Confirm two different screenshots show the before/after states. Redact the entire red PRIVATE TEST FIELD, reload the editor, and confirm the redaction persists.
6. Export HTML and Markdown ZIP. Open the HTML with networking disabled; inspect both screenshots. Confirm the private field is covered and the query/fragment are absent. Extract the ZIP and open its Markdown and PNGs.
7. Optional shortcut test: focus the fixture page and press Alt+Shift+S. Confirm exactly one additional step or report the observed error. Toolbar success and shortcut success must be reported separately.

Record browser/OS version and results. Do not use private customer data in this check. Existing exports and original source pages are not erased by redaction.

## Repository form — submit only when you choose

[Prefilled Guide Stitch creation form](https://github.com/new?name=step-cabinet&description=Open-source%20alternative%20to%20Scribe%20and%20Guidejar%20for%20manual%20browser%20step-by-step%20guides.%20Capture%20screenshots%2C%20edit%20instructions%2C%20redact%2C%20and%20export%20HTML%20or%20Markdown.%20Local-first.%20MIT%20licensed.&visibility=public)

Owner: anshuman-pandey. Name: step-cabinet. Public. Leave README, license and gitignore initialization off because they are already included. Repository creation is not release approval.

Exact next action: complete the toolbar acceptance above and report its result. After it passes, create the empty repository when ready and separately authorize the Guide Stitch source push. CI, release publication and deployment remain subject to your product-specific go-ahead. Broader naming review and any store submission remain pending; no Chrome Web Store approval is claimed.
