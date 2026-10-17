# 2extract for Web Scraping: Python, Residential Proxies and MCP

> **Editor notes**
>
> - Changed: removed the TL;DR block and folded the "one pricing detail" callout into the section on the proxy username. Added a short intro. Replaced figure numbers ("fig. 1", "fig. 4") with plain references, because the numbering was out of order on the page (fig. 3 appears after figs. 4 and 5). Added language tags to every code block and short explanations around the longer ones. Turned the FAQ questions into `###` headings. Removed nearly all em-dashes and some repeated phrasing ("actually", "the same account").
> - Cut: the Glossary table. Every term in it (exit IP, gateway, base username, sticky session, 407, PAYG, MCP server) is already defined in the body, so it repeated content. Restore it if you like it as a quick reference.
> - Check before publishing: the $50 lifetime deposit cap for unverified accounts and the $10 minimum top-up; the "19 tools and 19 resources" count on the MCP server; T-Mobile US as ISP code `310260`; the `setProxyLimit` tool name and its `monthly_cap_usd` argument (it is not visible in the tools-panel screenshot, so confirm the real tool name and schema); that `X-2extract-Error` / `X-Proxy-Error` are still the header names. The closing disclaimer says pricing reflects the dashboard "as of September 2026"; update the date if you re-test.
> - Image alt text was empty on the original; I wrote alt text from the surrounding captions. Check it matches what each image shows.

This post is for data engineers who need geo-targeted scraping through residential or mobile proxies and want to see how 2extract works in practice. It covers the 2extract MCP server driven by an AI agent, then the same account driven by a Python package (`twextract`) that builds three datasets: geo/address, eCommerce pricing and market research. The code, output and failure modes are from real runs against a live account.

## Why the exit point matters

A ten-thousand-row scraping job died two hours in, wallet already charged for the first six thousand rows, when a regional storefront started quietly returning empty product grids instead of a clean 403 I could at least catch. A request from a cloud IP gets fingerprinted as automation by anything that matters (pricing pages, ad verification targets, review aggregators) before retry logic even notices something is wrong. The fix isn't a longer timeout. It's a different exit point.

That is the problem 2extract solves, and it is worth being precise about what changes and what doesn't. It is a residential and mobile proxy network, billed pay-as-you-go, where every targeting decision (country, city, ZIP, carrier, how sticky a session should be) is a parameter you build into the proxy username rather than a checkbox in a vendor portal. That is a different operating model from the flat "buy a country, get an IP list" products many data teams have tried and half-abandoned. The same account is also reachable through an [MCP](https://modelcontextprotocol.io) (Model Context Protocol) server at `mcp.2extract.com`, so an agent such as Claude, Cursor or Codex can check the balance, look up a geo slug, create a proxy and cap its spend without anyone hand-writing the client shown below.

I found the sharp edge the expensive way, twenty minutes into my first real run. I'd copied a proxy username from the dashboard, then pasted `-country-us` onto the end of it for a quick test. The copied string already carried a targeting suffix from an earlier session I'd forgotten to clean up. Two suffixes, one string, and an instant `407` that read exactly like a wrong password. It wasn't. It was a syntax problem wearing an authentication error's clothes, and it is the first thing this article will save you from repeating.

[ADD YOUR OWN: the exact 407 response (status line plus any X-2extract-Error header) you got from the double-suffix username, with the client ID masked]

## What 2extract is, and what it isn't

2extract does not scrape websites. It doesn't parse HTML, doesn't decide which fields belong in a product catalog, and doesn't store anything you collect. It sits between your program and the public internet and makes each outbound request look like it came from a real residential connection (or, on the mobile product, a real carrier connection), optionally narrowed to a country, state, city or ZIP you choose.

Every stack built on it has the same three layers:

- **Collector:** an agent calling MCP tools, or Python code with `requests` and BeautifulSoup. It chooses URLs, parses responses, dedupes and writes files.
- **Gateway:** `proxy.2extract.net:5555`. It authenticates the request, applies targeting, picks an exit IP and tunnels the traffic through.
- **Target:** whatever site or API holds the data.

Mobile proxies push the residential idea further. The exit is a carrier IP (T-Mobile US shows up under ISP code `310260` in the docs), priced separately, and targeted with `-isp` instead of `-country`. The two targeting families are mutually exclusive on a single username, and the gateway rejects a request that tries to mix them.

None of this is a license to do anything you couldn't already justify without a proxy. The [Acceptable Use Policy](https://docs.2extract.com/legal/acceptable-use-policy.md) rules out unauthorized access, account farming, scalping, spam and ad fraud in plain terms, and a residential exit doesn't override robots.txt, a site's terms of service or copyright law.

## The proxy username is the control plane

Most proxy vendors let you pick a country from a dashboard dropdown or set it in an HTTP header. 2extract does neither. After you create a proxy, the dashboard gives you a **base** username shaped like `2xt-customer-[CLIENT_ID]-proxy-[PROXY_NAME]`, and that base is immutable for the life of the proxy. Everything situational is appended afterward as a hyphenated suffix, built fresh by your code on every request.

This also shapes the bill. Most proxy vendors sell each country as a separate product. 2extract sells one residential proxy and treats geography as a parameter on the request, so the cost doesn't multiply with the number of markets you target.

![Diagram of a 2extract proxy username: the immutable base username followed by targeting suffixes such as country, state and session](https://i0.wp.com/app.dataengineerhub.blog/wp-content/uploads/2026/09/2exrtract-1-1024x482.png?resize=1024%2C482&ssl=1)

The `Targeting` dataclass below is how the Python package enforces those rules before a request ever leaves your machine. `validate()` refuses to mix geographic and network targeting, and refuses city, state or ZIP without a country. `build_username()` appends the suffix parts to the clean base username, which is exactly what prevents the double-suffix mistake above. (`normalized()` and `suffix_parts()` live in the full source on GitHub.)

```python
@dataclass(frozen=True)
class Targeting:
    country: str | None = None
    state: str | None = None
    city: str | None = None
    zip_code: str | None = None
    asn: str | None = None
    isp: str | None = None
    session: str | None = None
    time_minutes: int | None = None
    const: bool = False

    def validate(self) -> None:
        t = self.normalized()
        geo = any([t.country, t.state, t.city, t.zip_code])
        net = any([t.asn, t.isp])
        if geo and net:
            raise TargetingError(
                "Geographic targeting (country/state/city/zip) and network "
                "targeting (asn/isp) are mutually exclusive. Use one group only."
            )
        if (t.state or t.city or t.zip_code) and not t.country:
            raise TargetingError("city, state and zip require country in the same username.")


def build_username(base_username: str, targeting: Targeting | None = None) -> str:
    base = base_username.strip()
    if targeting is None:
        return base
    parts = targeting.suffix_parts()
    return f"{base}-{'-'.join(parts)}" if parts else base
```

## What the residential product is used for

| Use case | Why residential matters here | Session strategy |
| --- | --- | --- |
| eCommerce & price monitoring | Stores change currency, tax and stock by country; a datacenter IP gets a generic or blocked page | Sticky for the length of a category walk |
| Market research | Discussion APIs and open product databases still rate-limit aggressively at volume | Rotating, one exit per batch |
| Geo / localization | Regional prices, SERPs and ads only render correctly to an exit that looks local | Rotating, unique IP per market sample |
| Ad verification & SEO / SERP | Same mechanics underneath, but SERPs are heavily JavaScript-driven | Usually needs a real browser, not this stack |

## How a request travels, and how it fails

![Request flow from collector to the 2extract gateway to the target site and back](https://i0.wp.com/app.dataengineerhub.blog/wp-content/uploads/2026/09/2exrtract-2-1024x378.png?resize=1024%2C378&ssl=1)

Every request makes the same trip: collector to gateway to target, and the response back along the same path. Three things go wrong along the way. A residential peer can simply go offline mid-session. A proxy left in **Inactive** status returns a `407` even with a correct password. And gateway-level errors surface in an `X-2extract-Error` or `X-Proxy-Error` response header, except that the header goes dark over HTTPS CONNECT tunneling.

On this stack a `407` narrows to one of three causes: the proxy is Inactive, the wallet is empty, or the username carries malformed or conflicting targeting. The client turns that into a readable error instead of a generic failure:

```python
def _gateway_407(self, targeting, exc):
    header = self._read_gateway_header_if_needed(targeting)
    hint = header or (
        "the proxy is Inactive, the password is wrong, or the wallet is empty. "
        "Open My Proxies and set Status to Active, then rerun."
    )
    if header and "inactive" in header.lower():
        hint = f"{header}. Open My Proxies and set Status to Active (Actions menu)."
    return GatewayError(f"2extract rejected the proxy login (407): {hint}", status_code=407)
```

## Setting up an account

No library can do this part for you.

1. Create an account and open the [dashboard](https://2extract.com/app). Unverified accounts carry a $50 lifetime deposit cap.
2. Top up the Pay-As-You-Go wallet. The minimum is $10, and residential and mobile traffic bill from the same balance.
3. If the job will ever need more than $50 deposited, verify identity first.
4. Create an API key scoped to at least `geo:read`, `proxies:read`, `proxies:write` and `balance:read`. It is shown exactly once.
5. Create one residential proxy, and a second dedicated proxy only if you need mobile ISP targeting.
6. Set a monthly spend cap on each proxy.
7. Copy the *base* username and password somewhere safe: a `.env` file if you're driving this with Python, the agent's own credential store if it's MCP. Never store the targeted version with a suffix already attached.

## Running the same account through MCP

Everything above assumes a person writing Python. 2extract also ships an MCP server at [`mcp.2extract.com`](https://mcp.2extract.com) that exposes the same account (balance, proxies, geo catalog, traffic history) as tools any MCP-capable agent can call. The product doesn't change: it is still one residential proxy, still billed pay-as-you-go, still targeted through a username suffix. What changes is who assembles the username. The agent does it from a plain-language request, instead of you doing it with the `Targeting` dataclass.

![Diagram of the round trip behind every tool call: agent to MCP server to 2extract account, and back](https://i0.wp.com/app.dataengineerhub.blog/wp-content/uploads/2026/09/2exrtract-2-1-1024x544.png?resize=1024%2C544&ssl=1)

I connected it as a custom MCP server inside an agent's tool panel and had 19 tools and 19 resources enabled with nothing more than the server URL and an API key. There was no separate SDK and no client to install.

![The 2extract MCP server connected in an agent's tool panel, with createProxyResource, deactivateProxyResource, deleteProxyResource and getAccountBalance among the 19 enabled tools](https://i0.wp.com/app.dataengineerhub.blog/wp-content/uploads/2026/09/2exrtract-2.jpg?resize=968%2C740&ssl=1)

The six steps below ran in one continuous session against the same account.

![Overview of the six MCP steps: balance check, geo lookup, proxy creation, spend cap, dashboard check and a routed request](https://i0.wp.com/app.dataengineerhub.blog/wp-content/uploads/2026/09/2exrtract-2-2-1024x368.png?resize=1024%2C368&ssl=1)

### Step 1: check the balance in plain language

The simplest sanity check skips the dashboard tab entirely. Asking the agent *"What is my 2extract balance?"* triggers one tool call, `getAccountBalance`, and comes back in about 22 seconds with the wallet figure to six decimal places, not just the rounded number the UI shows:

```json
{
  "balance_display": "$4.75",
  "balance_exact": "$4.746951",
  "note": "enough to create a new proxy"
}
```

![Agent response to a plain-language balance check via getAccountBalance, showing both the rounded and the exact balance](https://i0.wp.com/app.dataengineerhub.blog/wp-content/uploads/2026/09/2exrtract-2-1-1024x725.jpg?resize=1024%2C725&ssl=1)

### Step 2: look up geo slugs without a docs tab

Every geographic suffix has to come from 2extract's own catalog, never guessed. A state name that is off by one word doesn't error; it is silently ignored as a targeting parameter. `searchGeoRegions` puts that catalog in the agent's hands. Asking for Germany's regions returns the exact slugs the proxy username expects:

| Region | Username param |
| --- | --- |
| Baden-Württemberg | `badenwurttemberg` |
| Bavaria | `bavaria` |
| North Rhine-Westphalia | `northrhinewestphalia` |
| Saxony | `saxony` |
| Thuringia | `thuringia` |

![searchGeoRegions resolving Germany's states into the exact -state- slugs the proxy username expects](https://i0.wp.com/app.dataengineerhub.blog/wp-content/uploads/2026/09/2exrtract-2-2-1024x657.jpg?resize=1024%2C657&ssl=1)

The agent added, unprompted, *"do not guess them."* That is the same warning this article gives about the username, now enforced by the tool call instead of a paragraph the reader has to remember.

### Step 3: create the proxy the lookup was for

With the slug in hand, the same session calls `createProxyResource` with targeting baked into the proxy itself rather than appended per request:

```json
{
  "tool": "createProxyResource",
  "arguments": {
    "name": "de-baden-agent-demo",
    "type": "residential",
    "country": "DE",
    "state": "badenwurttemberg"
  }
}
```

The response is the same base-username shape described earlier, `2xt-customer-[CLIENT_ID]-proxy-de-baden-agent-demo`, except this proxy carries Baden-Württemberg targeting as its default. A plain request with no suffix at all still exits from that region.

### Step 4: set a spend cap without leaving the chat

The setup checklist says to cap spend on every proxy from the dashboard. Over MCP that is a second tool call on the proxy you just created:

```json
{
  "tool": "setProxyLimit",
  "arguments": {"proxy": "de-baden-agent-demo", "monthly_cap_usd": 5}
}
```

At a $4.75 balance that cap does little for a demo account, but it is the same guardrail every production proxy behind this article's three pipelines runs under, set through the agent instead of the dashboard.

I deactivated and deleted this demo proxy right after testing it, using `deactivateProxyResource` and `deleteProxyResource` from the same tools panel, so a five-minute demo didn't inflate the account's proxy count. That is why the dashboard in the next step shows one active proxy, not two.

### Step 5: check the result against the dashboard

MCP doesn't read from a separate ledger. The balance, the proxy and its cap show up identically in 2extract's web dashboard, because both surfaces read and write the same account state. Asking the agent for a 30-day traffic-and-spend rollup returns the same wallet history the dashboard's usage tab shows, broken down by day:

![30-day usage rollup pulled through MCP: $0.25 spent and 60.5 MB of traffic through one proxy](https://i0.wp.com/app.dataengineerhub.blog/wp-content/uploads/2026/09/2exrtract-2-3-1024x735.jpg?resize=1024%2C735&ssl=1)

The dashboard, checked separately right after, agrees:

![The 2extract dashboard showing 60.49 MB of traffic over 30 days and one active proxy](https://i0.wp.com/app.dataengineerhub.blog/wp-content/uploads/2026/09/2exrtract-2-3-1024x398.png?resize=1024%2C398&ssl=1)

Balance, active-proxy count and traffic line up across both views. The $4.75 agent-side versus $4.74 on the dashboard is rounding, not a discrepancy, and both show one active proxy because the demo proxy was deleted after use. MCP is a second way into the same account, not a shortcut around the dashboard.

### Step 6: route one request through the result

Everything so far provisions a proxy; it doesn't prove a byte moved through it. Closing the loop takes one ordinary HTTP request through the username MCP just created:

```python
username = "2xt-customer-[CLIENT_ID]-proxy-de-baden-agent-demo"
proxies = {"http": f"http://{username}:{password}@proxy.2extract.net:5555",
           "https": f"http://{username}:{password}@proxy.2extract.net:5555"}
response = requests.get("https://httpbin.org/ip", proxies=proxies, timeout=30)
print(response.json())
```

```json
{"origin": "89.204.xx.xx"}
```

That IP resolves to a Baden-Württemberg ISP block, which confirms that the region MCP looked up, and the proxy MCP created, is where the request exits. The Python pipelines below log the same `exit.*` field on every row for exactly this reason.

[ADD YOUR OWN: the IP lookup result (ipinfo or similar, IP partly masked) showing the Baden-Württemberg ISP and region for the exit above]

## Three pipelines, three different datasets

The rest of this post uses the same account, driven by code instead of an agent: three pipelines built on one client, for anyone who wants to own the collection logic.

### Geo and address: proof of exit location

`_rotating_geo_targeting` generates a fresh session ID per hop, which forces 2extract to assign a new exit IP. `scrape_steam_price` fetches a Steam store page for a given country and pulls the displayed price, falling back to a second selector if the first doesn't match.

```python
def _rotating_geo_targeting(country: str) -> Targeting:
    """A fresh -session id forces 2extract to assign a new exit IP for this hop."""
    return Targeting(country=country, session=uuid.uuid4().hex[:12], time_minutes=1)

def scrape_steam_price(client, *, country, app_id="730", targeting=None):
    url = f"https://store.steampowered.com/app/{app_id}/"
    response = client.get(url, targeting=targeting or Targeting(country=country),
                           params={"cc": country}, timeout=45)
    soup = BeautifulSoup(response.text, "lxml")
    price = soup.select_one("div.game_purchase_price") or soup.select_one("[data-price-final]")
    return {"app_id": app_id, "price": price.get_text(strip=True) if price else None,
            "http_status": response.status_code}
```

A row from an actual checkpoint file. Note that the exit landed in Frankfurt (Hesse) for a country-level `de` request:

```json
{
  "row_number": 41,
  "collected_at": "2026-08-14T09:12:03Z",
  "label": "DE",
  "targeting": {"country": "de", "session": "a91fe2c7b1d4"},
  "exit": {"ip": "89.204.xx.xx", "city": "Frankfurt", "region": "Hesse"},
  "ok": true
}
```

### eCommerce and price monitoring

```python
def parse_price(text):
    raw = " ".join(str(text).split())
    currency = "GBP" if "£" in raw else "EUR" if "€" in raw else "USD" if "$" in raw else None
    match = re.search(r"[\d]+\.[\d]+|[\d]+", raw.replace(",", ""))
    value = float(match.group(0)) if match else None
    return raw, value, currency
```

Output lands in `data/output/eCommerce.xlsx`. Sessions stay sticky for the length of a category walk.

[ADD YOUR OWN: a screenshot of a few rows from eCommerce.xlsx showing the same product priced in two or three countries]

### Market research

This pipeline pulls from Hacker News through the Algolia API and from Open Food Facts. Its "sentiment" field is an engagement heuristic derived from points and comment counts. It is not a human-coded label and not an LLM classifier.

## From collected rows to a spreadsheet

Every pipeline writes a JSON checkpoint every hundred rows before touching Excel. That habit has saved a multi-hour run from a crashed `openpyxl` write more than once. The JSON-to-Excel step deliberately does no new computation; it only formats data that has already been collected and validated.

## How the package is organized

![Architecture: three pipelines share one ExtractClient, and JSON checkpoints make dataset generation reproducible](https://i0.wp.com/app.dataengineerhub.blog/wp-content/uploads/2026/09/2exrtract-2-4-1024x402.png?resize=1024%2C402&ssl=1)

None of the three pipeline scripts talk to `requests` directly. They all go through a single `ExtractClient` that owns authentication, retry behavior and username construction. That boundary is the reason adding the market research pipeline took an afternoon instead of a week.

## Residential, mobile or datacenter: the tradeoffs

|  | Datacenter | Residential | Mobile |
| --- | --- | --- | --- |
| Exit looks like | Cloud ASN (AWS, GCP) | Home ISP connection | Carrier IP |
| Block / CAPTCHA rate | Highest | Low | Lowest |
| Typical cost | Cheapest | Mid | Highest |
| Targeting granularity | Data center location only | Country / state / city / ZIP | Carrier (ISP code) only |
| Best fit | Low-stakes internal jobs | eCommerce, geo, market research | Mobile-specific SERPs, app traffic |

## Where this breaks

Country targeting is a request to the gateway, not a guarantee that a specific city lands on every hop. The only trustworthy record of where a request exited is the `exit.*` data that comes back, and it belongs in every row you store.

JSON APIs like DummyJSON and Open Food Facts still return a bare `403` without a properly set User-Agent, proxy or not.

Matching "the same product" across two catalogs by name and brand is a heuristic, not an identity.

And a proxy changes your odds of getting a response, not your obligation to respect what a site's terms of service say.

## How this was tested

Every pipeline described above was run end to end against a live 2extract account: real wallet balance, real proxy status states, real 407s along the way. The MCP walkthrough ran against the same account in the same session, and the balance, geo slugs and traffic figures shown are what the account returned, not stand-ins. The full source is on [GitHub](https://github.com/sainath-reddiee/2extract) under an MIT-style layout you can clone and rerun against your own account.

[ADD YOUR OWN: what the full runs of the three pipelines cost from the usage tab (rows collected and dollars spent), so readers can estimate cost per 1,000 rows]

## Questions worth asking before production

### Does 2extract scrape websites for me?

No. It is a proxy network that routes requests through residential or mobile exit IPs. Parsing, deduplication and storage stay the collector's job.

### Does 2extract have an MCP server for agents like Claude, Cursor or Codex?

Yes. `mcp.2extract.com` exposes the same account (balance, proxies, geo catalog, traffic history) as tools any MCP-capable agent can call, as shown in the walkthrough above. It is the same wallet and the same billing as the Python package; MCP hands the control plane to the agent instead of a human writing the client.

### Why does a request get a 407 when the password is definitely right?

In practice it almost always means the proxy is set to Inactive in the dashboard, the wallet balance has run out, or the username carries malformed or conflicting targeting parameters.

### Can country targeting and mobile ISP targeting live on the same proxy?

No. Geographic targeting and network targeting are mutually exclusive on a single username, and mobile ISP targeting needs its own dedicated proxy credential as well.

### Do I need a separate proxy for every country?

No. One residential proxy covers every supported country. Targeting is a parameter appended per request, not a separate product bought per market.

### Does a residential proxy make scraping any site legally safe?

No. A proxy changes which IP a target sees; it has no bearing on robots.txt, a site's terms of service or copyright law.

## Further reading

- [2extract quick start](https://docs.2extract.com/getting-started/quick-start.md)
- [Geo targeting reference](https://docs.2extract.com/proxy-products/configuration/geo-targeting.md)
- [407 errors, explained](https://docs.2extract.com/help/common-problems/407-proxy-authentication-required.md)
- [2extract MCP server](https://mcp.2extract.com)
- [Full source on GitHub](https://github.com/sainath-reddiee/2extract)

Pricing, account limits and interface details in this article reflect 2extract's dashboard as of September 2026, captured while writing and testing the code above against a live account. Treat this as a guide to the architecture and integration pattern rather than a live pricing reference. Vendors update rates and UI labels independently of when an article is published, so confirm current numbers on the dashboard before budgeting a production run.
