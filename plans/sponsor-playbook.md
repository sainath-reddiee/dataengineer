# Sponsor and newsletter inquiries: how to answer them

Inquiries arrive from the advertise form (via Web3Forms) or as direct email. The goal is a fast, honest reply that turns a real sponsor into a booking and politely turns away link sellers.

## Triage in 2 minutes

Sort every inquiry into one of three:

1. **Real product, good fit.** A data-engineering tool, course or service a reader would actually use. Reply with template A.
2. **Link seller or SEO agency.** Asks for dofollow links, "guest post on your DA site", link insertion, or casino/crypto/loans. Reply with template C (or archive it).
3. **Unclear.** Missing product or URL. Reply with template B.

Reply within two working days; the advertise page promises it.

## Template A: good fit

> Subject: Re: Sponsoring DataEngineer Hub
>
> Hi {name},
>
> Thanks for reaching out about {product}. It looks like a good fit for readers working on {topic, e.g. dbt and Snowflake}.
>
> Current options (founding-sponsor rates, USD):
>
> - Sponsored card on matching guides, cheat sheets and calculators: $39 per month or $349 per year
> - Tools Hub listing for 12 months: $79
> - Co-authored integration guide (I write a real tutorial using {product}): $199
> - Sponsored announcement (press release) in our Announcements section: $49 per release
>
> All placements are labeled "Sponsored" and links are rel="sponsored nofollow". You get a private dashboard link with viewable impressions and clicks, and UTM-tagged links for your own analytics.
>
> The site is small and specialist. I'm happy to share a current analytics screenshot before you decide.
>
> If you'd like to go ahead, send the headline (under 60 characters), a one-line description (under 140 characters), the destination URL and a logo (SVG or PNG). I'll send a PayPal invoice in USD, and the placement goes live within 48 hours of payment.
>
> Thanks,
> Sainath

## Template B: need more detail

> Hi {name},
>
> Thanks for getting in touch. Could you share the product URL and a line on who it helps? I only run placements for data-engineering tools, courses and services, so I check each one before quoting. The current options and prices are at https://dataengineerhub.blog/advertise.
>
> Sainath

## Template C: link sellers

> Hi {name},
>
> Thanks, but DataEngineer Hub doesn't sell dofollow links, link insertions or guest posts for SEO. All sponsor links are labeled and marked rel="sponsored nofollow". If you have a data-engineering product to promote that way, I'm happy to talk.
>
> Sainath

## Newsletter mention inquiries

> Hi {name},
>
> The newsletter sends one short email when a new article is published, and the list is still growing ({current count} confirmed subscribers). Newsletter mentions are a waitlist at $19 per issue: nothing is charged until your issue is scheduled, and I'll confirm the subscriber count with you first. Want me to add you?
>
> Sainath

Check the current count at https://app.dataengineerhub.blog/wp-json/dehub/v1/newsletter/stats before replying.

## Press release requests

Press releases are welcome as sponsored announcements ($49). Reply with the rates in template A, and ask for the release text (up to 800 words), one logo or image, and the target URL.

To publish one:

1. In WordPress, create the post in the **Announcements** category (slug `announcements`). Do not also put it in a normal category.
2. Light edit: remove guaranteed-results claims and unverifiable statistics; keep it under 800 words.
3. Publish. It appears at `https://dataengineerhub.blog/announcements/<slug>`, labeled, noindexed, with every link set to `rel="sponsored nofollow"` automatically. It is never emailed to newsletter subscribers and never appears in article lists, the sitemap or RSS.
4. Email the live link to the sponsor.

## After payment: going live

1. In the admin Sponsor Manager (`/admin/sponsors`), create the campaign: company, URL, placement, dates, targeting (categories or tags that match the product). Save, which commits `activeSponsors.json` and deploys.
2. The manager copies the dashboard-link command. Run it on your machine (see `plans/wordpress-setup.md`) and email the printed link to the sponsor along with the live URL.
3. For a co-authored guide, tag the WordPress post `sponsored` so it shows the disclosure, and add `rel="sponsored"` to links to the sponsor.
4. Put the end date in your calendar. Email the sponsor a week before it ends; monthly placements do not auto-renew.

## Pricing review

Prices are founding rates for a site under 5,000 monthly pageviews. Revisit them when traffic grows. A reasonable rule: raise the sponsored card by about $20 a month for every additional 5,000 monthly pageviews, and keep the co-authored guide priced on the writing work.
