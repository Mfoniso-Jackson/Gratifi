# GratiFi

GratiFi is production-ready recognition infrastructure for hospitality and service venues.

The `platform/` app is a Next.js 15, Supabase, Stripe, Solidity, and Moonbeam implementation of walletless customer recognition.

Core flow:

1. Customer scans a QR code.
2. Customer selects or views a worker.
3. Customer leaves a recognition amount and optional thank-you message.
4. Stripe verifies payment server-side.
5. Supabase stores the recognition event.
6. Moonbeam anchors the deterministic recognition hash.
7. Admins can verify, retry, export, and monitor recognition events.

Start here:

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
- [`moonbeam-contract-spec.md`](docs/protocol/moonbeam-contract-spec.md)
- [`api-spec-v1.md`](docs/protocol/api-spec-v1.md)
- [`privacy-and-governance.md`](docs/protocol/privacy-and-governance.md)
- [`future-token-readiness.md`](docs/protocol/future-token-readiness.md)
- [`developer-readme.md`](docs/protocol/developer-readme.md)

## License

MIT License. See [`LICENSE`](LICENSE).
