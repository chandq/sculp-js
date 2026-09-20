# Security Policy

## Supported Versions

Security fixes are applied to the latest published release and the `main` branch. Older releases are not actively supported. Users should upgrade to the latest version before reporting an issue that may already have been fixed.

| Version        | Supported        |
| -------------- | ---------------- |
| Latest release | Yes              |
| `main` branch  | Yes, pre-release |
| Older releases | No               |

## Reporting a Vulnerability

Please do not disclose a suspected vulnerability in a public issue, discussion, pull request, or social media post.

Use [GitHub private vulnerability reporting](https://github.com/chandq/sculp-js/security/advisories/new) to submit a report. If that channel is unavailable, contact the maintainer privately using the contact methods listed on the [maintainer's GitHub profile](https://github.com/chandq).

Include as much of the following information as possible:

- The affected version, module, and environment
- A clear description of the vulnerability and its potential impact
- Reproduction steps or a minimal proof of concept
- Any known mitigations or workarounds
- Whether the issue has been disclosed elsewhere
- A safe way to contact you for follow-up

Do not include real credentials, personal data, access tokens, or other secrets in the report or proof of concept.

## What to Expect

- The maintainer aims to acknowledge a complete report within 7 days.
- The report will be validated and its severity and affected versions assessed.
- The reporter will receive status updates when material progress is made, normally at least every 14 days while the issue remains open.
- When a fix is ready, the project may coordinate a release and disclosure date with the reporter.

Response and remediation times depend on severity and complexity. Please allow a reasonable remediation period before public disclosure.

## Coordinated Disclosure

After a fix is available, the project may publish a GitHub security advisory describing the impact, affected versions, remediation, and reporter credit. Credit will be given only with the reporter's consent.

The project does not currently operate a paid bug bounty program.

## Security Update Guidance

Install releases only from the official [npm package](https://www.npmjs.com/package/sculp-js) or this repository's [GitHub releases](https://github.com/chandq/sculp-js/releases). Review release notes and keep sculp-js and its development toolchain up to date.
