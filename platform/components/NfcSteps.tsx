/** How to write a GratiFi link to an NFC tag with a phone. */
export function NfcSteps() {
  return (
    <ol className="mt-3 grid list-decimal gap-1.5 pl-5 text-sm text-ink/70">
      <li>Buy NTAG215 or NTAG216 stickers, cards or keyrings (the most widely supported kind).</li>
      <li>Install a free tag writer such as NFC Tools on your phone.</li>
      <li>Choose Write → Add a record → URL, and paste the NFC link above.</li>
      <li>Hold the tag to the back of your phone to write it, then tap it to check the tip page opens.</li>
      <li>Optional: lock the tag in the app so nobody can overwrite it.</li>
    </ol>
  );
}
