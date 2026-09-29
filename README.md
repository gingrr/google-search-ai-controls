# Google Search AI Controls

A small, managed Manifest V3 Chrome extension that provides two independent administrator-controlled features:

- **Hide Google AI Overviews** in standard Google Search.
- **Block Google AI Mode** by hiding AI Mode entry points and redirecting AI Mode URLs back to ordinary Google Search.

There is no user-facing popup or settings UI. A common use case is managed school ChromeOS environments, but the extension is generic and can be used by any managed Chrome organization.

## Privacy and scope

The extension has no analytics, telemetry, remote scripts, external libraries, accounts, or backend service. It runs only on `google.com` / `www.google.com` and requests only the Chrome permissions needed to read managed policy and perform local redirects.

It does not request browsing history, cookie, identity, clipboard, download, native messaging, tab-capture, or all-sites permissions.

## Managed policy

Both features default to `true` if no managed policy is supplied.

Recommended managed policy:

```json
{
  "hideAIOverview": true,
  "blockAIMode": true
}
```

Other combinations are supported:

```json
{
  "hideAIOverview": true,
  "blockAIMode": false
}
```

```json
{
  "hideAIOverview": false,
  "blockAIMode": true
}
```

```json
{
  "hideAIOverview": false,
  "blockAIMode": false
}
```

## Repository layout

```text
.
├── extension/                 Extension source loaded/packed by Chrome
├── docs/                      GitHub Pages distribution directory
│   ├── google-search-ai-controls.crx
│   ├── updates.xml
│   ├── extension-id.txt
│   └── index.html
├── scripts/
│   ├── configure-github-pages.sh
│   ├── extension-id.py
│   └── pack-extension.sh
├── .gitignore
└── README.md
```

The private `.pem` signing key must **never** be committed to the repository.

## Quick local test

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the `extension/` folder.
5. Test a normal Google Search, a search that normally produces an AI Overview, and a URL such as `https://www.google.com/search?q=test&udm=50`.

When loaded unpacked without an enterprise policy, both controls are enabled by default.

## GitHub Pages self-hosting

### 1. Keep the signing key private

The distribution package includes a separate `KEEP_PRIVATE` directory containing the signing key used for the initial CRX. Store that key securely and do not upload it to GitHub.

All future CRX releases must use the same signing key or Chrome will assign a different extension ID.

### 2. Create a GitHub repository

Create a repository, for example:

```text
google-search-ai-controls
```

Upload the **contents of this `github-repo/` directory** to that repository.

### 3. Enable GitHub Pages

In GitHub:

**Repository > Settings > Pages > Deploy from a branch**

Choose:

- Branch: `main`
- Folder: `/docs`

Your base URL will normally be:

```text
https://YOUR-ORG-OR-USERNAME.github.io/google-search-ai-controls
```

### 4. Configure `updates.xml`

Run:

```sh
./scripts/configure-github-pages.sh \
  https://YOUR-ORG-OR-USERNAME.github.io/google-search-ai-controls \
  "$(cat docs/extension-id.txt)"
```

Commit the resulting `docs/updates.xml`, `docs/extension-id.txt`, and `docs/pages-base-url.txt`.

The Google Admin custom URL will then be:

```text
https://YOUR-ORG-OR-USERNAME.github.io/google-search-ai-controls/updates.xml
```

### 5. Google Admin deployment

Go to:

**Devices > Chrome > Apps & extensions > Users & browsers**

Select the target OU/group, then:

1. **Add > Add Chrome app or extension by ID**.
2. Enter the value from `docs/extension-id.txt`.
3. Choose **From a custom URL**.
4. Enter the GitHub Pages `updates.xml` URL.
5. Set **Installation policy** to **Force install**.
6. If Google Admin offers an **Update URL** choice for the self-hosted extension, choose **Installation URL** so subsequent update checks continue using this same `updates.xml` endpoint.
7. In **Policy for extensions**, enter the desired JSON, for example:

```json
{
  "hideAIOverview": true,
  "blockAIMode": true
}
```

### 6. Verify on a test Chromebook

Open:

```text
chrome://policy
```

Reload policies and verify the extension policy. Also check `chrome://extensions` for the installed extension and confirm normal Search, AI Overview, and AI Mode behavior.

## Releasing an update

1. Edit the extension source.
2. Increase `version` in `extension/manifest.json`, for example `1.0.0` -> `1.0.1`.
3. Repack using the **same** private signing key:

```sh
./scripts/pack-extension.sh /secure/path/google-search-ai-controls.pem
```

4. Re-run `configure-github-pages.sh` so `updates.xml` contains the new version.
5. Commit/push the updated CRX, source, and XML.

The extension ID must remain unchanged.

## Hosting compatibility note

Chrome self-hosted extensions require an HTTPS update manifest and a signed `.crx`. The web host must also serve the `.crx` in a way Chrome accepts. If managed installation fails even though `updates.xml` is reachable, inspect the `.crx` HTTP response headers. Chrome documentation identifies CRX content type / `nosniff` behavior as a common self-hosting failure point. In that case, keep the source repository on GitHub but host the `.crx` and/or update manifest on an HTTPS server where you control MIME headers.

## What `blockAIMode` does

When enabled, the extension:

1. Hides links/buttons that point to Google AI Mode.
2. Redirects `www.google.com/search?...&udm=50...` to the equivalent ordinary Search URL with the `udm` parameter removed.
3. Redirects `google.com/ai` and `www.google.com/ai` to ordinary Google Search.

It intentionally does **not** force `udm=14`; standard Google Search remains standard Google Search.

## Maintenance

Google changes Search markup periodically. Re-test the AI Overview hiding behavior after major Google Search UI changes. The AI Mode URL protection separately targets the current `udm=50` and `/ai` routes so that it does not depend only on page markup.

## License

This project is licensed under the [MIT License](LICENSE).
