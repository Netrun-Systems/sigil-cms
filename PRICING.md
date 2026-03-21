# Sigil CMS — Pricing

## Self-Hosted (Free Forever)

**$0/month. No limits. No catch.**

Self-host Sigil on your own infrastructure — unlimited users, unlimited sites, unlimited content. You own your data, your deployment, your destiny.

### Self-Hosting Templates

| Platform | Monthly Cost | Setup Time | Template |
|----------|-------------|------------|----------|
| **Local VM / NUC / Raspberry Pi** | $0 (your hardware) | 15 min | `sigil create --template local` |
| **Google Cloud Run** (scale-to-zero) | ~$0-5/mo | 10 min | `sigil create --template gcp` |
| **AWS Fargate** (scale-to-zero) | ~$3-8/mo | 15 min | `sigil create --template aws` |
| **Azure Container Apps** | ~$5-10/mo | 15 min | `sigil create --template azure` |
| **Fly.io** | ~$3-5/mo | 5 min | `sigil create --template fly` |
| **Railway** | ~$5/mo | 5 min | `sigil create --template railway` |
| **DigitalOcean App Platform** | ~$5-12/mo | 10 min | `sigil create --template digitalocean` |
| **Docker Compose** (any VPS) | ~$5-10/mo (VPS cost) | 10 min | `sigil create --template docker` |
| **Coolify / Dokku** (self-managed PaaS) | $0 + VPS cost | 15 min | `sigil create --template coolify` |

**Why self-hosting costs almost nothing:**
- Sigil runs on Node.js + PostgreSQL — no proprietary dependencies
- Scale-to-zero on Cloud Run / Fargate means you only pay when someone visits the admin
- A $5/mo VPS handles thousands of page views (PostgreSQL + Node.js is lightweight)
- Media storage: use your own S3/GCS/Azure Blob — pennies per GB

**Compare to competitors' self-hosting costs:**
- Strapi self-hosted: Same stack, similar cost — but no Design Playground, no multi-tenancy, no Resonance analytics
- Payload self-hosted: Requires MongoDB (heavier) or PostgreSQL
- Sanity: **Cannot self-host** — cloud-only, starts at $15/user/month

---

## Cloud-Hosted Plans

For teams that want managed hosting, automatic updates, and priority support.

| Feature | **Starter** | **Team** | **Business** | **Enterprise** |
|---------|-------------|----------|--------------|----------------|
| **Price** | **Free** | **$29/mo** | **$79/mo** | **$249/mo** |
| **Seats** | 3 | 10 | 25 | Unlimited |
| **Sites** | 1 | 5 | 25 | Unlimited |
| **Content items** | 1,000 | 10,000 | 100,000 | Unlimited |
| **Media storage** | 1 GB | 10 GB | 100 GB | 1 TB |
| **API calls** | 50K/mo | 500K/mo | 5M/mo | Unlimited |
| **Custom domain** | - | Yes | Yes | Yes |
| **Plugins** | Core (8) | All (19) | All (19) | All + custom |
| **GraphQL API** | Yes | Yes | Yes | Yes |
| **Content scheduling** | - | Yes | Yes | Yes |
| **Resonance analytics** | - | - | Yes | Yes |
| **Design Playground** | Basic | Full | Full | Full + white-label |
| **Multi-tenancy** | - | - | Yes | Yes |
| **SSO (SAML/OIDC)** | - | - | - | Yes |
| **Audit logs** | - | - | Yes | Yes |
| **Priority support** | Community | Email (48h) | Email (24h) | Dedicated (4h SLA) |
| **SLA** | - | 99.5% | 99.9% | 99.95% |

---

## Why We're Cheaper

Sigil is built with radical efficiency. One engineer + 20 AI agents built the entire platform under SDLC v2.3 governance. Our infrastructure runs on scale-to-zero Cloud Run — we pay almost nothing when your site is idle. We pass those savings to you.

**Monthly overhead per customer:**
- Cloud Run (idle): ~$0.50/mo
- Cloud Run (active admin): ~$2-5/mo
- PostgreSQL (shared): ~$0.50/mo per site
- Media CDN: usage-based (pennies)
- **Total: ~$1-6/mo per customer**

That's why we can offer 10 seats at $29/mo while Sanity charges $15/user/mo ($150 for 10 users). It's not a loss leader — it's real efficiency.

---

## Competitor Comparison

| Feature | **Sigil $29** | Strapi $29 | Sanity $150 | Payload $35 |
|---------|--------------|------------|-------------|-------------|
| Seats | **10** | 5 | 10 ($15/ea) | 3 |
| Sites | **5** | 1 | 1 project | 1 |
| GraphQL | **Yes** | Yes | Yes (GROQ) | Yes |
| Design editor | **Yes** | No | No | No |
| Multi-tenancy | Team+ | No | No | No |
| Content scheduling | **Yes** | Enterprise only | Yes | Yes |
| Block analytics | **Yes** (Resonance) | No | No | No |
| 19 vertical plugins | **Yes** | Marketplace | No | Marketplace |
| Self-host option | **Free, unlimited** | Free, unlimited | No | Free, unlimited |
| AI advisor | **Yes** (Charlotte) | No | Sanity AI (add-on) | No |

---

## FAQ

**Q: Is the free self-hosted tier really unlimited?**
A: Yes. No user limits, no site limits, no content limits, no API call limits. The code is the same as the paid cloud version. We make money when you choose to let us host it for you.

**Q: Can I start self-hosted and migrate to cloud later?**
A: Yes. `sigil migrate --to-cloud` exports your database and media, provisions your cloud instance, and imports everything. Takes about 10 minutes.

**Q: What if I need more seats on the Starter plan?**
A: Upgrade to Team ($29/mo for 10 seats). No per-seat pricing at any tier.

**Q: Do you offer annual billing?**
A: Yes. 2 months free on annual plans (save 17%).

---

*Pricing effective March 2026. All plans include the TypeScript SDK, CLI, GraphQL API, REST API, and Next.js integration.*
