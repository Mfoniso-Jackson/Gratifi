# What customers want: our assumptions

GratiFi has three customers today: the **person tipping**, the **staff member** being thanked, and
the **venue owner** who pays. Each wants something different, and the product only works if all three
get what they want.

Everything below is an **assumption until the pilot tests it**. Each one has a confidence level, the
evidence behind it, and how the pilot will check it. Update this page when pilot data arrives; it
should change what we build.

Confidence: **High** = backed by more than one independent source. **Medium** = one source or
strong logic. **Low** = our hypothesis, untested.

## 1. The person tipping

**What they want, in one line:** to thank the person who served them, quickly, without pressure,
and to trust that the money reaches that person.

| Assumption | Confidence | Evidence | How the pilot tests it |
| --- | --- | --- | --- |
| They want to tip the specific person who served them | High | RSM UK (Jan 2026, 2,000 people): 36% want tips to go to the staff who served their table and 57% to waiting staff; only 24% say share with all staff including chefs and managers | Compare tips via staff badges with tips via the venue page |
| They doubt digital tips reach staff | Medium | CintSnap poll: 53% of UK respondents worried digital tips don't reach the intended person (small sample, date unclear) | Ask in short customer chats; watch whether a trust line changes tip rates |
| Cash still matters, and many skip tipping when they have no cash | Medium | Which? (Jan 2025): cash still dominates UK tipping. Post Office survey (Oct 2025, 2,000 adults): 58% prefer to tip in cash and 80% have skipped a tip when only digital was possible (commissioned by a cash provider) | Ask venues how much cash tipping they see; compare GratiFi tips to the cash jar |
| They resent pressure to tip | High (US and France), thin for the UK | US: nearly 9 in 10 say tipping is out of control (WalletHub); 4 in 10 avoid businesses over tip prompts (Omni, Feb 2026). France: 60% feel pressured by card-machine prompts (IntoTheMinds, May 2026) | Any complaints about cards or badges; staff feedback on how customers react |
| They'll write a note if asked warmly | Low | Our hypothesis; the note is the part no card machine offers | Share of tips with a note (target over 50%) |
| They won't install an app or make an account | High | Common to every tipping product; GratiFi already needs neither | Drop-off between scan and payment |

## 2. The staff member

**What they want, in one line:** more money, paid fairly and openly, and to know their work was
noticed, by customers and by the boss.

| Assumption | Confidence | Evidence | How the pilot tests it |
| --- | --- | --- | --- |
| They want tips that reach them in full and on time | High | The UK tipping law (2023) exists because tips were being kept back; hospitality is the UK's lowest-paid sector (Living Wage Foundation figures) | Ask staff weekly; check payroll exports match tips |
| Notes from customers matter to them, not just money | Medium | Recognition is linked with staying in a job in several surveys (mostly from recognition-software companies, so correlational) | Share of staff who read their tips each week (target over 60%) |
| They want their manager to see the thanks | Low | Hypothesis | Ask in check-ins; watch whether managers mention notes in team talks |
| They'd want a record of thanks they keep after leaving | Low | Hypothesis behind the long-term worker account | One question in staff interviews: "Would you want to take this with you?" |
| They don't want to be named or pictured without consent | High | Basic privacy expectations; UK GDPR | No staff opt-outs or complaints |

## 3. The venue owner (who pays)

**What they want, in one line:** to keep good staff and stay on the right side of the tipping law,
without extra admin or annoyed customers.

| Assumption | Confidence | Evidence | How the pilot tests it |
| --- | --- | --- | --- |
| Keeping staff is a pressing problem | High | UK hospitality staff turnover is 52% to 75% a year depending on the source (CIPD; Pineapple and Sona); only about 1 in 4 new starters stay past the early weeks (Dojo, Harri) | Ask owners about turnover and hiring costs at the start |
| They'll pay for recognition that helps keep staff | **Low: the riskiest assumption** | Recognition is linked with retention in surveys, but most evidence comes from vendors and is correlational | Day 25 question: "Would you pay for this?" (target 2 of 3 owners) |
| They want tipping-law compliance made easy | Medium | The law requires a written policy, fair allocation and no deductions; records help | Do owners use the payroll export? Do they ask for a policy template? |
| They won't accept admin or set-up work | High | Pilots stall at set-up | Time to set up; whether they finish Stripe onboarding unaided |
| They fear anything that annoys customers | Medium | Tipping fatigue data above | Any customer complaints the owner hears |

## Later customers

- **Brands and sponsors** (Dream Fund): want verified, positive impact for ESG reports. Untested; the
  Dream Fund stays off until legal review.
- **Employers hiring:** want proof of good staff. Depends on the worker account (stage 3). Untested.

## The riskiest assumptions, in order

1. **Owners will pay** for recognition. If wrong: test free for venues, earning from the card-fee
   add-on and later sponsors.
2. **Customers will use a QR or NFC card** where they otherwise wouldn't tip, or would tip in cash.
   If wrong: focus on settings with no till moment (hotels, chairs, cloakrooms).
3. **Notes matter** to staff more than small amounts of money. If wrong: lead with money and fast
   payouts instead of recognition.
4. **Staff want a record they keep.** If wrong: the worker account and hiring plans change.

## What this means for the project

These follow from the evidence above and apply now:

1. **Lead with the person, not the venue.** Customers want to thank whoever served them. Staff
   badges and staff cards come before venue-wide QR codes in every pitch and setup.
2. **Back-of-house is a harder sell than we thought.** Customers are much less keen to tip kitchen
   staff directly. Position kitchen thanks as notes to the team, and let the venue's tipping policy
   decide sharing, rather than leading with "tip the chef".
3. **Never pressure.** No pop-ups, no default tip pre-selected, no nagging reminders, and nothing
   at the card machine. The note is an invitation; the tip is optional. (Added to `CLAUDE.md`.)
4. **Answer the trust question on the page.** Recommended for after the lawyer's review: a clear
   line on the tip page about where the tip goes (for example, "Your tip is for Maya, and the venue
   passes it on in full"). Not changed yet, because the exact wording depends on the legal review.
5. **Sell GratiFi as the answer to cashless.** "Customers who don't carry cash can still thank your
   team" is a concrete, testable pitch for owners.
6. **Lead the owner pitch with keeping staff and the tipping law**, not with technology. Prove the
   retention link in the pilot before claiming it.

## Pilot interview questions

Short, open questions. Write down exact words, not summaries.

**Customers (2 minutes, after they tip or decline):**

1. What made you use the card, or not?
2. Who did you want the money to reach?
3. Did anything make you hesitate?
4. Would you have tipped in cash otherwise?

**Staff (weekly, 5 minutes):**

1. Which note this week stuck with you?
2. Did the tips reach you as you expected?
3. Has anyone (customer or manager) mentioned it?
4. If you changed job, would you want to take your thank-yous with you?

**Owners (week 1 and day 25):**

1. How many people have left in the last year, and what did that cost you?
2. How do you handle tips and the tipping law today?
3. What has GratiFi changed, if anything?
4. Would you pay for it, and what would make it a clear yes?

## Sources

Searched 18 November 2026. Several are vendor or commissioned surveys with different methods, so
treat figures as signals, not facts.

- [RSM UK survey via Restaurant Online (Jan 2026)](https://www.restaurantonline.co.uk/Article/2026/01/12/diners-believe-tips-should-go-to-waiting-staff-alone/)
- [Which? tipping survey](https://www.which.co.uk/policy-and-insight/article/new-which-survey-exposes-uks-tipping-habits-as-one-in-five-admit-they-didnt-tip-after-a-meal-out-in-last-12-months-a2sFr5M9y3vn)
- [CintSnap: tipping culture US vs UK](https://cint.com/blog/cintsnap-unveils-the-divide-tipping-culture-in-the-us-vs-uk)
- [Post Office: millions of Brits would rather skip tipping than tip via card (Oct 2025)](https://www.mynewsdesk.com/uk/post-office/pressreleases/millions-of-brits-would-rather-skip-tipping-than-tip-via-card-3413516)
- [Morning Advertiser: hospitality staff churn and training costs (May 2026)](https://www.morningadvertiser.co.uk/Article/2026/05/29/only-1-in-4-staff-remain-in-work-after-90-days-training-costs-up-70/)
- [Caterer Licensee: turnover drops (Pineapple and Sona report)](https://catererlicensee.com/hospitality-staff-turnover-drops-by-close-to-10/)
- [CIPD: benchmarking employee turnover](https://prod.cipd.org/uk/views-and-insights/thought-leadership/cipd-voice/benchmarking-employee-turnover/)
- [Startups: hospitality lowest-paid workforce](https://startups.co.uk/news/hospitality-uk-lowest-paid-workforce/)
- [Modern Restaurant Management: recognition and retention](https://modernrestaurantmanagement.com/recognition-champions-can-boost-retention/)
- [International Journal of Contemporary Hospitality Management: recognition study](https://emeraldinsight.com/insight/content/doi/10.1108/IJCHM-01-2022-0036/full/html)
- [Fox News: WalletHub tipping survey](https://www.foxnews.com/food-drink/americans-fed-up-tipping-culture-nearly-9-10-say-its-completely-out-control.print)
- [Modern Restaurant Management: is tipping out of control (Popmenu, Omni surveys)](https://modernrestaurantmanagement.com/is-tipping-out-of-control/)
- [IntoTheMinds: tipping on card payment (France)](https://www.intotheminds.com/blog/en/tipping-card-payment/)
