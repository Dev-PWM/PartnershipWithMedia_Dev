# Email Response Workflow

How every conversation with a prospect or client moves from first contact to finished project, which email goes out
at each step, who sends it (the site or you), and how fast.

## What already exists

| Trigger | Email | To | Sent by |
|---|---|---|---|
| Contact form submitted | `contactAutoReply` ("Got your message") | Visitor | Site, instantly |
| Contact form submitted | `ownerNotice` "New inquiry" (reply-to = visitor) | You | Site, instantly |
| Stripe payment confirmed | `purchaseThankYou` (+ sign link for build packages) | Buyer | Site, via webhook |
| Stripe payment confirmed | Owner "New order" notice | You | Site |
| Agreement signed | `agreementSignedCopy` | Buyer | Site |
| Agreement signed | Owner "Agreement signed" notice | You | Site |

Missing: anything you send by hand (no templates, so replies vary), and anything that happens when **nobody acts**.
That second gap is where most leads are lost.

## The pipeline

```
 INQUIRY ──► QUALIFY ──► PROPOSAL ──► PAID ──► SIGNED ──► IN BUILD ──► DELIVERED ──► CARE PLAN
   │            │           │          │         │                         │
 auto-reply  your reply   follow-up  thank-you  copy +                  handoff +
 (exists)    within 1BD   day 3 / 7  (exists)   kickoff                 review ask
                                       │
                                     no signature? reminder day 2 / 5
```

## Stage by stage

### 1. Inquiry received (automatic, exists)
- Visitor gets the auto-reply promising **a reply within one business day**. That promise is the SLA everything
  below is built around.
- You get the inquiry; hitting Reply answers the visitor directly.

### 2. Qualify: your first personal reply (manual, within 1 business day)
Pick one of four replies by fit. Each is short, uses their first name, and references one specific detail from their
message so it never reads as canned.

| Situation | Reply goal | Call to action |
|---|---|---|
| Clear fit, clear scope | Confirm the package, give price + timeline | "Book here" / package checkout link |
| Fit, scope unclear | 2–3 sharp questions | Answer by email or 15-min call link |
| Custom / large | Propose a call | Calendar link, then a deposit link |
| Not a fit | Decline kindly, point somewhere useful | None. Close the thread |

**Rules:** one question block, one link, no attachments in the first reply, under 150 words.

### 3. No answer from the prospect: follow-ups
- **Day 3:** one-line nudge in the same thread ("Wanted to make sure this didn't get buried…").
- **Day 7:** last touch, an easy out ("If timing's changed, no problem. I'll close this out, reply any time.").
- Then stop. Two follow-ups is the professional ceiling; more reads as pressure.

### 4. Paid (automatic, exists)
Thank-you with the private order link. Owner notice to you.

### 5. Paid but agreement not signed: reminders (automatic, to build)
- **Day 2** and **day 5** after payment, if `signed_at` is still empty: short reminder with the "Review and sign"
  button. Same order link, same idempotency style as the webhook (`reminder:<code>:d2`).
- **Day 7:** owner notice so you can reach out personally.

### 6. Signed: kickoff (automatic copy exists; add your kickoff)
Buyer already gets their signed copy, which says "I'll be in touch within one business day." Your kickoff email
(manual, template) covers: what you need from them (logins, content, brand assets), the first milestone date, and how
updates will arrive.

### 7. In build: status updates
- One update per milestone, or weekly at minimum, even if the update is "on track."
- Format: **Done / Next / Need from you.** Three short lists. Clients scan, they don't read.

### 8. Delivered: handoff
- Live link, what was delivered, how to request changes, the warranty/revision window from the agreement.
- **Day 14 after delivery:** ask for a testimonial/review, then offer the maintenance plan if they don't have one.

## Response-time standards

| Message type | Target |
|---|---|
| New inquiry | Within 1 business day (promised in auto-reply) |
| Client during an active build | Same business day |
| Urgent issue on a care-plan site | Within 4 business hours |
| Anything after hours | Next business morning. Don't train clients to expect midnight replies |

## Tone rules for every email
1. First name, never "Dear customer."
2. One purpose per email, one button or link.
3. Subject says what's inside: `Your quote: Starter Site`, not `Following up`.
4. Short paragraphs; the important line comes first.
5. Always end with what happens next and who does it.
6. Never paste a visitor's message back to them (the auto-reply already avoids this for spoofing reasons).

## Build list (in priority order)
1. **Owner reply templates**: the four qualify replies + kickoff + status + handoff, in `lib/emails.ts`'s voice, kept
   as plain text you paste into your mail client (or Gmail templates). No code path needed.
2. **Unsigned-agreement reminders**: a daily cron route (Vercel Cron) that finds paid, unsigned orders and sends
   day-2 / day-5 reminders plus a day-7 owner notice.
3. **Inquiry tracking**: store inquiries in Supabase alongside orders, with a status
   (`new / replied / proposal / won / lost`), so the follow-up dates are visible in one place.
4. **Post-delivery review ask**: once orders have a `delivered_at`, the same cron sends the day-14 email.
