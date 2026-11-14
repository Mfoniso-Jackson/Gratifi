# NFC tipping

NFC tags hold the same link as a QR code, so a customer can hold their phone near a sticker, card or
badge to open the tip page. No app is needed: iPhones (XS and later) and most Android phones read
NFC tags in the background.

## Links

| Where | QR link | NFC link |
|---|---|---|
| Venue (customer picks who to thank) | `/v/<slug>?src=qr` | `/v/<slug>?src=nfc` |
| One staff member | `/tip/<workerId>?src=qr` | `/tip/<workerId>?src=nfc` |

Admins find them on the venue page ("NFC tap point") and on each staff member's card
(Staff → "QR and NFC card"), with a Copy button.

Each visit is counted in `qr_scans` with `source` = `qr` or `nfc` (migration 011). The Overview shows
scans and taps over 30 days, and each staff card shows that person's QR scans and NFC taps.

## Writing a tag

1. Use NTAG215 or NTAG216 tags (stickers, PVC cards, keyrings or epoxy badges).
2. Install a free writer app such as NFC Tools.
3. Write → Add a record → URL → paste the NFC link → hold the tag to the phone.
4. Tap the tag to check the tip page opens, then lock it in the app so it can't be overwritten.

Print the staff member's QR code on the same badge so customers whose phones can't read NFC can
still tip.

## Selling it

An "NFC tip badge" per staff member is a low-cost add-on: tags cost well under £1 each in bulk.
Badges could be included in the starter kit on paid plans.

## Not included

Tap to Pay (customers tapping a card on a staff member's phone) needs a native app and Stripe
Terminal, so it's left for later.
