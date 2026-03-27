#!/usr/bin/env python3
"""
Sigil CMS Feature Tour v2 — Generate 15 screenshots + podcast script.
Covers 22 plugins, 49 admin pages, full platform ecosystem.
"""

import json
import os
from PIL import Image, ImageDraw, ImageFont

# === CONSTANTS ===
W = 1920
H_STD = 1080
SIDEBAR_W = 260
CONTENT_X = SIDEBAR_W + 40
CONTENT_W = W - SIDEBAR_W - 80

# Colors (Sigil design system)
BG = "#0a0a0a"
SIDEBAR_BG = "#111111"
SIDEBAR_HEADER = "#1a1a1a"
PRIMARY = "#90b9ab"
PRIMARY_DIM = "#5a8a7a"
CARD_BG = "#161616"
CARD_BORDER = "#222222"
TEXT_PRIMARY = "#e5e5e5"
TEXT_SECONDARY = "#a0a0a0"
TEXT_MUTED = "#666666"
SUCCESS = "#10b981"
WARNING = "#f59e0b"
ERROR = "#ef4444"
INFO = "#3b82f6"
PURPLE = "#a78bfa"
PINK = "#ec4899"
HOVER_BG = "#1e1e1e"
DARK_CARD = "#1a1a1a"

FONT_DIR = "/usr/share/fonts/truetype/dejavu/"
OUT_DIR = "/data/workspace/github/netrun-cms/studiocast/v2/screenshots/"
SCRIPT_PATH = "/data/workspace/github/netrun-cms/studiocast/v2/podcast_script.json"

os.makedirs(OUT_DIR, exist_ok=True)


# === FONTS ===
def font(size, bold=False):
    name = "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf"
    return ImageFont.truetype(FONT_DIR + name, size)


F_HERO = font(48, bold=True)
F_HERO_SUB = font(22)
F_TITLE = font(24, bold=True)
F_HEADING = font(18, bold=True)
F_SUBHEADING = font(16, bold=True)
F_BODY = font(14)
F_BODY_BOLD = font(14, bold=True)
F_SMALL = font(12)
F_SMALL_BOLD = font(12, bold=True)
F_TINY = font(10)
F_LOGO = font(28, bold=True)
F_STAT_NUM = font(32, bold=True)
F_NAV = font(13)
F_NAV_SECTION = font(10, bold=True)
F_PRICE = font(36, bold=True)
F_PRICE_TIER = font(20, bold=True)


# === HELPERS ===
def new_image(h=H_STD):
    img = Image.new("RGB", (W, h), BG)
    return img, ImageDraw.Draw(img)


def rr(draw, xy, fill=None, outline=None, radius=8, width=1):
    """Rounded rectangle shorthand."""
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def pill(draw, xy, fill, text_str, text_font=F_TINY, text_color="#0a0a0a"):
    """Draw a pill badge with centered text."""
    rr(draw, xy, fill=fill, radius=10)
    bx = (xy[0] + xy[2]) // 2
    by = (xy[1] + xy[3]) // 2
    bbox = text_font.getbbox(text_str)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text((bx - tw // 2, by - th // 2 - 1), text_str, fill=text_color, font=text_font)


def draw_logo(draw, x=20, y=15):
    rr(draw, [x, y, x + 35, y + 40], fill=PRIMARY, radius=10)
    draw.text((x + 8, y + 2), "S", fill="#0a0a0a", font=F_LOGO)
    draw.text((x + 45, y + 5), "Sigil", fill=TEXT_PRIMARY, font=font(20, bold=True))
    draw.text((x + 45, y + 31), "by Netrun", fill=TEXT_MUTED, font=F_TINY)


# Full navigation for v2 — all 22 plugins organized
FULL_NAV = [
    ("MAIN", None),
    ("Dashboard", "grid"),
    ("Sites & Domains", "globe"),
    ("Media Library", "image"),
    ("Themes", "palette"),
    ("Pages", "file"),
    ("ARTIST CONTENT", None),
    ("Blog / Posts", "edit"),
    ("Portfolio", "camera"),
    ("Events Calendar", "calendar"),
    ("Mailing List", "mail"),
    ("Contact Forms", "inbox"),
    ("SEO Manager", "search"),
    ("ENGAGEMENT", None),
    ("Community Forum", "users"),
    ("Knowledge Base", "book"),
    ("Resonance Analytics", "chart"),
    ("STORE", None),
    ("Products (Stripe)", "cart"),
    ("Merch (Printful)", "shirt"),
    ("PayPal", "dollar"),
    ("BOOKING", None),
    ("Services", "clock"),
    ("Appointments", "cal"),
    ("BROADCASTING", None),
    ("Intirkast", "radio"),
    ("INTEGRATIONS", None),
    ("KOG CRM", "users"),
    ("KAMERA Scans", "scan"),
    ("Charlotte AI", "bot"),
    ("Support Panel", "help"),
    ("SYSTEM", None),
    ("Migration Tool", "import"),
    ("Webhooks", "link"),
    ("Marketplace", "puzzle"),
    ("Billing", "card"),
]


def draw_sidebar(draw, active_label="Dashboard", h=H_STD):
    draw.rectangle([0, 0, SIDEBAR_W, h], fill=SIDEBAR_BG)
    draw.rectangle([0, 0, SIDEBAR_W, 70], fill=SIDEBAR_HEADER)
    draw_logo(draw)
    draw.line([20, 75, SIDEBAR_W - 20, 75], fill="#222222", width=1)

    y = 85
    for label, icon in FULL_NAV:
        if y > h - 10:
            break
        if icon is None:
            # Section header
            draw.text((20, y + 2), label, fill=TEXT_MUTED, font=F_NAV_SECTION)
            y += 24
            continue

        if label == active_label:
            rr(draw, [12, y, SIDEBAR_W - 12, y + 32], fill="#1a2e27", radius=6)
            draw.rectangle([4, y + 6, 6, y + 26], fill=PRIMARY)
            color = PRIMARY
        else:
            color = TEXT_SECONDARY

        # Icon dot
        draw.ellipse([24, y + 10, 32, y + 18], fill=color if label == active_label else TEXT_MUTED)
        draw.text((42, y + 7), label, fill=color, font=F_NAV)
        y += 36

    return y


def draw_topbar(draw, title, breadcrumb=None, y=20):
    x = CONTENT_X
    if breadcrumb:
        draw.text((x, y), breadcrumb, fill=TEXT_MUTED, font=F_SMALL)
        y += 20
    draw.text((x, y), title, fill=TEXT_PRIMARY, font=F_TITLE)
    draw.line([x, y + 38, x + CONTENT_W, y + 38], fill="#222222", width=1)
    return y + 50


def draw_stat_card(draw, x, y, w, label, value, color=PRIMARY):
    rr(draw, [x, y, x + w, y + 90], fill=CARD_BG, outline=CARD_BORDER, radius=10)
    draw.text((x + 16, y + 14), value, fill=color, font=F_STAT_NUM)
    draw.text((x + 16, y + 58), label, fill=TEXT_SECONDARY, font=F_SMALL)


def draw_table_header(draw, x, y, cols, widths):
    """Draw a table header row."""
    rr(draw, [x, y, x + sum(widths), y + 36], fill=DARK_CARD, radius=6)
    cx = x + 16
    for col, w in zip(cols, widths):
        draw.text((cx, y + 10), col, fill=TEXT_MUTED, font=F_SMALL_BOLD)
        cx += w
    return y + 40


def draw_table_row(draw, x, y, cells, widths, colors=None):
    cx = x + 16
    for i, (cell, w) in enumerate(zip(cells, widths)):
        c = colors[i] if colors else TEXT_SECONDARY
        draw.text((cx, y + 10), cell, fill=c, font=F_BODY)
        cx += w
    draw.line([x + 10, y + 36, x + sum(widths) - 10, y + 36], fill="#1a1a1a", width=1)
    return y + 40


# ============================================================
# SCENE 1: Landing Page (1920x1080 static)
# ============================================================
def scene_01_landing():
    img, d = new_image()

    # Full-width dark background with subtle grid
    for gx in range(0, W, 60):
        d.line([gx, 0, gx, H_STD], fill="#0d0d0d", width=1)
    for gy in range(0, H_STD, 60):
        d.line([0, gy, W, gy], fill="#0d0d0d", width=1)

    # Top nav bar
    rr(d, [0, 0, W, 64], fill="#0a0a0aee", radius=0)
    rr(d, [40, 12, 75, 52], fill=PRIMARY, radius=10)
    d.text((48, 14), "S", fill="#0a0a0a", font=F_LOGO)
    d.text((85, 20), "Sigil", fill=TEXT_PRIMARY, font=font(22, bold=True))
    nav_links = ["Features", "Plugins", "Pricing", "Docs", "Blog"]
    nx = 600
    for nl in nav_links:
        d.text((nx, 22), nl, fill=TEXT_SECONDARY, font=F_BODY)
        nx += 120
    rr(d, [W - 200, 16, W - 40, 48], fill=PRIMARY, radius=20)
    d.text((W - 170, 22), "Get Started", fill="#0a0a0a", font=F_BODY_BOLD)

    # Hero section
    hero_y = 180
    hero_text = "Build Anything."
    hero_text2 = "Own Everything."
    d.text((W // 2 - 340, hero_y), hero_text, fill=TEXT_PRIMARY, font=F_HERO)
    d.text((W // 2 - 300, hero_y + 64), hero_text2, fill=PRIMARY, font=F_HERO)

    sub = "Multi-tenant headless CMS with 22 plugins. Self-host free, or cloud from $12/mo."
    d.text((W // 2 - 380, hero_y + 150), sub, fill=TEXT_SECONDARY, font=F_HERO_SUB)

    # CTA buttons
    btn_y = hero_y + 210
    rr(d, [W // 2 - 200, btn_y, W // 2 - 20, btn_y + 50], fill=PRIMARY, radius=25)
    d.text((W // 2 - 170, btn_y + 14), "Start Building", fill="#0a0a0a", font=F_BODY_BOLD)
    rr(d, [W // 2 + 20, btn_y, W // 2 + 200, btn_y + 50], fill=None, outline=PRIMARY, radius=25, width=2)
    d.text((W // 2 + 56, btn_y + 14), "View Demo", fill=PRIMARY, font=F_BODY_BOLD)

    # Stats bar
    stats_y = hero_y + 300
    rr(d, [200, stats_y, W - 200, stats_y + 80], fill=CARD_BG, outline=CARD_BORDER, radius=12)
    stats = [("22", "Plugins"), ("70+", "Google Fonts"), ("49", "Admin Pages"), ("$0", "Self-Host")]
    sx = 280
    for val, lbl in stats:
        d.text((sx, stats_y + 12), val, fill=PRIMARY, font=font(26, bold=True))
        d.text((sx, stats_y + 48), lbl, fill=TEXT_SECONDARY, font=F_SMALL)
        sx += 340

    # Feature grid preview
    fy = stats_y + 120
    feat_cards = [
        ("Block Editor", "Composable content blocks with inline editing"),
        ("Design Playground", "70+ fonts, button shapes, spacing controls"),
        ("Plugin Marketplace", "22 env-gated plugins, zero-config activation"),
        ("Resonance Analytics", "Block-level heatmaps and A/B testing"),
        ("Commerce Suite", "Stripe, Printful, PayPal, Booking"),
        ("Community Forum", "Gated discussions, reputation, magic-link auth"),
    ]
    col = 0
    row_y = fy
    for title, desc in feat_cards:
        fx = 200 + col * 520
        rr(d, [fx, row_y, fx + 490, row_y + 90], fill=CARD_BG, outline=CARD_BORDER, radius=10)
        d.ellipse([fx + 16, row_y + 16, fx + 32, row_y + 32], fill=PRIMARY)
        d.text((fx + 44, row_y + 14), title, fill=TEXT_PRIMARY, font=F_BODY_BOLD)
        d.text((fx + 44, row_y + 38), desc, fill=TEXT_SECONDARY, font=F_SMALL)
        col += 1
        if col >= 3:
            col = 0
            row_y += 105

    img.save(OUT_DIR + "01-landing.png", optimize=True)
    print("  01-landing.png")


# ============================================================
# SCENE 2: Admin Dashboard (1920x2400 TALL - scrollable)
# ============================================================
def scene_02_dashboard():
    h = 2400
    img, d = new_image(h)
    draw_sidebar(d, "Dashboard", h)
    cy = draw_topbar(d, "Dashboard", "Admin / Dashboard")

    # Stats row
    card_w = (CONTENT_W - 60) // 4
    stats = [("12", "Total Sites"), ("148", "Pages"), ("1.2 GB", "Media Used"), ("22", "Active Plugins")]
    colors = [PRIMARY, INFO, WARNING, SUCCESS]
    for i, (val, lbl) in enumerate(stats):
        sx = CONTENT_X + i * (card_w + 20)
        draw_stat_card(d, sx, cy, card_w, lbl, val, colors[i])
    cy += 110

    # Quick actions row
    d.text((CONTENT_X, cy), "Quick Actions", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 32
    actions = ["New Site", "New Page", "Upload Media", "Design Playground", "Invite User"]
    ax = CONTENT_X
    for act in actions:
        bw = len(act) * 9 + 36
        rr(d, [ax, cy, ax + bw, cy + 36], fill=None, outline=PRIMARY, radius=18, width=1)
        d.text((ax + 18, cy + 9), act, fill=PRIMARY, font=F_SMALL)
        ax += bw + 12
    cy += 60

    # Recent activity
    d.text((CONTENT_X, cy), "Recent Activity", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 32
    rr(d, [CONTENT_X, cy, CONTENT_X + CONTENT_W, cy + 460], fill=CARD_BG, outline=CARD_BORDER, radius=10)
    activities = [
        ("Page updated", "Homepage — netrunsystems.com", "2 min ago", INFO),
        ("Media uploaded", "hero-banner.webp (420 KB)", "8 min ago", SUCCESS),
        ("Plugin activated", "Resonance Analytics", "15 min ago", PRIMARY),
        ("Theme saved", "Netrun Dark preset modified", "22 min ago", PURPLE),
        ("Site published", "portfolio.sigil.dev", "30 min ago", SUCCESS),
        ("Product created", "Cloud Audit Package — $299", "45 min ago", WARNING),
        ("Blog post published", "Migrating from WordPress to Sigil", "1 hr ago", INFO),
        ("Booking confirmed", "Strategy Consultation — Mar 28", "1.5 hr ago", PINK),
        ("Community post", "New discussion: CI/CD best practices", "2 hr ago", PURPLE),
        ("Webhook fired", "page.published → Slack notification", "2.5 hr ago", TEXT_MUTED),
        ("Form submission", "Contact form — inquiry from Acme Corp", "3 hr ago", SUCCESS),
        ("Migration completed", "WordPress import — 47 posts, 12 pages", "4 hr ago", PRIMARY),
    ]
    ay = cy + 16
    for act_title, act_detail, act_time, act_color in activities:
        d.ellipse([CONTENT_X + 20, ay + 6, CONTENT_X + 28, ay + 14], fill=act_color)
        d.text((CONTENT_X + 38, ay), act_title, fill=TEXT_PRIMARY, font=F_BODY_BOLD)
        d.text((CONTENT_X + 38, ay + 20), act_detail, fill=TEXT_SECONDARY, font=F_SMALL)
        d.text((CONTENT_X + CONTENT_W - 120, ay + 4), act_time, fill=TEXT_MUTED, font=F_TINY)
        ay += 38
    cy += 480

    # Sites overview table
    d.text((CONTENT_X, cy), "Sites Overview", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 32
    cols = ["Site Name", "Domain", "Status", "Pages", "Storage", "Last Updated"]
    widths = [250, 300, 100, 80, 100, 200]
    cy = draw_table_header(d, CONTENT_X, cy, cols, widths)
    sites = [
        ("Netrun Systems", "netrunsystems.com", "Published", "24", "340 MB", "2 min ago"),
        ("Sigil Docs", "docs.sigil.dev", "Published", "67", "120 MB", "1 hr ago"),
        ("Portfolio", "portfolio.sigil.dev", "Published", "12", "85 MB", "30 min ago"),
        ("KOG Landing", "kog.netrunsystems.com", "Published", "8", "45 MB", "2 hr ago"),
        ("Staging", "staging.sigil.dev", "Draft", "31", "200 MB", "15 min ago"),
        ("Client Demo", "demo.sigil.dev", "Draft", "6", "15 MB", "1 day ago"),
    ]
    for site_name, domain, status, pages, storage, updated in sites:
        status_color = SUCCESS if status == "Published" else WARNING
        cy = draw_table_row(d, CONTENT_X, cy,
                            [site_name, domain, status, pages, storage, updated],
                            widths,
                            [TEXT_PRIMARY, PRIMARY, status_color, TEXT_SECONDARY, TEXT_SECONDARY, TEXT_MUTED])
    cy += 30

    # Plugin status grid
    d.text((CONTENT_X, cy), "Plugin Status", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 32
    plugins = [
        ("Blog", True), ("Portfolio", True), ("Events", True), ("Mailing List", True),
        ("Contact Forms", True), ("SEO", True), ("Store (Stripe)", True), ("Merch (Printful)", True),
        ("PayPal", False), ("Booking", True), ("Community", True), ("Knowledge Base", True),
        ("Resonance", True), ("Intirkast", True), ("KOG CRM", True), ("KAMERA", True),
        ("Charlotte AI", True), ("Support", True), ("Migration", True), ("Webhooks", True),
        ("Marketplace", True), ("Billing", True),
    ]
    px = CONTENT_X
    for pname, active in plugins:
        pw = len(pname) * 8 + 50
        if px + pw > CONTENT_X + CONTENT_W:
            px = CONTENT_X
            cy += 38
        rr(d, [px, cy, px + pw, cy + 30], fill="#1a2e27" if active else CARD_BG,
           outline=PRIMARY if active else CARD_BORDER, radius=15)
        dot_color = SUCCESS if active else TEXT_MUTED
        d.ellipse([px + 10, cy + 10, px + 18, cy + 18], fill=dot_color)
        d.text((px + 24, cy + 7), pname, fill=PRIMARY if active else TEXT_MUTED, font=F_SMALL)
        px += pw + 10
    cy += 60

    # System health
    d.text((CONTENT_X, cy), "System Health", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 32
    rr(d, [CONTENT_X, cy, CONTENT_X + CONTENT_W, cy + 200], fill=CARD_BG, outline=CARD_BORDER, radius=10)
    health_items = [
        ("API Server", "Healthy", "Response: 42ms", SUCCESS),
        ("PostgreSQL", "Connected", "Pool: 8/20 active", SUCCESS),
        ("Blob Storage", "Connected", "1.2 GB / 10 GB", SUCCESS),
        ("Email (ACS)", "Connected", "Quota: 842/1000 daily", WARNING),
        ("Stripe API", "Connected", "Webhook verified", SUCCESS),
    ]
    hy = cy + 16
    for h_name, h_status, h_detail, h_color in health_items:
        d.ellipse([CONTENT_X + 20, hy + 6, CONTENT_X + 28, hy + 14], fill=h_color)
        d.text((CONTENT_X + 38, hy), h_name, fill=TEXT_PRIMARY, font=F_BODY_BOLD)
        d.text((CONTENT_X + 220, hy), h_status, fill=h_color, font=F_BODY)
        d.text((CONTENT_X + 380, hy), h_detail, fill=TEXT_MUTED, font=F_SMALL)
        hy += 36

    img.save(OUT_DIR + "02-dashboard.png", optimize=True)
    print("  02-dashboard.png")


# ============================================================
# SCENE 3: Sites & Domains (1920x1080 static)
# ============================================================
def scene_03_sites():
    img, d = new_image()
    draw_sidebar(d, "Sites & Domains")
    cy = draw_topbar(d, "Sites & Domains", "Admin / Sites")

    # Action bar
    rr(d, [CONTENT_X, cy, CONTENT_X + 140, cy + 36], fill=PRIMARY, radius=18)
    d.text((CONTENT_X + 18, cy + 9), "+ New Site", fill="#0a0a0a", font=F_BODY_BOLD)
    cy += 56

    sites = [
        {
            "name": "Netrun Systems", "domain": "netrunsystems.com",
            "ssl": True, "verified": True, "status": "Published",
            "pages": 24, "storage": "340 MB", "updated": "2 min ago",
            "desc": "Corporate site — services, team, case studies"
        },
        {
            "name": "Sigil Documentation", "domain": "docs.sigil.dev",
            "ssl": True, "verified": True, "status": "Published",
            "pages": 67, "storage": "120 MB", "updated": "1 hr ago",
            "desc": "Plugin API docs, guides, tutorials"
        },
        {
            "name": "Client Demo", "domain": "demo.sigil.dev",
            "ssl": True, "verified": False, "status": "Draft",
            "pages": 6, "storage": "15 MB", "updated": "1 day ago",
            "desc": "Interactive demo environment for prospects"
        },
    ]

    for site in sites:
        card_h = 180
        rr(d, [CONTENT_X, cy, CONTENT_X + CONTENT_W, cy + card_h],
           fill=CARD_BG, outline=CARD_BORDER, radius=10)

        # Name and status badge
        d.text((CONTENT_X + 20, cy + 16), site["name"], fill=TEXT_PRIMARY, font=F_HEADING)
        status_color = SUCCESS if site["status"] == "Published" else WARNING
        sx = CONTENT_X + 20 + len(site["name"]) * 12 + 20
        pill(d, [sx, cy + 16, sx + 80, cy + 34], status_color, site["status"])

        # Domain row
        d.text((CONTENT_X + 20, cy + 48), site["domain"], fill=PRIMARY, font=F_BODY)
        ssl_x = CONTENT_X + 20 + len(site["domain"]) * 9 + 16
        if site["ssl"]:
            pill(d, [ssl_x, cy + 48, ssl_x + 40, cy + 64], SUCCESS, "SSL", text_color="#fff")
        ver_x = ssl_x + 50
        if site["verified"]:
            pill(d, [ver_x, cy + 48, ver_x + 70, cy + 64], SUCCESS, "Verified", text_color="#fff")
        else:
            pill(d, [ver_x, cy + 48, ver_x + 70, cy + 64], WARNING, "Pending", text_color="#0a0a0a")

        # Description
        d.text((CONTENT_X + 20, cy + 78), site["desc"], fill=TEXT_SECONDARY, font=F_SMALL)

        # Stats row
        d.text((CONTENT_X + 20, cy + 108), f"{site['pages']} pages", fill=TEXT_SECONDARY, font=F_BODY)
        d.text((CONTENT_X + 140, cy + 108), site["storage"], fill=TEXT_SECONDARY, font=F_BODY)
        d.text((CONTENT_X + 260, cy + 108), f"Updated {site['updated']}", fill=TEXT_MUTED, font=F_SMALL)

        # Action buttons
        btn_y = cy + 140
        actions = ["Edit", "Design", "Duplicate", "Settings"]
        bx = CONTENT_X + 20
        for act in actions:
            bw = len(act) * 8 + 24
            rr(d, [bx, btn_y, bx + bw, btn_y + 28], fill=None, outline=CARD_BORDER, radius=14, width=1)
            d.text((bx + 12, btn_y + 6), act, fill=TEXT_SECONDARY, font=F_SMALL)
            bx += bw + 10

        cy += card_h + 16

    img.save(OUT_DIR + "03-sites.png", optimize=True)
    print("  03-sites.png")


# ============================================================
# SCENE 4: Design Playground (1920x2400 TALL)
# ============================================================
def scene_04_design():
    h = 2400
    img, d = new_image(h)
    draw_sidebar(d, "Themes", h)
    cy = draw_topbar(d, "Design Playground", "Admin / Themes / Design Playground")

    # Tabs
    tabs = ["Presets", "Colors", "Typography", "Shapes", "Effects", "Spacing"]
    tx = CONTENT_X
    for i, tab in enumerate(tabs):
        tw = len(tab) * 10 + 30
        if i == 1:  # Colors active
            rr(d, [tx, cy, tx + tw, cy + 34], fill=PRIMARY, radius=17)
            d.text((tx + 15, cy + 8), tab, fill="#0a0a0a", font=F_BODY_BOLD)
        else:
            rr(d, [tx, cy, tx + tw, cy + 34], fill=None, outline=CARD_BORDER, radius=17, width=1)
            d.text((tx + 15, cy + 8), tab, fill=TEXT_SECONDARY, font=F_BODY)
        tx += tw + 10
    cy += 54

    # Split: Controls (left) + Preview (right)
    controls_w = 600
    preview_x = CONTENT_X + controls_w + 30
    preview_w = CONTENT_W - controls_w - 30

    # --- COLOR CONTROLS ---
    d.text((CONTENT_X, cy), "Color Palette", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 32

    color_rows = [
        ("Primary", "#90b9ab", PRIMARY),
        ("Secondary", "#1a1a1a", "#1a1a1a"),
        ("Accent", "#a78bfa", PURPLE),
        ("Background", "#0a0a0a", "#0a0a0a"),
        ("Surface", "#161616", CARD_BG),
        ("Text Primary", "#e5e5e5", TEXT_PRIMARY),
        ("Text Secondary", "#a0a0a0", TEXT_SECONDARY),
        ("Success", "#10b981", SUCCESS),
        ("Warning", "#f59e0b", WARNING),
        ("Error", "#ef4444", ERROR),
    ]

    for label, hex_val, color in color_rows:
        rr(d, [CONTENT_X, cy, CONTENT_X + controls_w, cy + 44],
           fill=CARD_BG, outline=CARD_BORDER, radius=8)
        # Color swatch
        rr(d, [CONTENT_X + 12, cy + 8, CONTENT_X + 40, cy + 36], fill=color, radius=6)
        d.text((CONTENT_X + 52, cy + 6), label, fill=TEXT_PRIMARY, font=F_BODY_BOLD)
        d.text((CONTENT_X + 52, cy + 24), hex_val, fill=TEXT_MUTED, font=F_TINY)
        # Input field
        rr(d, [CONTENT_X + controls_w - 140, cy + 8, CONTENT_X + controls_w - 12, cy + 36],
           fill="#0a0a0a", outline=CARD_BORDER, radius=4)
        d.text((CONTENT_X + controls_w - 130, cy + 13), hex_val, fill=TEXT_SECONDARY, font=F_SMALL)
        cy += 50
    cy += 20

    # --- BUTTON SHAPE PICKER ---
    d.text((CONTENT_X, cy), "Button Shape", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 32
    shapes = ["Square", "Rounded", "Pill"]
    radii = [2, 8, 25]
    bx = CONTENT_X
    for shape, rad in zip(shapes, radii):
        rr(d, [bx, cy, bx + 160, cy + 44], fill=PRIMARY if shape == "Pill" else CARD_BG,
           outline=PRIMARY, radius=rad, width=2)
        tc = "#0a0a0a" if shape == "Pill" else PRIMARY
        d.text((bx + 40, cy + 12), shape, fill=tc, font=F_BODY_BOLD)
        bx += 180
    cy += 64

    # --- FONT BROWSER (dropdown open) ---
    d.text((CONTENT_X, cy), "Typography", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 32
    d.text((CONTENT_X, cy), "Heading Font", fill=TEXT_SECONDARY, font=F_SMALL)
    cy += 20
    # Dropdown open
    rr(d, [CONTENT_X, cy, CONTENT_X + controls_w, cy + 36],
       fill="#0a0a0a", outline=PRIMARY, radius=6)
    d.text((CONTENT_X + 12, cy + 9), "Inter (Selected)", fill=TEXT_PRIMARY, font=F_BODY)
    d.text((CONTENT_X + controls_w - 30, cy + 9), "v", fill=TEXT_MUTED, font=F_BODY)
    cy += 40

    # Font list (dropdown items)
    fonts_list = [
        "Inter", "Poppins", "Space Grotesk", "Raleway", "Montserrat",
        "Playfair Display", "Lora", "Merriweather", "Source Serif 4",
        "Oswald", "Bebas Neue", "Permanent Marker",
        "JetBrains Mono", "Fira Code", "IBM Plex Mono",
    ]
    rr(d, [CONTENT_X, cy, CONTENT_X + controls_w, cy + len(fonts_list) * 32 + 10],
       fill="#0f0f0f", outline=CARD_BORDER, radius=8)
    fy = cy + 8
    for fname in fonts_list:
        if fname == "Inter":
            rr(d, [CONTENT_X + 4, fy - 2, CONTENT_X + controls_w - 4, fy + 26],
               fill="#1a2e27", radius=4)
            d.text((CONTENT_X + 16, fy + 2), fname, fill=PRIMARY, font=F_BODY)
        else:
            d.text((CONTENT_X + 16, fy + 2), fname, fill=TEXT_SECONDARY, font=F_BODY)
        fy += 32
    cy = fy + 20

    # --- HEADING SCALE SLIDERS ---
    d.text((CONTENT_X, cy), "Heading Scale", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 32
    headings = [("H1 Size", "3.2rem", 0.8), ("H2 Size", "2.4rem", 0.6), ("H3 Size", "1.8rem", 0.45),
                ("H4 Size", "1.4rem", 0.35), ("Body Size", "1rem", 0.25)]
    for h_label, h_val, ratio in headings:
        d.text((CONTENT_X, cy + 4), h_label, fill=TEXT_SECONDARY, font=F_SMALL)
        slider_x = CONTENT_X + 100
        slider_w = controls_w - 180
        # Track
        d.line([slider_x, cy + 14, slider_x + slider_w, cy + 14], fill="#333333", width=3)
        # Filled portion
        fill_w = int(slider_w * ratio)
        d.line([slider_x, cy + 14, slider_x + fill_w, cy + 14], fill=PRIMARY, width=3)
        # Thumb
        d.ellipse([slider_x + fill_w - 6, cy + 8, slider_x + fill_w + 6, cy + 20], fill=PRIMARY)
        # Value
        d.text((CONTENT_X + controls_w - 60, cy + 4), h_val, fill=TEXT_MUTED, font=F_SMALL)
        cy += 36
    cy += 20

    # --- SPACING CONTROLS ---
    d.text((CONTENT_X, cy), "Spacing", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 32
    spacing_items = [
        ("Section Padding", "80px", 0.65), ("Container Max-Width", "1200px", 0.75),
        ("Card Gap", "24px", 0.3), ("Block Margin", "32px", 0.4),
        ("Grid Columns", "12", 0.5), ("Sidebar Width", "260px", 0.35),
        ("Content Padding", "40px", 0.45),
    ]
    for s_label, s_val, s_ratio in spacing_items:
        d.text((CONTENT_X, cy + 4), s_label, fill=TEXT_SECONDARY, font=F_SMALL)
        slider_x = CONTENT_X + 160
        slider_w = controls_w - 240
        d.line([slider_x, cy + 14, slider_x + slider_w, cy + 14], fill="#333333", width=3)
        fill_w = int(slider_w * s_ratio)
        d.line([slider_x, cy + 14, slider_x + fill_w, cy + 14], fill=PRIMARY, width=3)
        d.ellipse([slider_x + fill_w - 6, cy + 8, slider_x + fill_w + 6, cy + 20], fill=PRIMARY)
        d.text((CONTENT_X + controls_w - 70, cy + 4), s_val, fill=TEXT_MUTED, font=F_SMALL)
        cy += 34

    # --- LIVE PREVIEW PANEL (right side) ---
    py = 130
    rr(d, [preview_x, py, preview_x + preview_w, py + 1800],
       fill="#0e0e0e", outline=CARD_BORDER, radius=12)
    d.text((preview_x + 16, py + 12), "Live Preview", fill=TEXT_MUTED, font=F_SMALL_BOLD)
    d.line([preview_x + 10, py + 36, preview_x + preview_w - 10, py + 36], fill=CARD_BORDER, width=1)

    # Mini hero in preview
    rr(d, [preview_x + 20, py + 50, preview_x + preview_w - 20, py + 220],
       fill="#1a2e27", radius=8)
    d.text((preview_x + 40, py + 80), "Your Brand", fill=PRIMARY, font=font(24, bold=True))
    d.text((preview_x + 40, py + 116), "Tagline goes here", fill=TEXT_SECONDARY, font=F_BODY)
    rr(d, [preview_x + 40, py + 150, preview_x + 180, py + 180], fill=PRIMARY, radius=20)
    d.text((preview_x + 60, py + 156), "Get Started", fill="#0a0a0a", font=F_SMALL_BOLD)

    # Mini cards in preview
    card_py = py + 240
    for i in range(3):
        cx = preview_x + 20 + i * (int((preview_w - 60) / 3) + 10)
        cw = int((preview_w - 60) / 3)
        rr(d, [cx, card_py, cx + cw, card_py + 120], fill=CARD_BG, outline=CARD_BORDER, radius=8)
        rr(d, [cx + 10, card_py + 10, cx + cw - 10, card_py + 60], fill="#222222", radius=4)
        d.text((cx + 10, card_py + 72), f"Feature {i + 1}", fill=TEXT_PRIMARY, font=F_SMALL_BOLD)
        d.text((cx + 10, card_py + 90), "Description text", fill=TEXT_MUTED, font=F_TINY)

    # Preview continues with typography samples
    ty = card_py + 150
    d.text((preview_x + 20, ty), "Typography Preview", fill=TEXT_MUTED, font=F_SMALL_BOLD)
    ty += 30
    d.text((preview_x + 20, ty), "Heading 1 Sample", fill=TEXT_PRIMARY, font=font(28, bold=True))
    ty += 40
    d.text((preview_x + 20, ty), "Heading 2 Sample", fill=TEXT_PRIMARY, font=font(22, bold=True))
    ty += 32
    d.text((preview_x + 20, ty), "Heading 3 Sample", fill=TEXT_PRIMARY, font=F_HEADING)
    ty += 28
    d.text((preview_x + 20, ty), "Body text sample — The quick brown fox jumps.", fill=TEXT_SECONDARY, font=F_BODY)

    img.save(OUT_DIR + "04-design.png", optimize=True)
    print("  04-design.png")


# ============================================================
# SCENE 5: Page Editor + Blocks (1920x2400 TALL)
# ============================================================
def scene_05_editor():
    h = 2400
    img, d = new_image(h)
    draw_sidebar(d, "Pages", h)
    cy = draw_topbar(d, "Edit Page: Homepage", "Admin / Pages / Homepage")

    # Page meta bar
    rr(d, [CONTENT_X, cy, CONTENT_X + CONTENT_W, cy + 44],
       fill=CARD_BG, outline=CARD_BORDER, radius=8)
    d.text((CONTENT_X + 16, cy + 12), "Slug: /", fill=TEXT_SECONDARY, font=F_SMALL)
    d.text((CONTENT_X + 60, cy + 12), "home", fill=TEXT_PRIMARY, font=F_SMALL)
    pill(d, [CONTENT_X + 140, cy + 10, CONTENT_X + 220, cy + 28], SUCCESS, "Published")
    d.text((CONTENT_X + CONTENT_W - 200, cy + 12), "Last saved: 2 min ago", fill=TEXT_MUTED, font=F_TINY)
    # Save button
    rr(d, [CONTENT_X + CONTENT_W - 80, cy + 8, CONTENT_X + CONTENT_W - 8, cy + 36],
       fill=PRIMARY, radius=16)
    d.text((CONTENT_X + CONTENT_W - 64, cy + 14), "Save", fill="#0a0a0a", font=F_SMALL_BOLD)
    cy += 60

    # Split: Block list (left) + Revision history (right sidebar)
    block_w = CONTENT_W - 280
    rev_x = CONTENT_X + block_w + 20
    rev_w = 260

    # Block list header
    d.text((CONTENT_X, cy), "Content Blocks", fill=TEXT_PRIMARY, font=F_HEADING)
    rr(d, [CONTENT_X + 160, cy - 2, CONTENT_X + 260, cy + 22], fill=PRIMARY, radius=12)
    d.text((CONTENT_X + 172, cy + 2), "+ Add Block", fill="#0a0a0a", font=F_SMALL_BOLD)
    cy += 36

    blocks = [
        {
            "type": "Hero", "expanded": True,
            "fields": [
                ("Headline", "Build Anything. Own Everything."),
                ("Subheadline", "Multi-tenant headless CMS with 22 plugins"),
                ("CTA Text", "Get Started"),
                ("CTA URL", "/signup"),
                ("Background", "hero-bg.webp"),
                ("Overlay Opacity", "60%"),
            ]
        },
        {"type": "Stats Bar", "expanded": False, "summary": "4 stat items — Sites, Pages, Plugins, Fonts"},
        {
            "type": "Feature Grid", "expanded": True,
            "fields": [
                ("Layout", "3-column grid"),
                ("Items", "6 feature cards"),
                ("Icon Style", "Filled circles"),
                ("Show Descriptions", "Yes"),
            ]
        },
        {"type": "Testimonials", "expanded": False, "summary": "3 client quotes with avatars"},
        {
            "type": "Pricing Table", "expanded": True,
            "fields": [
                ("Tiers", "4 — Free, Starter, Pro, Enterprise"),
                ("Highlight", "Pro tier"),
                ("Currency", "USD"),
                ("Billing Toggle", "Monthly / Annual"),
            ]
        },
        {"type": "CTA Banner", "expanded": False, "summary": "Full-width sage green CTA with button"},
        {"type": "FAQ Accordion", "expanded": False, "summary": "8 questions, collapsible"},
        {"type": "Footer", "expanded": False, "summary": "4-column footer with social links"},
    ]

    for block in blocks:
        if block["expanded"]:
            bh = 60 + len(block["fields"]) * 40
            rr(d, [CONTENT_X, cy, CONTENT_X + block_w, cy + bh],
               fill=CARD_BG, outline=PRIMARY, radius=10, width=2)
            # Header
            d.text((CONTENT_X + 40, cy + 14), block["type"], fill=PRIMARY, font=F_BODY_BOLD)
            # Drag handle
            for dy in [cy + 16, cy + 22, cy + 28]:
                d.line([CONTENT_X + 14, dy, CONTENT_X + 26, dy], fill=TEXT_MUTED, width=1)
            # Collapse arrow
            d.text((CONTENT_X + block_w - 30, cy + 14), "^", fill=TEXT_MUTED, font=F_BODY)

            # Fields
            fy = cy + 48
            for f_label, f_value in block["fields"]:
                d.text((CONTENT_X + 20, fy + 4), f_label, fill=TEXT_SECONDARY, font=F_SMALL)
                rr(d, [CONTENT_X + 160, fy, CONTENT_X + block_w - 20, fy + 30],
                   fill="#0a0a0a", outline=CARD_BORDER, radius=4)
                d.text((CONTENT_X + 172, fy + 7), f_value, fill=TEXT_PRIMARY, font=F_SMALL)
                fy += 40
            cy += bh + 12
        else:
            rr(d, [CONTENT_X, cy, CONTENT_X + block_w, cy + 48],
               fill=CARD_BG, outline=CARD_BORDER, radius=10)
            # Drag handle
            for dy in [cy + 18, cy + 24, cy + 30]:
                d.line([CONTENT_X + 14, dy, CONTENT_X + 26, dy], fill=TEXT_MUTED, width=1)
            d.text((CONTENT_X + 40, cy + 14), block["type"], fill=TEXT_PRIMARY, font=F_BODY_BOLD)
            d.text((CONTENT_X + 200, cy + 16), block.get("summary", ""), fill=TEXT_MUTED, font=F_SMALL)
            d.text((CONTENT_X + block_w - 30, cy + 14), "v", fill=TEXT_MUTED, font=F_BODY)
            cy += 56

    # Revision history panel (right)
    ry = 130
    rr(d, [rev_x, ry, rev_x + rev_w, ry + 800], fill=CARD_BG, outline=CARD_BORDER, radius=10)
    d.text((rev_x + 16, ry + 12), "Revision History", fill=TEXT_PRIMARY, font=F_SUBHEADING)
    d.line([rev_x + 10, ry + 40, rev_x + rev_w - 10, ry + 40], fill=CARD_BORDER, width=1)

    revisions = [
        ("v12 (current)", "2 min ago", "Updated hero CTA"),
        ("v11", "15 min ago", "Added pricing table"),
        ("v10", "1 hr ago", "Reordered blocks"),
        ("v9", "2 hr ago", "New testimonial quotes"),
        ("v8", "Yesterday", "FAQ content update"),
        ("v7", "2 days ago", "Feature grid redesign"),
        ("v6", "3 days ago", "Stats bar added"),
        ("v5", "1 week ago", "Initial hero design"),
    ]
    ry2 = ry + 52
    for rev_name, rev_time, rev_desc in revisions:
        d.ellipse([rev_x + 16, ry2 + 6, rev_x + 24, ry2 + 14], fill=PRIMARY if "current" in rev_name else TEXT_MUTED)
        # Vertical connector
        if rev_name != revisions[-1][0]:
            d.line([rev_x + 20, ry2 + 16, rev_x + 20, ry2 + 70], fill="#333333", width=1)
        d.text((rev_x + 32, ry2), rev_name, fill=PRIMARY if "current" in rev_name else TEXT_SECONDARY, font=F_SMALL_BOLD)
        d.text((rev_x + 32, ry2 + 18), rev_time, fill=TEXT_MUTED, font=F_TINY)
        d.text((rev_x + 32, ry2 + 34), rev_desc, fill=TEXT_SECONDARY, font=F_SMALL)
        ry2 += 72

    img.save(OUT_DIR + "05-editor.png", optimize=True)
    print("  05-editor.png")


# ============================================================
# SCENE 6: Plugin Marketplace (1920x2400 TALL)
# ============================================================
def scene_06_marketplace():
    h = 2400
    img, d = new_image(h)
    draw_sidebar(d, "Marketplace", h)
    cy = draw_topbar(d, "Plugin Marketplace", "Admin / Marketplace")

    # Category filter tabs
    cats = ["All (22)", "Content", "Commerce", "Analytics", "Integration", "Netrun", "System"]
    tx = CONTENT_X
    for i, cat in enumerate(cats):
        tw = len(cat) * 9 + 24
        if i == 0:
            rr(d, [tx, cy, tx + tw, cy + 30], fill=PRIMARY, radius=15)
            d.text((tx + 12, cy + 7), cat, fill="#0a0a0a", font=F_SMALL_BOLD)
        else:
            rr(d, [tx, cy, tx + tw, cy + 30], fill=None, outline=CARD_BORDER, radius=15, width=1)
            d.text((tx + 12, cy + 7), cat, fill=TEXT_SECONDARY, font=F_SMALL)
        tx += tw + 10
    cy += 50

    plugins = [
        ("Blog / Posts", "Content", True, "Create and manage blog posts with categories, tags, and RSS feed generation."),
        ("Portfolio", "Content", True, "Showcase projects with filterable gallery grid, project detail pages, and media."),
        ("Events Calendar", "Content", True, "Event listings with date/time, RSVP, location, and calendar integration."),
        ("Mailing List", "Content", True, "Email collection with double opt-in, subscriber segments, and CSV export."),
        ("Contact Forms", "Content", True, "Drag-and-drop form builder with validation, spam protection, and email routing."),
        ("SEO Manager", "Content", True, "Meta tags, OG images, sitemaps, robots.txt, structured data, and canonical URLs."),
        ("Store (Stripe)", "Commerce", True, "Product catalog, Stripe checkout sessions, order management, and webhooks."),
        ("Merch (Printful)", "Commerce", True, "Print-on-demand merch sync. Catalog import, mockups, and fulfillment tracking."),
        ("PayPal", "Commerce", False, "PayPal checkout integration. Same product catalog, alternative payment method."),
        ("Booking", "Commerce", True, "Service scheduling with availability rules, calendar sync, and email confirmations."),
        ("Community Forum", "Engagement", True, "Gated discussion forum with voting, reputation, magic-link auth, and moderation."),
        ("Knowledge Base", "Engagement", True, "Categorized articles with search, versioning, feedback ratings, and featured docs."),
        ("Resonance Analytics", "Analytics", True, "Block-level content heatmaps, A/B testing, and AI-powered suggestions."),
        ("Intirkast", "Netrun", True, "Broadcasting integration. Live stream status, broadcast scheduling, embed widgets."),
        ("KOG CRM", "Netrun", True, "Customer relationship management. Lead tracking, pipeline stages, contact notes."),
        ("KAMERA", "Netrun", True, "OSINT research integration. Intelligence gathering, risk scoring, due diligence reports."),
        ("Charlotte AI", "Netrun", True, "AI assistant widget. RAG-powered chat, context-aware responses, conversation history."),
        ("Support Panel", "Netrun", True, "Customer support ticketing. Priority levels, assignment, SLA tracking, canned responses."),
        ("Migration Tool", "System", True, "Import from WordPress, Shopify, and Square. Content mapping and asset download."),
        ("Webhooks", "System", True, "Event bus with HMAC signing, retry delivery, and delivery log dashboard."),
        ("Marketplace", "System", True, "This page. Browse, activate, and configure all available plugins."),
        ("Billing", "System", True, "SaaS subscription management. Stripe billing, plan enforcement, usage metering."),
    ]

    cat_colors = {
        "Content": INFO, "Commerce": SUCCESS, "Analytics": WARNING,
        "Engagement": PURPLE, "Netrun": PRIMARY, "System": TEXT_MUTED,
    }

    # 3-column grid
    col_w = (CONTENT_W - 40) // 3
    col = 0
    row_y = cy
    max_row_h = 0
    for pname, pcat, active, pdesc in plugins:
        px = CONTENT_X + col * (col_w + 20)
        card_h = 160
        rr(d, [px, row_y, px + col_w, row_y + card_h],
           fill=CARD_BG, outline=PRIMARY if active else CARD_BORDER, radius=10,
           width=2 if active else 1)

        # Icon circle
        ic = cat_colors.get(pcat, TEXT_MUTED)
        d.ellipse([px + 16, row_y + 16, px + 40, row_y + 40], fill=ic)
        d.text((px + 22, row_y + 20), pname[0], fill="#0a0a0a", font=F_SMALL_BOLD)

        # Name
        name_trunc = pname[:22]
        d.text((px + 50, row_y + 16), name_trunc, fill=TEXT_PRIMARY, font=F_BODY_BOLD)

        # Category badge
        pill(d, [px + 50, row_y + 38, px + 50 + len(pcat) * 7 + 16, row_y + 54],
             ic, pcat, text_color="#0a0a0a")

        # Active badge
        if active:
            pill(d, [px + col_w - 64, row_y + 12, px + col_w - 12, row_y + 28],
                 SUCCESS, "Active", text_color="#fff")

        # Description (truncated)
        desc_trunc = pdesc[:70] + ("..." if len(pdesc) > 70 else "")
        # Word wrap at ~40 chars
        line1 = desc_trunc[:45]
        line2 = desc_trunc[45:]
        d.text((px + 16, row_y + 68), line1, fill=TEXT_SECONDARY, font=F_SMALL)
        if line2:
            d.text((px + 16, row_y + 86), line2, fill=TEXT_SECONDARY, font=F_SMALL)

        # Env hint
        d.text((px + 16, row_y + 112), "Env-gated" if active else "Needs config", fill=TEXT_MUTED, font=F_TINY)

        # Configure button
        rr(d, [px + 16, row_y + 130, px + col_w - 16, row_y + 150],
           fill=None, outline=PRIMARY if active else CARD_BORDER, radius=12, width=1)
        btn_text = "Configure" if active else "Activate"
        btn_color = PRIMARY if active else TEXT_MUTED
        d.text((px + col_w // 2 - 30, row_y + 133), btn_text, fill=btn_color, font=F_SMALL)

        max_row_h = max(max_row_h, card_h)
        col += 1
        if col >= 3:
            col = 0
            row_y += max_row_h + 16
            max_row_h = 0

    img.save(OUT_DIR + "06-marketplace.png", optimize=True)
    print("  06-marketplace.png")


# ============================================================
# SCENE 7: Commerce Suite (1920x2400 TALL)
# ============================================================
def scene_07_commerce():
    h = 2400
    img, d = new_image(h)
    draw_sidebar(d, "Products (Stripe)", h)
    cy = draw_topbar(d, "Commerce Suite", "Admin / Commerce")

    # Section: Store Products
    d.text((CONTENT_X, cy), "Store Products (Stripe)", fill=TEXT_PRIMARY, font=F_HEADING)
    rr(d, [CONTENT_X + 240, cy - 2, CONTENT_X + 360, cy + 22], fill=PRIMARY, radius=12)
    d.text((CONTENT_X + 252, cy + 2), "+ New Product", fill="#0a0a0a", font=F_SMALL_BOLD)
    cy += 36

    products = [
        ("Cloud Audit Package", "$299.00", "one-time", "Synced", 12),
        ("MSP Monthly Retainer", "$1,499.00", "monthly", "Synced", 8),
        ("DevSecOps Consultation", "$199.00", "one-time", "Synced", 24),
        ("Infrastructure Review", "$499.00", "one-time", "Pending", 3),
        ("Sigil Pro License", "$79.00", "monthly", "Synced", 156),
    ]

    cols = ["Product Name", "Price", "Billing", "Stripe Status", "Sales"]
    widths = [300, 120, 120, 140, 80]
    cy = draw_table_header(d, CONTENT_X, cy, cols, widths)
    for pname, price, billing, status, sales in products:
        status_color = SUCCESS if status == "Synced" else WARNING
        cy = draw_table_row(d, CONTENT_X, cy,
                            [pname, price, billing, status, str(sales)],
                            widths,
                            [TEXT_PRIMARY, PRIMARY, TEXT_SECONDARY, status_color, TEXT_SECONDARY])
    cy += 30

    # Section: Printful Merch
    d.text((CONTENT_X, cy), "Merch (Printful)", fill=TEXT_PRIMARY, font=F_HEADING)
    rr(d, [CONTENT_X + 200, cy - 2, CONTENT_X + 310, cy + 22], fill=PURPLE, radius=12)
    d.text((CONTENT_X + 212, cy + 2), "Sync Catalog", fill="#fff", font=F_SMALL_BOLD)
    cy += 36

    merch = [
        ("Netrun Logo Tee", "$28.00", "T-Shirt", "In Stock"),
        ("Sigil Dev Hoodie", "$52.00", "Hoodie", "In Stock"),
        ("GhostGrid Sticker Pack", "$8.00", "Sticker", "In Stock"),
        ("Code Mug — Dark Mode", "$16.00", "Mug", "Low Stock"),
    ]

    # Merch cards as a grid
    col = 0
    card_w = (CONTENT_W - 30) // 2
    for mname, mprice, mtype, mstock in merch:
        mx = CONTENT_X + col * (card_w + 30)
        rr(d, [mx, cy, mx + card_w, cy + 140], fill=CARD_BG, outline=CARD_BORDER, radius=10)
        # Mockup placeholder
        rr(d, [mx + 12, cy + 12, mx + 120, cy + 100], fill="#222222", radius=6)
        d.text((mx + 40, cy + 48), mtype[0:3], fill=TEXT_MUTED, font=F_HEADING)
        # Info
        d.text((mx + 136, cy + 16), mname, fill=TEXT_PRIMARY, font=F_BODY_BOLD)
        d.text((mx + 136, cy + 40), mprice, fill=PRIMARY, font=F_BODY)
        d.text((mx + 136, cy + 60), mtype, fill=TEXT_SECONDARY, font=F_SMALL)
        stock_color = SUCCESS if mstock == "In Stock" else WARNING
        pill(d, [mx + 136, cy + 82, mx + 136 + len(mstock) * 7 + 16, cy + 98], stock_color, mstock, text_color="#0a0a0a")
        # Fulfillment note
        d.text((mx + 136, cy + 110), "Print-on-demand via Printful", fill=TEXT_MUTED, font=F_TINY)

        col += 1
        if col >= 2:
            col = 0
            cy += 156
    if col != 0:
        cy += 156
    cy += 20

    # Section: Booking Services
    d.text((CONTENT_X, cy), "Booking Services", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 36

    services = [
        ("Strategy Consultation", "60 min", "$199", "Mon-Fri 9am-5pm", 3),
        ("Infrastructure Review", "90 min", "$299", "Tue, Thu 10am-3pm", 1),
        ("DevOps Workshop", "120 min", "$499", "Wed 1pm-5pm", 2),
    ]

    for sname, sdur, sprice, savail, upcoming in services:
        rr(d, [CONTENT_X, cy, CONTENT_X + CONTENT_W, cy + 100],
           fill=CARD_BG, outline=CARD_BORDER, radius=10)
        d.text((CONTENT_X + 20, cy + 12), sname, fill=TEXT_PRIMARY, font=F_BODY_BOLD)
        d.text((CONTENT_X + 20, cy + 36), f"Duration: {sdur}  |  Price: {sprice}", fill=TEXT_SECONDARY, font=F_SMALL)
        d.text((CONTENT_X + 20, cy + 58), f"Availability: {savail}", fill=TEXT_MUTED, font=F_SMALL)
        d.text((CONTENT_X + 20, cy + 78), f"{upcoming} upcoming appointments", fill=PRIMARY, font=F_SMALL)
        # Book button
        rr(d, [CONTENT_X + CONTENT_W - 120, cy + 36, CONTENT_X + CONTENT_W - 20, cy + 62],
           fill=PRIMARY, radius=14)
        d.text((CONTENT_X + CONTENT_W - 100, cy + 42), "Book", fill="#0a0a0a", font=F_SMALL_BOLD)
        cy += 116
    cy += 20

    # Order history
    d.text((CONTENT_X, cy), "Recent Orders", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 36
    order_cols = ["Order ID", "Customer", "Product", "Amount", "Status", "Date"]
    order_widths = [120, 200, 220, 100, 100, 160]
    cy = draw_table_header(d, CONTENT_X, cy, order_cols, order_widths)
    orders = [
        ("#ORD-1247", "Acme Corp", "MSP Monthly Retainer", "$1,499", "Paid", "Mar 24, 2026"),
        ("#ORD-1246", "BlueStar LLC", "Cloud Audit Package", "$299", "Paid", "Mar 23, 2026"),
        ("#ORD-1245", "TechForge", "Sigil Pro License", "$79", "Paid", "Mar 22, 2026"),
        ("#ORD-1244", "J. Martinez", "Netrun Logo Tee", "$28", "Shipped", "Mar 21, 2026"),
        ("#ORD-1243", "DataHaus Inc", "DevSecOps Consult", "$199", "Paid", "Mar 20, 2026"),
    ]
    for oid, cust, prod, amt, status, date in orders:
        s_color = SUCCESS if status == "Paid" else INFO
        cy = draw_table_row(d, CONTENT_X, cy,
                            [oid, cust, prod, amt, status, date],
                            order_widths,
                            [TEXT_MUTED, TEXT_PRIMARY, TEXT_SECONDARY, PRIMARY, s_color, TEXT_MUTED])

    img.save(OUT_DIR + "07-commerce.png", optimize=True)
    print("  07-commerce.png")


# ============================================================
# SCENE 8: Community Forum (1920x1080 static)
# ============================================================
def scene_08_community():
    img, d = new_image()
    draw_sidebar(d, "Community Forum")
    cy = draw_topbar(d, "Community Forum", "Admin / Community")

    # Main area: threads (left) + leaderboard (right)
    threads_w = CONTENT_W - 300
    lb_x = CONTENT_X + threads_w + 20
    lb_w = 280

    # Thread list
    threads = [
        {"title": "Best practices for multi-tenant PostgreSQL RLS?", "type": "Question",
         "author": "devops_dan", "rep": 1240, "votes": 42, "replies": 18, "solved": True,
         "cat": "Architecture", "tags": ["postgres", "rls", "security"]},
        {"title": "Sigil vs Strapi — honest comparison after 6 months", "type": "Discussion",
         "author": "cms_reviewer", "rep": 890, "votes": 67, "replies": 34, "solved": False,
         "cat": "General", "tags": ["comparison", "review"]},
        {"title": "Custom block type tutorial — step by step", "type": "Article",
         "author": "block_builder", "rep": 2100, "votes": 89, "replies": 12, "solved": False,
         "cat": "Tutorials", "tags": ["blocks", "plugins", "tutorial"]},
        {"title": "Webhook retry logic not firing after 3rd attempt", "type": "Question",
         "author": "webhook_user", "rep": 340, "votes": 8, "replies": 5, "solved": True,
         "cat": "Bugs", "tags": ["webhooks", "retry"]},
        {"title": "v2.1 Release Notes and Migration Guide", "type": "Announcement",
         "author": "sigil_team", "rep": 5000, "votes": 120, "replies": 45, "solved": False,
         "cat": "Announcements", "tags": ["release", "v2.1"]},
        {"title": "Resonance analytics — tracking custom block events?", "type": "Question",
         "author": "analytics_pro", "rep": 670, "votes": 15, "replies": 7, "solved": False,
         "cat": "Plugins", "tags": ["resonance", "analytics"]},
        {"title": "My portfolio site built with Sigil — feedback welcome", "type": "Discussion",
         "author": "designer_jane", "rep": 450, "votes": 31, "replies": 22, "solved": False,
         "cat": "Showcase", "tags": ["portfolio", "showcase"]},
    ]

    type_colors = {"Question": INFO, "Discussion": PURPLE, "Article": PRIMARY,
                   "Announcement": WARNING, "Bug": ERROR}

    for thread in threads:
        th = 110
        rr(d, [CONTENT_X, cy, CONTENT_X + threads_w, cy + th],
           fill=CARD_BG, outline=CARD_BORDER, radius=10)

        # Vote score
        d.text((CONTENT_X + 20, cy + 16), str(thread["votes"]), fill=PRIMARY, font=font(20, bold=True))
        d.text((CONTENT_X + 20, cy + 44), "votes", fill=TEXT_MUTED, font=F_TINY)

        # Title
        d.text((CONTENT_X + 80, cy + 12), thread["title"][:60], fill=TEXT_PRIMARY, font=F_BODY_BOLD)

        # Type + Category + Solved badge
        tc = type_colors.get(thread["type"], TEXT_MUTED)
        pill(d, [CONTENT_X + 80, cy + 36, CONTENT_X + 80 + len(thread["type"]) * 7 + 16, cy + 52], tc, thread["type"], text_color="#0a0a0a")
        cat_x = CONTENT_X + 80 + len(thread["type"]) * 7 + 26
        pill(d, [cat_x, cy + 36, cat_x + len(thread["cat"]) * 7 + 16, cy + 52], CARD_BORDER, thread["cat"], text_color=TEXT_SECONDARY)
        if thread["solved"]:
            sx = cat_x + len(thread["cat"]) * 7 + 26
            pill(d, [sx, cy + 36, sx + 52, cy + 52], SUCCESS, "Solved", text_color="#fff")

        # Tags
        tag_x = CONTENT_X + 80
        for tag in thread["tags"]:
            tw = len(tag) * 7 + 12
            rr(d, [tag_x, cy + 60, tag_x + tw, cy + 76], fill="#1a1a1a", outline=CARD_BORDER, radius=10)
            d.text((tag_x + 6, cy + 63), tag, fill=TEXT_MUTED, font=F_TINY)
            tag_x += tw + 6

        # Author + replies
        d.text((CONTENT_X + 80, cy + 86), f"@{thread['author']}", fill=TEXT_SECONDARY, font=F_SMALL)
        d.text((CONTENT_X + 80 + len(thread["author"]) * 8 + 30, cy + 86),
               f"Rep: {thread['rep']}", fill=TEXT_MUTED, font=F_TINY)
        d.text((CONTENT_X + threads_w - 100, cy + 86),
               f"{thread['replies']} replies", fill=TEXT_SECONDARY, font=F_SMALL)

        cy += th + 8

    # Leaderboard sidebar
    ly = 130
    rr(d, [lb_x, ly, lb_x + lb_w, ly + 800], fill=CARD_BG, outline=CARD_BORDER, radius=10)
    d.text((lb_x + 16, ly + 12), "Top Contributors", fill=TEXT_PRIMARY, font=F_SUBHEADING)
    d.line([lb_x + 10, ly + 40, lb_x + lb_w - 10, ly + 40], fill=CARD_BORDER, width=1)

    leaders = [
        ("sigil_team", 5000, "Legend"),
        ("block_builder", 2100, "Expert"),
        ("devops_dan", 1240, "Contributor"),
        ("cms_reviewer", 890, "Member"),
        ("analytics_pro", 670, "Member"),
        ("designer_jane", 450, "Newcomer"),
        ("webhook_user", 340, "Newcomer"),
    ]
    tier_colors = {"Legend": WARNING, "Expert": PURPLE, "Contributor": PRIMARY,
                   "Member": INFO, "Newcomer": TEXT_MUTED}

    ly2 = ly + 52
    for rank, (uname, rep, tier) in enumerate(leaders, 1):
        d.text((lb_x + 16, ly2), f"#{rank}", fill=TEXT_MUTED, font=F_SMALL_BOLD)
        d.text((lb_x + 46, ly2), f"@{uname}", fill=TEXT_PRIMARY, font=F_SMALL)
        d.text((lb_x + 46, ly2 + 18), f"{rep} rep", fill=TEXT_SECONDARY, font=F_TINY)
        tc = tier_colors.get(tier, TEXT_MUTED)
        pill(d, [lb_x + lb_w - 90, ly2 + 2, lb_x + lb_w - 12, ly2 + 18], tc, tier, text_color="#0a0a0a")
        ly2 += 44

    img.save(OUT_DIR + "08-community.png", optimize=True)
    print("  08-community.png")


# ============================================================
# SCENE 9: Resonance Analytics (1920x1080 static)
# ============================================================
def scene_09_analytics():
    img, d = new_image()
    draw_sidebar(d, "Resonance Analytics")
    cy = draw_topbar(d, "Resonance Analytics", "Admin / Analytics")

    # Split: Heatmap (left) + AI Suggestions (right)
    heat_w = CONTENT_W - 340
    ai_x = CONTENT_X + heat_w + 20
    ai_w = 320

    # Block heatmap
    d.text((CONTENT_X, cy), "Block Engagement Heatmap — Homepage", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 32

    blocks = [
        ("Hero Block", 92, SUCCESS, "2.8s avg viewport", "1,240 impressions"),
        ("Stats Bar", 78, "#22c55e", "1.2s avg viewport", "1,180 impressions"),
        ("Feature Grid", 65, WARNING, "3.1s avg viewport", "980 impressions"),
        ("Testimonials", 45, "#f97316", "0.8s avg viewport", "720 impressions"),
        ("Pricing Table", 71, "#22c55e", "4.2s avg viewport", "640 impressions"),
        ("CTA Banner", 58, WARNING, "0.6s avg viewport", "580 impressions"),
        ("FAQ Section", 38, ERROR, "1.5s avg viewport", "340 impressions"),
        ("Footer", 22, ERROR, "0.3s avg viewport", "280 impressions"),
    ]

    for bname, score, color, viewport, impressions in blocks:
        rr(d, [CONTENT_X, cy, CONTENT_X + heat_w, cy + 68],
           fill=CARD_BG, outline=CARD_BORDER, radius=8)

        # Score circle
        d.ellipse([CONTENT_X + 12, cy + 14, CONTENT_X + 52, cy + 54], fill=color, outline=color)
        d.text((CONTENT_X + 20 if score < 100 else CONTENT_X + 16, cy + 22),
               str(score), fill="#0a0a0a", font=F_BODY_BOLD)

        # Block name + metrics
        d.text((CONTENT_X + 64, cy + 12), bname, fill=TEXT_PRIMARY, font=F_BODY_BOLD)
        d.text((CONTENT_X + 64, cy + 34), viewport, fill=TEXT_SECONDARY, font=F_SMALL)
        d.text((CONTENT_X + 260, cy + 34), impressions, fill=TEXT_MUTED, font=F_SMALL)

        # Score bar
        bar_x = CONTENT_X + 64
        bar_w = heat_w - 100
        d.line([bar_x, cy + 56, bar_x + bar_w, cy + 56], fill="#333333", width=4)
        d.line([bar_x, cy + 56, bar_x + int(bar_w * score / 100), cy + 56], fill=color, width=4)

        cy += 76

    # A/B Test panel
    cy += 10
    d.text((CONTENT_X, cy), "Active A/B Test: Hero CTA", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 30
    rr(d, [CONTENT_X, cy, CONTENT_X + heat_w // 2 - 10, cy + 100],
       fill=CARD_BG, outline=INFO, radius=10, width=2)
    d.text((CONTENT_X + 16, cy + 10), 'Variant A: "Get Started"', fill=TEXT_PRIMARY, font=F_BODY_BOLD)
    d.text((CONTENT_X + 16, cy + 34), "CTR: 4.2%  |  485 views", fill=TEXT_SECONDARY, font=F_SMALL)
    pill(d, [CONTENT_X + 16, cy + 60, CONTENT_X + 86, cy + 78], INFO, "Control", text_color="#fff")

    rr(d, [CONTENT_X + heat_w // 2 + 10, cy, CONTENT_X + heat_w, cy + 100],
       fill=CARD_BG, outline=SUCCESS, radius=10, width=2)
    vb_x = CONTENT_X + heat_w // 2 + 26
    d.text((vb_x, cy + 10), 'Variant B: "Start Building"', fill=TEXT_PRIMARY, font=F_BODY_BOLD)
    d.text((vb_x, cy + 34), "CTR: 6.1%  |  492 views", fill=TEXT_SECONDARY, font=F_SMALL)
    pill(d, [vb_x, cy + 60, vb_x + 70, cy + 78], SUCCESS, "Winning", text_color="#fff")

    # AI Suggestions panel (right)
    sy = 130
    rr(d, [ai_x, sy, ai_x + ai_w, sy + 820], fill=CARD_BG, outline=CARD_BORDER, radius=10)
    d.text((ai_x + 16, sy + 12), "AI Suggestions", fill=TEXT_PRIMARY, font=F_SUBHEADING)
    pill(d, [ai_x + 160, sy + 12, ai_x + 220, sy + 28], PRIMARY, "Gemini", text_color="#0a0a0a")
    d.line([ai_x + 10, sy + 40, ai_x + ai_w - 10, sy + 40], fill=CARD_BORDER, width=1)

    suggestions = [
        ("FAQ Section (score: 38)", "Move FAQ above CTA Banner. Users reaching the FAQ are already engaged — the CTA below it gets ignored.", ERROR),
        ("Testimonials (score: 45)", "Add company logos beside quotes. Social proof with visual anchors increases viewport time by 30% on average.", WARNING),
        ("CTA Banner (score: 58)", "Change CTA text from 'Learn More' to a specific action. Vague CTAs underperform by 40% vs direct verbs.", WARNING),
        ("Footer (score: 22)", "Add a newsletter signup to the footer. Low score is expected for footers, but capturing email converts 2-5% of bouncers.", TEXT_MUTED),
    ]

    sy2 = sy + 52
    for s_block, s_text, s_color in suggestions:
        d.ellipse([ai_x + 16, sy2 + 4, ai_x + 24, sy2 + 12], fill=s_color)
        d.text((ai_x + 32, sy2), s_block, fill=TEXT_PRIMARY, font=F_SMALL_BOLD)
        # Word-wrap suggestion text (~38 chars per line)
        words = s_text.split()
        line = ""
        ly = sy2 + 20
        for word in words:
            if len(line + word) > 38:
                d.text((ai_x + 32, ly), line.strip(), fill=TEXT_SECONDARY, font=F_TINY)
                ly += 16
                line = word + " "
            else:
                line += word + " "
        if line.strip():
            d.text((ai_x + 32, ly), line.strip(), fill=TEXT_SECONDARY, font=F_TINY)
            ly += 16

        # Apply button
        rr(d, [ai_x + 32, ly + 4, ai_x + 112, ly + 22], fill=None, outline=PRIMARY, radius=10, width=1)
        d.text((ai_x + 48, ly + 7), "Apply", fill=PRIMARY, font=F_TINY)
        sy2 = ly + 36

    img.save(OUT_DIR + "09-analytics.png", optimize=True)
    print("  09-analytics.png")


# ============================================================
# SCENE 10: Knowledge Base (1920x1080 static)
# ============================================================
def scene_10_docs():
    img, d = new_image()
    draw_sidebar(d, "Knowledge Base")
    cy = draw_topbar(d, "Knowledge Base", "Admin / Knowledge Base")

    # Action bar
    rr(d, [CONTENT_X, cy, CONTENT_X + 150, cy + 36], fill=PRIMARY, radius=18)
    d.text((CONTENT_X + 14, cy + 9), "+ New Article", fill="#0a0a0a", font=F_BODY_BOLD)

    # Search
    rr(d, [CONTENT_X + 180, cy, CONTENT_X + 480, cy + 36], fill="#0a0a0a", outline=CARD_BORDER, radius=18)
    d.text((CONTENT_X + 200, cy + 9), "Search articles...", fill=TEXT_MUTED, font=F_BODY)
    cy += 56

    articles = [
        {"title": "Getting Started with Sigil CMS", "cat": "Guides", "tags": ["quickstart", "setup"],
         "views": 4820, "helpful": 94, "featured": True, "status": "Published", "version": "v3"},
        {"title": "Plugin Development API Reference", "cat": "API Docs", "tags": ["plugins", "api", "typescript"],
         "views": 3240, "helpful": 91, "featured": True, "status": "Published", "version": "v2"},
        {"title": "Multi-Tenant Architecture Overview", "cat": "Architecture", "tags": ["multi-tenant", "rls", "postgres"],
         "views": 2680, "helpful": 88, "featured": False, "status": "Published", "version": "v4"},
        {"title": "Stripe Integration — Store Plugin", "cat": "Plugins", "tags": ["stripe", "commerce", "webhooks"],
         "views": 1950, "helpful": 85, "featured": False, "status": "Published", "version": "v2"},
        {"title": "Design Playground — Custom Themes", "cat": "Guides", "tags": ["themes", "css", "fonts"],
         "views": 1740, "helpful": 92, "featured": True, "status": "Published", "version": "v1"},
        {"title": "Resonance Analytics Setup", "cat": "Plugins", "tags": ["analytics", "tracking"],
         "views": 1200, "helpful": 79, "featured": False, "status": "Published", "version": "v1"},
        {"title": "Migration from WordPress", "cat": "Guides", "tags": ["migration", "wordpress", "import"],
         "views": 980, "helpful": 82, "featured": False, "status": "Published", "version": "v1"},
        {"title": "Community Forum Moderation Guide", "cat": "Guides", "tags": ["community", "moderation"],
         "views": 640, "helpful": 90, "featured": False, "status": "Draft", "version": "v1"},
    ]

    for art in articles:
        rr(d, [CONTENT_X, cy, CONTENT_X + CONTENT_W, cy + 90],
           fill=CARD_BG, outline=CARD_BORDER, radius=10)

        # Featured star
        if art["featured"]:
            d.text((CONTENT_X + 14, cy + 10), "*", fill=WARNING, font=font(20, bold=True))

        # Title
        d.text((CONTENT_X + 40, cy + 12), art["title"], fill=TEXT_PRIMARY, font=F_BODY_BOLD)

        # Status + version
        s_color = SUCCESS if art["status"] == "Published" else WARNING
        pill(d, [CONTENT_X + CONTENT_W - 160, cy + 10, CONTENT_X + CONTENT_W - 90, cy + 28],
             s_color, art["status"], text_color="#0a0a0a" if art["status"] == "Published" else "#0a0a0a")
        pill(d, [CONTENT_X + CONTENT_W - 80, cy + 10, CONTENT_X + CONTENT_W - 40, cy + 28],
             CARD_BORDER, art["version"], text_color=TEXT_SECONDARY)

        # Category + tags
        pill(d, [CONTENT_X + 40, cy + 38, CONTENT_X + 40 + len(art["cat"]) * 7 + 16, cy + 54],
             INFO, art["cat"], text_color="#fff")
        tag_x = CONTENT_X + 40 + len(art["cat"]) * 7 + 26
        for tag in art["tags"]:
            tw = len(tag) * 7 + 12
            rr(d, [tag_x, cy + 38, tag_x + tw, cy + 54], fill="#1a1a1a", outline=CARD_BORDER, radius=10)
            d.text((tag_x + 6, cy + 41), tag, fill=TEXT_MUTED, font=F_TINY)
            tag_x += tw + 6

        # Stats
        d.text((CONTENT_X + 40, cy + 66), f"{art['views']:,} views", fill=TEXT_SECONDARY, font=F_SMALL)
        d.text((CONTENT_X + 180, cy + 66), f"{art['helpful']}% helpful", fill=SUCCESS, font=F_SMALL)

        cy += 98

    img.save(OUT_DIR + "10-docs.png", optimize=True)
    print("  10-docs.png")


# ============================================================
# SCENE 11: Migration Tool (1920x1080 static)
# ============================================================
def scene_11_migrate():
    img, d = new_image()
    draw_sidebar(d, "Migration Tool")
    cy = draw_topbar(d, "Migration Tool", "Admin / Migration")

    # Import source cards
    sources = [
        ("WordPress", "Import posts, pages, media, and categories from a WordPress export (WXR XML).",
         INFO, "XML Upload", True),
        ("Shopify", "Import products, collections, and customer data from Shopify CSV export.",
         SUCCESS, "CSV Upload", True),
        ("Square", "Import catalog items, categories, and images from Square POS export.",
         WARNING, "API Connect", False),
    ]

    card_w = (CONTENT_W - 40) // 3
    sx = CONTENT_X
    for sname, sdesc, scolor, smethod, available in sources:
        rr(d, [sx, cy, sx + card_w, cy + 200], fill=CARD_BG,
           outline=scolor if available else CARD_BORDER, radius=10, width=2 if available else 1)
        # Icon
        d.ellipse([sx + 20, cy + 20, sx + 56, cy + 56], fill=scolor)
        d.text((sx + 30, cy + 28), sname[0], fill="#0a0a0a", font=F_HEADING)
        d.text((sx + 20, cy + 68), sname, fill=TEXT_PRIMARY, font=F_HEADING)
        # Description (wrap)
        words = sdesc.split()
        line = ""
        ly = cy + 96
        for word in words:
            if len(line + word) > 35:
                d.text((sx + 20, ly), line.strip(), fill=TEXT_SECONDARY, font=F_SMALL)
                ly += 18
                line = word + " "
            else:
                line += word + " "
        if line.strip():
            d.text((sx + 20, ly), line.strip(), fill=TEXT_SECONDARY, font=F_SMALL)

        # Method badge
        pill(d, [sx + 20, cy + 160, sx + 20 + len(smethod) * 7 + 16, cy + 176],
             scolor, smethod, text_color="#0a0a0a")

        if not available:
            d.text((sx + 20, cy + 182), "Coming soon", fill=TEXT_MUTED, font=F_TINY)

        sx += card_w + 20
    cy += 230

    # Migration history table
    d.text((CONTENT_X, cy), "Migration History", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 32

    cols = ["Source", "Target Site", "Content", "Status", "Duration", "Date"]
    widths = [120, 200, 240, 100, 100, 180]
    cy = draw_table_header(d, CONTENT_X, cy, cols, widths)

    migrations = [
        ("WordPress", "netrunsystems.com", "47 posts, 12 pages, 89 media", "Complete", "3m 42s", "Mar 20, 2026"),
        ("WordPress", "Sigil Docs", "120 pages, 45 images", "Complete", "5m 18s", "Mar 15, 2026"),
        ("Shopify", "KOG Landing", "24 products, 6 collections", "Complete", "1m 55s", "Mar 10, 2026"),
        ("WordPress", "Client Demo", "8 pages, 12 media", "In Progress", "---", "Mar 25, 2026"),
    ]

    for src, target, content, status, dur, date in migrations:
        s_color = SUCCESS if status == "Complete" else WARNING
        cy = draw_table_row(d, CONTENT_X, cy,
                            [src, target, content, status, dur, date],
                            widths,
                            [INFO, TEXT_PRIMARY, TEXT_SECONDARY, s_color, TEXT_MUTED, TEXT_MUTED])

    # Progress bar for in-progress migration
    cy += 20
    rr(d, [CONTENT_X, cy, CONTENT_X + CONTENT_W, cy + 80],
       fill=CARD_BG, outline=WARNING, radius=10, width=2)
    d.text((CONTENT_X + 20, cy + 12), "Active Migration: WordPress -> Client Demo", fill=TEXT_PRIMARY, font=F_BODY_BOLD)
    d.text((CONTENT_X + 20, cy + 36), "Step 3/5: Downloading media assets...", fill=TEXT_SECONDARY, font=F_SMALL)
    # Progress bar
    bar_x = CONTENT_X + 20
    bar_w = CONTENT_W - 40
    d.line([bar_x, cy + 62, bar_x + bar_w, cy + 62], fill="#333333", width=6)
    d.line([bar_x, cy + 62, bar_x + int(bar_w * 0.6), cy + 62], fill=WARNING, width=6)
    d.text((CONTENT_X + CONTENT_W - 60, cy + 54), "60%", fill=WARNING, font=F_SMALL_BOLD)

    img.save(OUT_DIR + "11-migrate.png", optimize=True)
    print("  11-migrate.png")


# ============================================================
# SCENE 12: Netrun Platform (1920x2400 TALL)
# ============================================================
def scene_12_platform():
    h = 2400
    img, d = new_image(h)
    draw_sidebar(d, "KOG CRM", h)
    cy = draw_topbar(d, "Netrun Platform Integrations", "Admin / Integrations")

    # KOG CRM Section
    d.text((CONTENT_X, cy), "KOG CRM — Lead Management", fill=TEXT_PRIMARY, font=F_HEADING)
    pill(d, [CONTENT_X + 320, cy, CONTENT_X + 400, cy + 20], PRIMARY, "Connected", text_color="#0a0a0a")
    cy += 32

    crm_cols = ["Lead Name", "Company", "Stage", "Value", "Score", "Last Contact"]
    crm_widths = [180, 180, 120, 120, 80, 180]
    cy = draw_table_header(d, CONTENT_X, cy, crm_cols, crm_widths)
    leads = [
        ("Sarah Chen", "DataHaus Inc", "Proposal", "$48,000", "92", "Mar 24, 2026"),
        ("Marcus Webb", "BlueStar LLC", "Discovery", "$24,000", "78", "Mar 23, 2026"),
        ("Elena Vasquez", "TechForge", "Qualified", "$36,000", "85", "Mar 22, 2026"),
        ("James Park", "CloudNine Co", "Negotiation", "$72,000", "95", "Mar 21, 2026"),
        ("Priya Sharma", "Apex Digital", "Closed Won", "$18,000", "99", "Mar 20, 2026"),
    ]
    for name, company, stage, value, score, contact in leads:
        stage_colors = {"Proposal": INFO, "Discovery": WARNING, "Qualified": PURPLE,
                        "Negotiation": PRIMARY, "Closed Won": SUCCESS}
        sc = stage_colors.get(stage, TEXT_MUTED)
        cy = draw_table_row(d, CONTENT_X, cy,
                            [name, company, stage, value, score, contact],
                            crm_widths,
                            [TEXT_PRIMARY, TEXT_SECONDARY, sc, PRIMARY, SUCCESS, TEXT_MUTED])
    cy += 30

    # Intirkast Broadcasting
    d.text((CONTENT_X, cy), "Intirkast — Broadcasting", fill=TEXT_PRIMARY, font=F_HEADING)
    pill(d, [CONTENT_X + 260, cy, CONTENT_X + 340, cy + 20], PRIMARY, "Connected", text_color="#0a0a0a")
    cy += 32

    broadcasts = [
        ("Sigil Launch Keynote", "Scheduled", "Mar 28, 2:00 PM", "HD 1080p", "YouTube + Twitch"),
        ("Weekly Dev Update #14", "LIVE", "Now", "HD 720p", "YouTube"),
        ("Q1 Product Demo", "Completed", "Mar 15, 3:00 PM", "4K", "YouTube + LinkedIn"),
    ]

    for bname, bstatus, btime, bquality, bplatforms in broadcasts:
        rr(d, [CONTENT_X, cy, CONTENT_X + CONTENT_W, cy + 80],
           fill=CARD_BG, outline=CARD_BORDER, radius=10)
        d.text((CONTENT_X + 20, cy + 12), bname, fill=TEXT_PRIMARY, font=F_BODY_BOLD)
        # Status
        if bstatus == "LIVE":
            pill(d, [CONTENT_X + 20, cy + 38, CONTENT_X + 70, cy + 54], ERROR, "LIVE", text_color="#fff")
        elif bstatus == "Scheduled":
            pill(d, [CONTENT_X + 20, cy + 38, CONTENT_X + 100, cy + 54], WARNING, bstatus, text_color="#0a0a0a")
        else:
            pill(d, [CONTENT_X + 20, cy + 38, CONTENT_X + 110, cy + 54], TEXT_MUTED, bstatus, text_color="#fff")
        d.text((CONTENT_X + 130, cy + 40), btime, fill=TEXT_SECONDARY, font=F_SMALL)
        d.text((CONTENT_X + 320, cy + 40), bquality, fill=TEXT_MUTED, font=F_SMALL)
        d.text((CONTENT_X + 420, cy + 40), bplatforms, fill=TEXT_MUTED, font=F_SMALL)
        d.text((CONTENT_X + CONTENT_W - 120, cy + 16), "Manage", fill=PRIMARY, font=F_SMALL)
        cy += 92
    cy += 20

    # KAMERA Scans
    d.text((CONTENT_X, cy), "KAMERA — 3D Site Scanning", fill=TEXT_PRIMARY, font=F_HEADING)
    pill(d, [CONTENT_X + 290, cy, CONTENT_X + 370, cy + 20], PRIMARY, "Connected", text_color="#0a0a0a")
    cy += 32

    scans = [
        ("Office Building A — Floor 2", "Completed", "2.4M points", "Mar 22", "View 3D"),
        ("Warehouse Expansion Zone", "Processing", "1.8M points", "Mar 24", "Processing..."),
        ("Server Room Layout", "Completed", "890K points", "Mar 18", "View 3D"),
    ]

    for sname, sstatus, spoints, sdate, saction in scans:
        rr(d, [CONTENT_X, cy, CONTENT_X + CONTENT_W, cy + 70],
           fill=CARD_BG, outline=CARD_BORDER, radius=10)
        d.text((CONTENT_X + 20, cy + 10), sname, fill=TEXT_PRIMARY, font=F_BODY_BOLD)
        s_color = SUCCESS if sstatus == "Completed" else WARNING
        pill(d, [CONTENT_X + 20, cy + 36, CONTENT_X + 20 + len(sstatus) * 7 + 16, cy + 52],
             s_color, sstatus, text_color="#0a0a0a")
        d.text((CONTENT_X + 180, cy + 38), spoints, fill=TEXT_SECONDARY, font=F_SMALL)
        d.text((CONTENT_X + 320, cy + 38), sdate, fill=TEXT_MUTED, font=F_SMALL)
        action_color = PRIMARY if "View" in saction else TEXT_MUTED
        d.text((CONTENT_X + CONTENT_W - 100, cy + 24), saction, fill=action_color, font=F_SMALL)
        cy += 80
    cy += 20

    # Charlotte AI
    d.text((CONTENT_X, cy), "Charlotte AI — Assistant Widget", fill=TEXT_PRIMARY, font=F_HEADING)
    pill(d, [CONTENT_X + 340, cy, CONTENT_X + 420, cy + 20], PRIMARY, "Connected", text_color="#0a0a0a")
    cy += 32

    # Chat preview
    rr(d, [CONTENT_X, cy, CONTENT_X + 500, cy + 340],
       fill=CARD_BG, outline=CARD_BORDER, radius=12)
    d.text((CONTENT_X + 16, cy + 12), "Charlotte AI — Preview", fill=TEXT_PRIMARY, font=F_SUBHEADING)
    d.line([CONTENT_X + 10, cy + 40, CONTENT_X + 490, cy + 40], fill=CARD_BORDER, width=1)

    chat = [
        ("user", "How do I add a Stripe product?"),
        ("bot", "Navigate to Commerce > Products and click '+ New Product'. Fill in the name, price, and billing type. Sigil auto-creates the Stripe Product and Price objects."),
        ("user", "Does it handle webhooks automatically?"),
        ("bot", "Yes. The Store plugin registers for checkout.session.completed and payment_intent.succeeded events. Order status updates happen automatically."),
    ]
    chat_y = cy + 52
    for role, msg in chat:
        if role == "user":
            rr(d, [CONTENT_X + 200, chat_y, CONTENT_X + 480, chat_y + 40],
               fill="#1a2e27", radius=12)
            d.text((CONTENT_X + 216, chat_y + 10), msg[:36], fill=PRIMARY, font=F_SMALL)
        else:
            # Wrap bot message
            words = msg.split()
            line = ""
            by = chat_y
            for word in words:
                if len(line + word) > 50:
                    d.text((CONTENT_X + 24, by + 8), line.strip(), fill=TEXT_SECONDARY, font=F_SMALL)
                    by += 18
                    line = word + " "
                else:
                    line += word + " "
            if line.strip():
                d.text((CONTENT_X + 24, by + 8), line.strip(), fill=TEXT_SECONDARY, font=F_SMALL)
                by += 18
            rr(d, [CONTENT_X + 16, chat_y, CONTENT_X + 380, by + 12],
               fill="#1a1a1a", outline=CARD_BORDER, radius=12)
            # Re-draw text on top
            by2 = chat_y
            line = ""
            for word in words:
                if len(line + word) > 50:
                    d.text((CONTENT_X + 24, by2 + 8), line.strip(), fill=TEXT_SECONDARY, font=F_SMALL)
                    by2 += 18
                    line = word + " "
                else:
                    line += word + " "
            if line.strip():
                d.text((CONTENT_X + 24, by2 + 8), line.strip(), fill=TEXT_SECONDARY, font=F_SMALL)
                by2 += 18
            chat_y = by2 + 20
            continue
        chat_y += 52
    cy += 360

    # Support Panel
    d.text((CONTENT_X, cy), "Support Panel — Ticketing", fill=TEXT_PRIMARY, font=F_HEADING)
    pill(d, [CONTENT_X + 280, cy, CONTENT_X + 360, cy + 20], PRIMARY, "Connected", text_color="#0a0a0a")
    cy += 32

    tickets = [
        ("#TKT-342", "Cannot configure custom domain", "High", "Open", "2 hr ago"),
        ("#TKT-341", "Stripe webhook returning 500", "Critical", "In Progress", "4 hr ago"),
        ("#TKT-340", "Font upload not rendering in preview", "Medium", "Resolved", "1 day ago"),
        ("#TKT-339", "Community forum magic link expired", "Low", "Closed", "2 days ago"),
    ]

    t_cols = ["Ticket", "Subject", "Priority", "Status", "Age"]
    t_widths = [100, 340, 100, 120, 120]
    cy = draw_table_header(d, CONTENT_X, cy, t_cols, t_widths)
    for tid, subj, pri, status, age in tickets:
        pri_colors = {"Critical": ERROR, "High": WARNING, "Medium": INFO, "Low": TEXT_MUTED}
        stat_colors = {"Open": WARNING, "In Progress": INFO, "Resolved": SUCCESS, "Closed": TEXT_MUTED}
        cy = draw_table_row(d, CONTENT_X, cy,
                            [tid, subj, pri, status, age],
                            t_widths,
                            [TEXT_MUTED, TEXT_PRIMARY, pri_colors.get(pri, TEXT_MUTED),
                             stat_colors.get(status, TEXT_MUTED), TEXT_MUTED])

    img.save(OUT_DIR + "12-platform.png", optimize=True)
    print("  12-platform.png")


# ============================================================
# SCENE 13: Webhooks & Events (1920x1080 static)
# ============================================================
def scene_13_webhooks():
    img, d = new_image()
    draw_sidebar(d, "Webhooks")
    cy = draw_topbar(d, "Webhooks & Events", "Admin / Webhooks")

    # Action bar
    rr(d, [CONTENT_X, cy, CONTENT_X + 180, cy + 36], fill=PRIMARY, radius=18)
    d.text((CONTENT_X + 14, cy + 9), "+ New Endpoint", fill="#0a0a0a", font=F_BODY_BOLD)
    cy += 54

    # Webhook endpoints
    endpoints = [
        {
            "url": "https://hooks.slack.com/services/T.../B.../xxx",
            "events": ["page.published", "page.updated", "site.published"],
            "status": "Active", "success_rate": "99.2%", "last_fire": "2 min ago"
        },
        {
            "url": "https://api.zapier.com/hooks/catch/123456/abc",
            "events": ["order.completed", "booking.confirmed"],
            "status": "Active", "success_rate": "97.8%", "last_fire": "45 min ago"
        },
        {
            "url": "https://n8n.internal.example.com/webhook/cms-events",
            "events": ["media.uploaded", "form.submitted", "community.post.created"],
            "status": "Active", "success_rate": "100%", "last_fire": "3 hr ago"
        },
        {
            "url": "https://analytics.example.com/ingest",
            "events": ["page.viewed", "block.interaction"],
            "status": "Paused", "success_rate": "94.1%", "last_fire": "2 days ago"
        },
    ]

    for ep in endpoints:
        card_h = 110
        ep_active = ep["status"] == "Active"
        rr(d, [CONTENT_X, cy, CONTENT_X + CONTENT_W, cy + card_h],
           fill=CARD_BG, outline=CARD_BORDER, radius=10)

        # URL
        d.text((CONTENT_X + 20, cy + 12), ep["url"][:65], fill=TEXT_PRIMARY, font=F_BODY)

        # Status badge
        s_color = SUCCESS if ep_active else WARNING
        pill(d, [CONTENT_X + CONTENT_W - 80, cy + 10, CONTENT_X + CONTENT_W - 16, cy + 28],
             s_color, ep["status"], text_color="#0a0a0a")

        # Event badges
        ex = CONTENT_X + 20
        for event in ep["events"]:
            ew = len(event) * 7 + 14
            rr(d, [ex, cy + 40, ex + ew, cy + 56], fill="#1a2e27", radius=10)
            d.text((ex + 7, cy + 43), event, fill=PRIMARY, font=F_TINY)
            ex += ew + 6

        # Metrics
        d.text((CONTENT_X + 20, cy + 68), f"Success: {ep['success_rate']}", fill=SUCCESS, font=F_SMALL)
        d.text((CONTENT_X + 180, cy + 68), f"Last fired: {ep['last_fire']}", fill=TEXT_MUTED, font=F_SMALL)
        d.text((CONTENT_X + 400, cy + 68), "HMAC-SHA256 signed", fill=TEXT_MUTED, font=F_SMALL)

        # Actions
        d.text((CONTENT_X + CONTENT_W - 140, cy + 80), "Logs", fill=PRIMARY, font=F_SMALL)
        d.text((CONTENT_X + CONTENT_W - 80, cy + 80), "Edit", fill=TEXT_SECONDARY, font=F_SMALL)
        d.text((CONTENT_X + CONTENT_W - 40, cy + 80), "Delete", fill=ERROR, font=F_SMALL)

        cy += card_h + 12

    # Delivery log
    cy += 10
    d.text((CONTENT_X, cy), "Recent Delivery Log", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 32
    log_cols = ["Event", "Endpoint", "Status", "Response", "Duration", "Time"]
    log_widths = [180, 260, 80, 80, 80, 160]
    cy = draw_table_header(d, CONTENT_X, cy, log_cols, log_widths)

    deliveries = [
        ("page.published", "hooks.slack.com/...", "200", "OK", "120ms", "2 min ago"),
        ("order.completed", "api.zapier.com/...", "200", "OK", "340ms", "45 min ago"),
        ("media.uploaded", "n8n.internal.../...", "200", "OK", "89ms", "3 hr ago"),
        ("page.viewed", "analytics.example/...", "---", "Paused", "---", "2 days ago"),
        ("form.submitted", "n8n.internal.../...", "200", "OK", "156ms", "5 hr ago"),
        ("page.updated", "hooks.slack.com/...", "200", "OK", "98ms", "6 hr ago"),
        ("order.completed", "api.zapier.com/...", "500", "Retry 1", "2.1s", "1 day ago"),
        ("order.completed", "api.zapier.com/...", "200", "OK", "280ms", "1 day ago"),
    ]

    for event, endpoint, status, response, dur, time in deliveries:
        s_color = SUCCESS if status == "200" else (WARNING if "Retry" in response or response == "Paused" else ERROR)
        cy = draw_table_row(d, CONTENT_X, cy,
                            [event, endpoint, status, response, dur, time],
                            log_widths,
                            [PRIMARY, TEXT_SECONDARY, s_color, s_color, TEXT_MUTED, TEXT_MUTED])

    img.save(OUT_DIR + "13-webhooks.png", optimize=True)
    print("  13-webhooks.png")


# ============================================================
# SCENE 14: Billing (1920x1080 static)
# ============================================================
def scene_14_billing():
    img, d = new_image()
    draw_sidebar(d, "Billing")
    cy = draw_topbar(d, "Billing & Subscription", "Admin / Billing")

    # Current plan card
    rr(d, [CONTENT_X, cy, CONTENT_X + CONTENT_W, cy + 120],
       fill="#1a2e27", outline=PRIMARY, radius=12, width=2)
    d.text((CONTENT_X + 20, cy + 14), "Current Plan: Pro", fill=PRIMARY, font=F_HEADING)
    d.text((CONTENT_X + 20, cy + 42), "$49/month  |  Billed monthly  |  Next billing: Apr 1, 2026",
           fill=TEXT_SECONDARY, font=F_BODY)
    d.text((CONTENT_X + 20, cy + 68), "Stripe Customer ID: cus_Px1234567890",
           fill=TEXT_MUTED, font=F_SMALL)
    # Manage button
    rr(d, [CONTENT_X + CONTENT_W - 160, cy + 40, CONTENT_X + CONTENT_W - 20, cy + 68],
       fill=PRIMARY, radius=14)
    d.text((CONTENT_X + CONTENT_W - 140, cy + 46), "Manage Plan", fill="#0a0a0a", font=F_SMALL_BOLD)
    cy += 140

    # Usage meters
    d.text((CONTENT_X, cy), "Usage This Period", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 32

    meters = [
        ("Sites", 4, 10, PRIMARY),
        ("Pages", 67, 200, INFO),
        ("Storage", 1.2, 10, WARNING),
        ("API Calls", 12400, 50000, SUCCESS),
    ]

    meter_w = (CONTENT_W - 60) // 4
    mx = CONTENT_X
    for m_label, m_used, m_max, m_color in meters:
        rr(d, [mx, cy, mx + meter_w, cy + 100], fill=CARD_BG, outline=CARD_BORDER, radius=10)
        d.text((mx + 16, cy + 12), m_label, fill=TEXT_SECONDARY, font=F_SMALL_BOLD)
        ratio = m_used / m_max
        if isinstance(m_used, float):
            d.text((mx + 16, cy + 32), f"{m_used} GB / {m_max} GB", fill=TEXT_PRIMARY, font=F_BODY_BOLD)
        elif m_max >= 10000:
            d.text((mx + 16, cy + 32), f"{m_used:,} / {m_max:,}", fill=TEXT_PRIMARY, font=F_BODY_BOLD)
        else:
            d.text((mx + 16, cy + 32), f"{m_used} / {m_max}", fill=TEXT_PRIMARY, font=F_BODY_BOLD)
        # Bar
        d.line([mx + 16, cy + 72, mx + meter_w - 16, cy + 72], fill="#333333", width=6)
        fill_w = int((meter_w - 32) * min(ratio, 1.0))
        d.line([mx + 16, cy + 72, mx + 16 + fill_w, cy + 72], fill=m_color, width=6)
        pct = f"{int(ratio * 100)}%"
        d.text((mx + meter_w - 50, cy + 82), pct, fill=TEXT_MUTED, font=F_TINY)
        mx += meter_w + 20
    cy += 120

    # Plan comparison grid
    d.text((CONTENT_X, cy), "Available Plans", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 32

    plans = [
        ("Free", "$0", "Self-host", ["1 site", "10 pages", "1 GB storage", "Community plugins", "No support"]),
        ("Starter", "$12", "/month", ["3 sites", "50 pages", "5 GB storage", "All plugins", "Email support"]),
        ("Pro", "$49", "/month", ["10 sites", "200 pages", "10 GB storage", "All plugins", "Priority support", "Analytics", "A/B testing"]),
        ("Enterprise", "Custom", "Contact us", ["Unlimited sites", "Unlimited pages", "50 GB storage", "All plugins", "Dedicated support", "SLA 99.9%", "SSO/SAML", "Custom integrations"]),
    ]

    plan_w = (CONTENT_W - 60) // 4
    px = CONTENT_X
    for pname, pprice, pbilling, features in plans:
        is_current = pname == "Pro"
        rr(d, [px, cy, px + plan_w, cy + 380],
           fill=CARD_BG, outline=PRIMARY if is_current else CARD_BORDER,
           radius=12, width=2 if is_current else 1)
        if is_current:
            pill(d, [px + plan_w - 70, cy + 8, px + plan_w - 8, cy + 24], PRIMARY, "Current", text_color="#0a0a0a")

        d.text((px + 16, cy + 16), pname, fill=TEXT_PRIMARY, font=F_PRICE_TIER)
        d.text((px + 16, cy + 48), pprice, fill=PRIMARY, font=F_PRICE)
        d.text((px + 16, cy + 90), pbilling, fill=TEXT_MUTED, font=F_SMALL)

        d.line([px + 10, cy + 110, px + plan_w - 10, cy + 110], fill=CARD_BORDER, width=1)

        fy = cy + 124
        for feat in features:
            d.text((px + 16, fy), feat, fill=TEXT_SECONDARY, font=F_SMALL)
            fy += 24

        # Button
        if is_current:
            rr(d, [px + 16, cy + 340, px + plan_w - 16, cy + 366], fill=CARD_BG, outline=PRIMARY, radius=14, width=1)
            d.text((px + plan_w // 2 - 30, cy + 346), "Current", fill=PRIMARY, font=F_SMALL_BOLD)
        else:
            rr(d, [px + 16, cy + 340, px + plan_w - 16, cy + 366], fill=PRIMARY, radius=14)
            d.text((px + plan_w // 2 - 24, cy + 346), "Select", fill="#0a0a0a", font=F_SMALL_BOLD)

        px += plan_w + 20

    img.save(OUT_DIR + "14-billing.png", optimize=True)
    print("  14-billing.png")


# ============================================================
# SCENE 15: Pricing Page (1920x1080 static)
# ============================================================
def scene_15_pricing():
    img, d = new_image()

    # Full-width — no sidebar (public page)
    for gx in range(0, W, 60):
        d.line([gx, 0, gx, H_STD], fill="#0d0d0d", width=1)
    for gy in range(0, H_STD, 60):
        d.line([0, gy, W, gy], fill="#0d0d0d", width=1)

    # Top nav (same as landing)
    rr(d, [0, 0, W, 64], fill="#0a0a0aee", radius=0)
    rr(d, [40, 12, 75, 52], fill=PRIMARY, radius=10)
    d.text((48, 14), "S", fill="#0a0a0a", font=F_LOGO)
    d.text((85, 20), "Sigil", fill=TEXT_PRIMARY, font=font(22, bold=True))
    nav_links = ["Features", "Plugins", "Pricing", "Docs", "Blog"]
    nx = 600
    for nl in nav_links:
        col = PRIMARY if nl == "Pricing" else TEXT_SECONDARY
        d.text((nx, 22), nl, fill=col, font=F_BODY)
        nx += 120

    # Heading
    d.text((W // 2 - 240, 100), "Simple, Transparent Pricing", fill=TEXT_PRIMARY, font=font(36, bold=True))
    d.text((W // 2 - 280, 150), "Self-host free forever. Cloud hosting starts at $12/month.", fill=TEXT_SECONDARY, font=F_HERO_SUB)

    # Billing toggle
    d.text((W // 2 - 80, 195), "Monthly", fill=TEXT_SECONDARY, font=F_BODY)
    rr(d, [W // 2 - 10, 195, W // 2 + 50, 215], fill=PRIMARY, radius=10)
    d.ellipse([W // 2 + 26, 197, W // 2 + 46, 213], fill="#fff")
    d.text((W // 2 + 60, 195), "Annual", fill=PRIMARY, font=F_BODY_BOLD)
    pill(d, [W // 2 + 120, 195, W // 2 + 200, 211], SUCCESS, "Save 20%", text_color="#0a0a0a")

    # 4 pricing tiers
    plans = [
        ("Free", "$0", "forever", "Self-host on your own infrastructure",
         ["1 site", "10 pages", "1 GB storage", "12 plugins", "Community support", "MIT license"]),
        ("Starter", "$12", "/month", "Perfect for personal sites and small projects",
         ["3 sites", "50 pages", "5 GB storage", "All 22 plugins", "Email support", "Custom domains", "SSL certificates"]),
        ("Pro", "$49", "/month", "For agencies and growing businesses",
         ["10 sites", "200 pages", "10 GB storage", "All 22 plugins", "Priority support", "Resonance analytics", "A/B testing", "White-label"]),
        ("Enterprise", "$79+", "/month", "Custom solutions for large organizations",
         ["Unlimited sites", "Unlimited pages", "50 GB+ storage", "All 22 plugins", "Dedicated support", "SLA 99.9%", "SSO / SAML", "Custom integrations", "On-prem option"]),
    ]

    pw = 420
    total_w = 4 * pw + 3 * 20
    start_x = (W - total_w) // 2
    py = 240
    for i, (pname, pprice, pbilling, pdesc, features) in enumerate(plans):
        px = start_x + i * (pw + 20)
        is_pro = pname == "Pro"
        card_h = 640
        rr(d, [px, py, px + pw, py + card_h],
           fill=CARD_BG, outline=PRIMARY if is_pro else CARD_BORDER,
           radius=12, width=2 if is_pro else 1)

        if is_pro:
            pill(d, [px + pw // 2 - 50, py + 8, px + pw // 2 + 50, py + 26], PRIMARY, "Most Popular", text_color="#0a0a0a")

        name_y = py + 36
        d.text((px + 24, name_y), pname, fill=TEXT_PRIMARY, font=F_PRICE_TIER)
        d.text((px + 24, name_y + 36), pprice, fill=PRIMARY, font=F_PRICE)
        d.text((px + 24 + len(pprice) * 22 + 8, name_y + 52), pbilling, fill=TEXT_MUTED, font=F_SMALL)

        # Description
        desc_words = pdesc.split()
        line = ""
        dy = name_y + 90
        for word in desc_words:
            if len(line + word) > 40:
                d.text((px + 24, dy), line.strip(), fill=TEXT_SECONDARY, font=F_SMALL)
                dy += 18
                line = word + " "
            else:
                line += word + " "
        if line.strip():
            d.text((px + 24, dy), line.strip(), fill=TEXT_SECONDARY, font=F_SMALL)
            dy += 18

        d.line([px + 16, dy + 10, px + pw - 16, dy + 10], fill=CARD_BORDER, width=1)
        fy = dy + 24
        for feat in features:
            d.text((px + 24, fy), feat, fill=TEXT_SECONDARY, font=F_BODY)
            fy += 28

        # CTA button
        btn_y = py + card_h - 56
        if is_pro:
            rr(d, [px + 24, btn_y, px + pw - 24, btn_y + 40], fill=PRIMARY, radius=20)
            d.text((px + pw // 2 - 40, btn_y + 10), "Get Started", fill="#0a0a0a", font=F_BODY_BOLD)
        else:
            rr(d, [px + 24, btn_y, px + pw - 24, btn_y + 40], fill=None, outline=PRIMARY, radius=20, width=1)
            btn_txt = "Self-Host" if pname == "Free" else ("Start Free" if pname == "Starter" else "Contact Sales")
            d.text((px + pw // 2 - len(btn_txt) * 4, btn_y + 10), btn_txt, fill=PRIMARY, font=F_BODY_BOLD)

    # FAQ section below
    faq_y = py + 660
    d.text((W // 2 - 50, faq_y), "FAQ", fill=TEXT_PRIMARY, font=F_HEADING)
    faq_items = [
        "Can I switch plans later?", "Is there a free trial?",
        "What payment methods do you accept?", "Can I self-host and use cloud features?"
    ]
    fy = faq_y + 32
    fx = (W - 900) // 2
    for fq in faq_items:
        rr(d, [fx, fy, fx + 900, fy + 36], fill=CARD_BG, outline=CARD_BORDER, radius=8)
        d.text((fx + 16, fy + 9), fq, fill=TEXT_SECONDARY, font=F_BODY)
        d.text((fx + 870, fy + 9), "+", fill=TEXT_MUTED, font=F_BODY)
        fy += 44

    img.save(OUT_DIR + "15-pricing.png", optimize=True)
    print("  15-pricing.png")


# ============================================================
# PODCAST SCRIPT
# ============================================================
def generate_script():
    script = {
        "topics": [
            {
                "topic_title": "Sigil Landing Page",
                "screenshot": "01-landing.png",
                "dialogue": [
                    {"speaker": "HOST", "text": "Sigil is a multi-tenant headless CMS by Netrun Systems. One deployment, unlimited sites, twenty-two plugins. The landing page at sigil.netrunsystems.com leads with the value proposition: Build Anything, Own Everything. Self-host for free under MIT license, or use the managed cloud starting at twelve dollars a month."},
                    {"speaker": "GUEST", "text": "The stats bar is worth noting — twenty-two plugins, seventy-plus Google Fonts, forty-nine admin pages, zero cost for self-hosting. Most CMS platforms lock you into their hosting. Sigil ships as a Docker image you can run on any VPS, Cloud Run instance, or your own hardware. The managed cloud is for teams that want us to handle ops."}
                ]
            },
            {
                "topic_title": "Admin Dashboard",
                "screenshot": "02-dashboard.png",
                "dialogue": [
                    {"speaker": "HOST", "text": "The admin dashboard shows the full portfolio at a glance. Stats cards for total sites, pages, media usage, and active plugins. The sidebar navigation organizes all forty-nine admin pages into sections — Main, Artist Content, Engagement, Store, Booking, Broadcasting, Integrations, and System. Below the stats, recent activity streams every action — page edits, media uploads, plugin activations, orders, bookings, community posts, and webhook fires."},
                    {"speaker": "GUEST", "text": "The plugin status section shows all twenty-two plugins as badges with active or inactive indicators. System health monitors the API server, PostgreSQL, blob storage, email service, and Stripe connection with response times and pool utilization. This is a single admin panel managing what would typically require six or seven separate SaaS dashboards."}
                ]
            },
            {
                "topic_title": "Sites and Domains",
                "screenshot": "03-sites.png",
                "dialogue": [
                    {"speaker": "HOST", "text": "The Sites and Domains page manages every site in the tenant. Each card shows the site name, custom domain with SSL verification status, page count, storage usage, and last update time. Actions include edit, design, duplicate, and settings. Adding a custom domain is a DNS CNAME record — the system verifies ownership and provisions the SSL certificate automatically."},
                    {"speaker": "GUEST", "text": "Multi-site on a single deployment is where Sigil diverges from WordPress Multisite or Squarespace. There is no per-site fee. Each site has its own theme, pages, media, and plugin configuration. A design agency could run twenty client sites on one fifteen-dollar Cloud Run instance. The duplicate button clones an entire site as a starting template for the next project."}
                ]
            },
            {
                "topic_title": "Design Playground",
                "screenshot": "04-design.png",
                "dialogue": [
                    {"speaker": "HOST", "text": "The Design Playground replaces the typical theme dropdown. Six tabs — Presets, Colors, Typography, Shapes, Effects, Spacing — give full control over every visual parameter. The color palette has ten configurable tokens. Button shape options range from square to rounded to pill. Typography controls include a font browser with seventy-plus Google Fonts, heading scale sliders from H1 through body, and a custom font upload tab."},
                    {"speaker": "GUEST", "text": "The spacing tab is where it gets serious. Section padding, container max-width, card gap, block margin, grid columns, sidebar width, content padding — seven sliders with pixel-level precision. The live preview panel on the right updates with every change. Start from one of the five presets — Netrun Dark, KOG, Intirkon, Minimal, or Frost — then override anything. This level of control previously required a CSS developer."}
                ]
            },
            {
                "topic_title": "Page Editor and Blocks",
                "screenshot": "05-editor.png",
                "dialogue": [
                    {"speaker": "HOST", "text": "Pages are built from composable content blocks. The editor shows a block list with drag handles for reordering. Expanded blocks reveal inline field editors — the Hero block has headline, subheadline, CTA text, CTA URL, background image, and overlay opacity. Collapsed blocks show a summary line. The block registry is open — plugins add their own types. The artist plugin adds six block types, the community plugin adds three."},
                    {"speaker": "GUEST", "text": "The revision history panel tracks every save with a timeline. Each revision records what changed and when. You can restore any previous version. The Pricing Table block uses structured tier inputs — not raw HTML. The FAQ block uses an accordion pattern with structured question-answer pairs. Every block type has a typed schema, which means the API delivers structured JSON that any frontend can consume."}
                ]
            },
            {
                "topic_title": "Plugin Marketplace",
                "screenshot": "06-marketplace.png",
                "dialogue": [
                    {"speaker": "HOST", "text": "Twenty-two plugins ship with Sigil, organized into six categories — Content, Commerce, Engagement, Analytics, Netrun integrations, and System. The marketplace grid shows each plugin with its description, category badge, and activation status. Plugins are environment-gated: set the required API key or connection string and the plugin activates. Remove the key and it skips gracefully. No config files, no server restart."},
                    {"speaker": "GUEST", "text": "The Content category covers Blog, Portfolio, Events, Mailing List, Contact Forms, and SEO. Commerce has Stripe Store, Printful merch, PayPal, and Booking. Engagement includes Community Forum, Knowledge Base, and Resonance Analytics. The Netrun category integrates with four products — Intirkast broadcasting, KOG CRM, KAMERA OSINT research, and Charlotte AI. System plugins handle migration, webhooks, the marketplace itself, and billing."}
                ]
            },
            {
                "topic_title": "Commerce Suite",
                "screenshot": "07-commerce.png",
                "dialogue": [
                    {"speaker": "HOST", "text": "The Commerce Suite combines three payment channels and a booking system. The Store plugin syncs products with Stripe — create a product in Sigil, it creates the Stripe Product and Price automatically. Checkout generates a Stripe Session on their hosted page. Printful handles print-on-demand merch with catalog sync, mockup images, and fulfillment tracking. The Booking plugin provides service scheduling with availability rules and email confirmations."},
                    {"speaker": "GUEST", "text": "The order history table shows all transactions across payment methods in one view. Stripe charges their standard two point nine percent — Sigil adds zero platform fee. Printful prints and ships on demand, so there is no inventory to manage. The Booking section shows upcoming appointments with service duration and pricing. This replaces Calendly, Shopify, and a separate merch provider with three plugins on one platform."}
                ]
            },
            {
                "topic_title": "Community Forum",
                "screenshot": "08-community.png",
                "dialogue": [
                    {"speaker": "HOST", "text": "The Community plugin adds a gated forum. Members authenticate via magic link — no passwords. Posts support discussion, question, article, and announcement types. Questions have a solved-answer workflow. Voting affects post scores and author reputation. The leaderboard sidebar tracks top contributors across six tiers from Newcomer to Legend. Thread cards show vote count, type badge, category, solved status, and tags."},
                    {"speaker": "GUEST", "text": "Content gating is the key differentiator from open forums. Non-members see truncated previews — two hundred characters. Full content requires email verification, which blocks scrapers and incentivizes registration. Search uses PostgreSQL GIN full-text indexing. Moderation tools include pin, lock, close, and ban. The reputation system creates a natural hierarchy where quality contributors rise to Expert and Legend tiers."}
                ]
            },
            {
                "topic_title": "Resonance Analytics",
                "screenshot": "09-analytics.png",
                "dialogue": [
                    {"speaker": "HOST", "text": "Resonance is block-level content analytics. The dashboard shows a heatmap for each content block on a page — green blocks have high engagement, red blocks lose visitors. Each block has a composite score based on viewport time, click-through rate, scroll continuation, and bounce avoidance. The tracking snippet is two kilobytes, uses no cookies, collects no PII, and runs entirely through Intersection Observer."},
                    {"speaker": "GUEST", "text": "The A/B testing panel lets you clone a block as a variant and split traffic. The system evaluates the winner with a ninety-percent confidence z-test. The AI suggestions panel uses Gemini to analyze low-scoring blocks and recommend specific changes — move this section, rewrite this CTA, shorten this paragraph. Blocks scoring below forty automatically trigger suggestions. No external tracking scripts, no cookies, fully GDPR compliant."}
                ]
            },
            {
                "topic_title": "Knowledge Base",
                "screenshot": "10-docs.png",
                "dialogue": [
                    {"speaker": "HOST", "text": "The Knowledge Base plugin provides categorized documentation with search, versioning, and feedback ratings. Each article shows its category, tags, view count, helpful percentage, version number, and featured status. The search uses the same PostgreSQL GIN index as the community forum. Articles can be marked as featured to appear on the documentation homepage."},
                    {"speaker": "GUEST", "text": "The helpful ratio is the feedback loop that most documentation platforms miss. Readers rate each article, and the percentage surfaces which docs need rewriting. Version tracking means you can publish an update without losing the previous draft. This replaces GitBook or Notion for product documentation while staying inside the same admin panel as your CMS, commerce, and community."}
                ]
            },
            {
                "topic_title": "Migration Tool",
                "screenshot": "11-migrate.png",
                "dialogue": [
                    {"speaker": "HOST", "text": "The Migration Tool imports content from WordPress, Shopify, and Square. WordPress imports read WXR XML exports — posts, pages, media, and categories map directly to Sigil content blocks and the media library. Shopify imports products and collections from CSV. Square API integration is planned. The migration history table shows every completed and in-progress import with content counts and duration."},
                    {"speaker": "GUEST", "text": "The active migration progress bar shows real-time status — step three of five, downloading media assets, sixty percent complete. Content mapping is the hard part of any CMS migration, and the tool handles the WordPress post format to Sigil block conversion automatically. A forty-seven post WordPress site with eighty-nine media files migrated in under four minutes. That removes the biggest barrier to switching from an existing CMS."}
                ]
            },
            {
                "topic_title": "Netrun Platform Integrations",
                "screenshot": "12-platform.png",
                "dialogue": [
                    {"speaker": "HOST", "text": "Sigil integrates with four products from the Netrun ecosystem. KOG CRM shows lead management with pipeline stages, deal values, and lead scores. Intirkast handles broadcasting with live stream status and scheduling across YouTube, Twitch, and LinkedIn. KAMERA provides OSINT research and intelligence report generation. Charlotte AI embeds a RAG-powered chat widget that answers questions using your site content and documentation."},
                    {"speaker": "GUEST", "text": "The Support Panel adds ticketing with priority levels, assignment routing, and SLA tracking. The Charlotte AI preview shows context-aware responses — ask how to add a Stripe product and it walks through the exact steps using your documentation. These are not generic integrations. They share the same PostgreSQL database, the same auth system, and the same admin panel. Activating KOG CRM in Sigil gives you lead management without a separate CRM subscription."}
                ]
            },
            {
                "topic_title": "Webhooks and Events",
                "screenshot": "13-webhooks.png",
                "dialogue": [
                    {"speaker": "HOST", "text": "The Webhooks plugin provides an event bus with endpoint management. Register a URL, select the events it receives — page published, order completed, form submitted, community post created — and the system delivers JSON payloads with HMAC-SHA256 signatures. Each endpoint shows its success rate, last fire time, and delivery log. Retry logic follows a two-four-eight second backoff pattern with three attempts."},
                    {"speaker": "GUEST", "text": "The delivery log is the debugging tool. Every webhook fire shows the event type, endpoint, HTTP status, response, duration, and timestamp. Failed deliveries show retry attempts and eventual resolution. This is the integration layer that connects Sigil to Slack, Zapier, n8n, or any external system. The HMAC signing prevents spoofed payloads — the receiving system verifies the signature before processing."}
                ]
            },
            {
                "topic_title": "Billing and Plans",
                "screenshot": "14-billing.png",
                "dialogue": [
                    {"speaker": "HOST", "text": "The Billing page manages SaaS subscriptions through Stripe. The current plan card shows the tier, monthly cost, and next billing date. Usage meters track sites, pages, storage, and API calls against plan limits with visual progress bars. The plan comparison grid shows all four tiers side by side — Free at zero dollars for self-hosting, Starter at twelve dollars, Pro at forty-nine dollars, and Enterprise at seventy-nine dollars and up."},
                    {"speaker": "GUEST", "text": "Plan enforcement is automatic. Hit your site limit on Starter and the system blocks new site creation with an upgrade prompt — it does not silently charge overage fees. The Free tier is genuinely free for self-hosting with twelve plugins. The Pro tier unlocks Resonance analytics, A/B testing, and white-label branding. Enterprise adds SLA, SSO, and custom integrations. Stripe handles all billing, invoicing, and subscription lifecycle."}
                ]
            },
            {
                "topic_title": "Public Pricing Page",
                "screenshot": "15-pricing.png",
                "dialogue": [
                    {"speaker": "HOST", "text": "The public pricing page presents all four tiers with an annual billing toggle that saves twenty percent. Free is self-hosted under MIT license — one site, ten pages, one gigabyte storage, twelve plugins, community support. Starter at twelve dollars per month adds three sites, fifty pages, five gigs, all twenty-two plugins, and email support. Pro at forty-nine adds ten sites, two hundred pages, analytics, A/B testing, and priority support. Enterprise starts at seventy-nine for unlimited everything with SLA and SSO."},
                    {"speaker": "GUEST", "text": "The self-host option is the trust signal. Sigil is not a walled garden — download the Docker image, deploy it anywhere, and you own the data. The cloud tiers exist for teams that want managed infrastructure, automatic updates, and support. The FAQ section addresses the common questions — plan switching, free trials, payment methods, and hybrid self-host-plus-cloud configurations. The pricing is intentionally below Squarespace, Webflow, and WordPress hosting, because the infrastructure cost for running Sigil on Cloud Run is genuinely lower."}
                ]
            }
        ]
    }

    with open(SCRIPT_PATH, "w") as f:
        json.dump(script, f, indent=2)
    print(f"  podcast_script.json")


# ============================================================
# MAIN
# ============================================================
if __name__ == "__main__":
    print("Generating Sigil CMS Feature Tour v2...")
    print("=" * 50)

    print("\nGenerating screenshots:")
    scene_01_landing()
    scene_02_dashboard()
    scene_03_sites()
    scene_04_design()
    scene_05_editor()
    scene_06_marketplace()
    scene_07_commerce()
    scene_08_community()
    scene_09_analytics()
    scene_10_docs()
    scene_11_migrate()
    scene_12_platform()
    scene_13_webhooks()
    scene_14_billing()
    scene_15_pricing()

    print("\nGenerating podcast script:")
    generate_script()

    print("\n" + "=" * 50)
    print("Complete! Files in:")
    print(f"  Screenshots: {OUT_DIR}")
    print(f"  Script: {SCRIPT_PATH}")
