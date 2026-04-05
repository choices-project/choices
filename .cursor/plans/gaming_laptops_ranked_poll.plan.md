---
name: ""
overview: ""
todos: []
isProject: false
---

# Pre-populate Choices with a Ranked-Choice Gaming Laptops Poll (2026)

**Research and plan date:** March 2026. All deal/pricing data below is from searches run for **2026** (current year).

---

## Research summary: top 5 by quality, price (2026) — accurate data only

**Policy:** Poll options use **list/starting prices only** (verifiable on product pages). We do **not** include specific coupon codes in the poll; codes expire and often don't apply to all configs. Users should check each retailer's official coupon/deals page at time of purchase.

**Current active Lenovo codes (verify at checkout):**

- **Official Lenovo eCoupon page (source of truth):** [https://www.lenovo.com/us/en/d/deals/lenovo-coupon-codes/](https://www.lenovo.com/us/en/d/deals/lenovo-coupon-codes/)
- In your test (Mar 2026), **EXTRAFIVE** applied for 5% off ($1,559.99 → $1,481.99). **GAMINGDEALS** was invalid/expired. Always confirm codes on Lenovo's page or at checkout.

Sources: PCMag, Wirecutter/NYT, PC Guide, Best Buy, Newegg, Walmart, Lenovo product pages (2026).


| Rank | Model                              | Why it's in the top 5                                           | List / verifiable price (2026)     | Product / retailer links                                                                                                                                                                                                                                                                                                                                                                                                               |
| ---- | ---------------------------------- | --------------------------------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | **Lenovo Legion 5i RTX 5070 OLED** | RTX 5070, 15" 2.5K OLED 165Hz; strong value.                    | **From $1,559.99** (Lenovo.com)    | [Lenovo US](https://www.lenovo.com/us/en/p/laptops/legion-laptops/legion-5-series/lenovo-legion-5i-gen-10-(15-inch-intel)/len101g0042), [Walmart](https://www.walmart.com/ip/Lenovo-Legion-5i-Gen-10-Gaming-Laptop-Intel-Ultra-7-255HX-16-GB-DDR5-RAM-2-TB-PCIe-SSD-15-1-WQXGA-2560x1600-Display-Nvidia-G-Force-RTX-5070-24-Zone-R/18061602804). Coupons: [Lenovo eCoupons](https://www.lenovo.com/us/en/d/deals/lenovo-coupon-codes/) |
| 2    | **HP Omen MAX RTX 5070**           | RTX 5070, 32GB DDR5, 240Hz; strong price-to-performance.        | **From ~$1,699**                   | [PC Guide deal roundup](https://www.pcguide.com/deals/rtx-5070-powered-hp-omen-max-gaming-laptop-with-32gb-of-ddr5-crashes-under-1700-with-amazon-deal/) — verify current price on HP/Amazon.                                                                                                                                                                                                                                          |
| 3    | **Acer Nitro V 16S AI RTX 5060**   | RTX 5060, 180Hz, 32GB DDR5 or 16GB; AAA at medium–high.         | **From ~$1,044–1,199** (config)    | [Amazon](https://www.amazon.com/acer-Nitro-16S-Processor-GeForce/dp/B0G4V6ZFP2), [Acer US](https://www.acer.com/us-en/laptops/nitro/nitro-v-16s-intel) — confirm price on product page.                                                                                                                                                                                                                                                |
| 4    | **ASUS ROG Zephyrus G14 RTX 5060** | 14" 3K OLED 120Hz, portable; RTX 5060.                          | **Check Best Buy / ASUS** (varies) | [Best Buy](https://www.bestbuy.com/product/asus-rog-zephyrus-g14-14-oled-3k-120hz-gaming-laptop-amd-ryzen-9-270-16gb-lpddr5x-geforce-rtx-5060-1tb-ssd-platinum-white/JJGGLH72GT/sku/6629420), [ROG 2026](https://rog.asus.com/ca-en/laptops/rog-zephyrus/rog-zephyrus-g14-2026-gu405/)                                                                                                                                                 |
| 5    | **MSI Vector 16 HX AI RTX 5080**   | RTX 5080, Core Ultra 9 275HX, 240Hz QHD+; top-tier performance. | **From ~$2,249** (sale pricing)    | [PC Guide](https://www.pcguide.com/deals/hugely-powerful-rtx-5080-laptop-with-intel-core-ultra-9-275hx-is-just-2249-in-newegg-deal/) — verify on Newegg.                                                                                                                                                                                                                                                                               |


All five use **RTX 50-series** (5060/5070/5080) and meet current game hardware demands (including Baldur's Gate 3). **Do not embed coupon codes in poll option text;** point users to retailer coupon pages for current offers.

---

## Baldur's Gate 3 compatibility

- **Official system requirements:** [https://baldursgate3.game/support/system-requirements_47](https://baldursgate3.game/support/system-requirements_47)  
- **Larian support (same):** [https://larian.com/support/faqs/system-requirements_47](https://larian.com/support/faqs/system-requirements_47)  
- Recommended: RTX 2060 Super (8GB VRAM) for 1080p high/ultra. All five laptops above exceed this.

---

## Implementation (unchanged)

- **New seed script:** `web/scripts/seed-gaming-laptops-poll.ts` — same env and `created_by` resolution as [web/scripts/seed-constituent-will-polls.ts](web/scripts/seed-constituent-will-polls.ts). Insert one poll with `voting_method: 'ranked_choice'`, `poll_type: 'standard'`, and five `poll_options`.
- **Poll content (five options)** — use the five models above; **list/verifiable prices only, no coupon claims.** Keep option text under ~100 characters, e.g.:
  1. Lenovo Legion 5i Gen 10 — RTX 5070 OLED, from $1,559.99
  2. HP Omen MAX — RTX 5070, 32GB, 240Hz, from ~$1,699
  3. Acer Nitro V 16S AI — RTX 5060, 180Hz, from ~$1,044
  4. ASUS ROG Zephyrus G14 — RTX 5060, 14" 3K OLED, portable
  5. MSI Vector 16 HX AI — RTX 5080, 240Hz QHD+, from ~$2,249
- **Poll description:** Add one line: "Prices are list/starting; check retailer sites for current coupons and deals (e.g. Lenovo: lenovo.com/us/en/d/deals/lenovo-coupon-codes/)."
- **npm script:** `"seed:gaming": "tsx scripts/seed-gaming-laptops-poll.ts"` in [web/package.json](web/package.json).
- **Idempotency:** Skip if a poll with same title or `primary_hashtag` already exists.

No API or feed changes required; ranked polls and standard public polls are already supported.
