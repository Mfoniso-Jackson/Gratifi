# GratiFi

GratiFi lets customers thank the people who served them with a tip and a short note, by QR code or NFC tap, with no app. Tips are paid to the venue through Stripe and passed to staff through payroll, and every thank-you gets a private, permanent record that can be checked.

**Where it's going:** a global platform where frontline workers get paid, recognised and hired, starting in the UK and expanding to Ireland, the US and beyond. See [`docs/strategy`](docs/strategy/README.md) for the plan and the current stage.

The `platform/` app is built with Next.js 15, Supabase, Stripe (including Connect payouts to venues) and a Solidity contract on Base, with a Bitcoin backup through OpenTimestamps.

Core flow:

1. A customer scans a QR code or taps an NFC badge.
2. They pick or see the staff member to thank.
3. They choose a tip, add an optional note, and can choose to cover the card fee.
4. Stripe takes the payment on behalf of the venue and pays it to the venue's own account.
5. Supabase stores the tip; staff and managers see it and the note.
6. Once an hour, all new tips are recorded on Base as one Merkle root, with a Bitcoin backup.
7. Admins verify, retry, export, run payroll and handle refunds, disputes and data requests.

Start here:

- [`docs/strategy/README.md`](docs/strategy/README.md): direction, stages and principles
- [`platform/README.md`](platform/README.md)
- [`platform/docs/setup.md`](platform/docs/setup.md)
- [`platform/docs/architecture.md`](platform/docs/architecture.md)
- [`platform/docs/protocol.md`](platform/docs/protocol.md)
- [`platform/docs/launch-checklist.md`](platform/docs/launch-checklist.md)
- [`platform/docs/pilot-setup-guide.md`](platform/docs/pilot-setup-guide.md)

## Protocol Specification

Canonical protocol documentation lives in [`docs/protocol`](docs/protocol):

- [`protocol-spec-v1.md`](docs/protocol/protocol-spec-v1.md)
- [`recognition-event-schema.md`](docs/protocol/recognition-event-schema.md)
- [`hashing-standard.md`](docs/protocol/hashing-standard.md)
- [`moonbeam-contract-spec.md`](docs/protocol/moonbeam-contract-spec.md) (now the Base contract; old file name kept)
- [`api-spec-v1.md`](docs/protocol/api-spec-v1.md)
- [`privacy-and-governance.md`](docs/protocol/privacy-and-governance.md)
- [`future-token-readiness.md`](docs/protocol/future-token-readiness.md)
- [`developer-readme.md`](docs/protocol/developer-readme.md)

## License

MIT License. See [`LICENSE`](LICENSE).
