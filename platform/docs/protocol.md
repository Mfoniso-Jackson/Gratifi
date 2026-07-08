# Protocol

`GratiFiProtocol.sol` records immutable recognition events by deterministic hash.

## Stored Fields

- `recognitionHash`
- `venueHash`
- `workerHash`
- `messageHash`
- `amountPence`
- `timestamp`

## Functions

`recordRecognition(bytes32 recognitionHash, bytes32 venueHash, bytes32 workerHash, bytes32 messageHash, uint256 amountPence)`

Records a recognition event. Only the authorised backend/operator wallet can call this function.

`isRecognitionRecorded(bytes32 recognitionHash)`

Returns whether a hash has already been recorded.

`getRecognitionCount()`

Returns the number of anchored recognitions.

## Event

`RecognitionRecorded` is emitted for every successful record.

## Hashing

The app hashes normalised recognition payloads with the current protocol version. This keeps payloads deterministic and portable for later API/SDK use.
