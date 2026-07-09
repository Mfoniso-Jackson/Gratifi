# Moonbeam Contract Specification

## Contract

`GratiFiProtocol.sol` records immutable recognition hashes on Moonbeam.

The contract is intentionally small. It does not process payments, manage customer accounts, issue tokens, mint NFTs, or store raw personal data.

## Purpose

The contract provides:

- permanent recognition anchoring;
- duplicate prevention;
- public verification through emitted events;
- an authorised backend/operator write path.

## Stored Record

Each record stores:

- `recognitionHash`
- `venueHash`
- `workerHash`
- `messageHash`
- `amountPence`
- `timestamp`

## Event

```solidity
event RecognitionRecorded(
  bytes32 indexed recognitionHash,
  bytes32 indexed venueHash,
  bytes32 indexed workerHash,
  bytes32 messageHash,
  uint256 amountPence,
  uint256 timestamp
);
```

This event is the primary public verification artifact.

## recordRecognition

```solidity
function recordRecognition(
  bytes32 recognitionHash,
  bytes32 venueHash,
  bytes32 workerHash,
  bytes32 messageHash,
  uint256 amountPence
) external onlyOwner
```

Responsibilities:

- reject empty recognition hashes;
- reject zero amounts;
- reject duplicate recognition hashes;
- store the immutable recognition record;
- emit `RecognitionRecorded`.

## Duplicate Prevention

The contract uses a mapping from `recognitionHash` to stored record. If a record already exists, `recordRecognition` reverts with `RecognitionAlreadyRecorded`.

The backend also checks `isRecognitionRecorded` before attempting a write.

## Operator Permissions

v1 uses owner-gated writes. The owner should be a backend/operator wallet controlled by the production deployment.

Private keys must never be exposed to:

- browser clients;
- mobile clients;
- public API consumers;
- venue operators.

## Deployment Environment

Recommended sequence:

1. Deploy to Moonbase Alpha.
2. Run test Stripe payments through the full application flow.
3. Confirm events appear in Supabase and Moonbase explorer.
4. Deploy to Moonbeam mainnet.
5. Update `GRATIFI_PROTOCOL_CONTRACT_ADDRESS`.
6. Confirm `/admin/protocol` reads the deployed contract.

## Block Explorer Verification

Verification requires:

- transaction hash;
- block number;
- contract address;
- emitted `RecognitionRecorded` event;
- matching `recognitionHash`.

## Upgrade Considerations

v1 is intentionally not upgradeable. Future versions may deploy new contracts and identify them by `protocol_version` and `contract_address`.

If upgradeability is introduced later, governance, operator security, migration, and audit requirements must be documented before deployment.
