# Security notes

- No telemetry, analytics, third-party JavaScript, or network service is used by the extension.
- The extension is intentionally limited to Google Search hosts.
- Administrator settings are read from `chrome.storage.managed` and are read-only to the extension.
- The extension signing key is security-sensitive. Do not commit it to GitHub or distribute it to managed clients.
- Review code changes before repacking a new CRX, and use the same signing key for every release.
