#!/usr/bin/env python3
"""
Sigil CMS Feature Tour v4 — Generate 21 screenshots + podcast script + render video.

Changes from v2/v3:
1. Angular S logo in sidebar (geometric white S on sage green rounded rect)
2. Corrected sidebar order matching logical flow
3. Block editor scene with bento_grid layout picker + pricing_table horizontal editor
4. Tall images sized exactly to content (no extra padding)
5. Scene order matches sidebar + logical flow (21 scenes)
6. "Sijil" pronunciation in all dialogue
"""

import base64
import json
import os
import random
import subprocess
import sys
import time
from pathlib import Path

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
OUT_DIR = "/data/workspace/github/netrun-cms/studiocast/v4/screenshots/"
V4_DIR = Path("/data/workspace/github/netrun-cms/studiocast/v4")

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
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def pill(draw, xy, fill, text_str, text_font=F_TINY, text_color="#0a0a0a"):
    rr(draw, xy, fill=fill, radius=10)
    bx = (xy[0] + xy[2]) // 2
    by = (xy[1] + xy[3]) // 2
    bbox = text_font.getbbox(text_str)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text((bx - tw // 2, by - th // 2 - 1), text_str, fill=text_color, font=text_font)


def draw_logo(draw, x=20, y=15):
    """Draw the Sigil S logo — angular white geometric S on sage green rounded rect."""
    # Sage green background
    rr(draw, [x, y, x + 35, y + 40], fill=PRIMARY, radius=10)
    # Draw angular S shape (white geometric S)
    # Top horizontal bar
    draw.polygon([
        (x + 8, y + 6), (x + 27, y + 6),
        (x + 27, y + 10), (x + 8, y + 10)
    ], fill="#ffffff")
    # Left vertical connector
    draw.polygon([
        (x + 8, y + 10), (x + 12, y + 10),
        (x + 12, y + 20), (x + 8, y + 20)
    ], fill="#ffffff")
    # Middle horizontal bar
    draw.polygon([
        (x + 8, y + 18), (x + 27, y + 18),
        (x + 27, y + 22), (x + 8, y + 22)
    ], fill="#ffffff")
    # Right vertical connector
    draw.polygon([
        (x + 23, y + 20), (x + 27, y + 20),
        (x + 27, y + 32), (x + 23, y + 32)
    ], fill="#ffffff")
    # Bottom horizontal bar
    draw.polygon([
        (x + 8, y + 30), (x + 27, y + 30),
        (x + 27, y + 34), (x + 8, y + 34)
    ], fill="#ffffff")
    # Text
    draw.text((x + 45, y + 5), "Sigil", fill=TEXT_PRIMARY, font=font(20, bold=True))
    draw.text((x + 45, y + 31), "by Netrun", fill=TEXT_MUTED, font=F_TINY)


# v4 sidebar nav order — matches logical flow
FULL_NAV = [
    ("MAIN", None),
    ("Dashboard", "grid"),
    ("Sites", "globe"),
    ("SITE-SCOPED", None),
    ("Pages", "file"),
    ("Media Library", "image"),
    ("Theme", "palette"),
    ("ARTIST CONTENT", None),
    ("Blog / Posts", "edit"),
    ("Portfolio", "camera"),
    ("Events Calendar", "calendar"),
    ("KNOWLEDGE", None),
    ("Knowledge Base", "book"),
    ("ENGAGEMENT", None),
    ("Mailing List", "mail"),
    ("Contact Forms", "inbox"),
    ("SEO Manager", "search"),
    ("STORE", None),
    ("Products (Stripe)", "cart"),
    ("Merch (Printful)", "shirt"),
    ("BOOKING", None),
    ("Services", "clock"),
    ("Appointments", "cal"),
    ("COMMUNITY", None),
    ("Community Forum", "users"),
    ("ANALYTICS", None),
    ("Resonance", "chart"),
    ("BROADCASTING", None),
    ("Intirkast", "radio"),
    ("CRM", None),
    ("KOG CRM", "users2"),
    ("INTEGRATIONS", None),
    ("KAMERA Scans", "scan"),
    ("Migration Tool", "import"),
    ("Webhooks", "link"),
    ("Support Panel", "help"),
    ("AI & MARKETPLACE", None),
    ("AI Advisor", "bot"),
    ("Charlotte AI", "bot2"),
    ("Marketplace", "puzzle"),
    ("SYSTEM", None),
    ("Billing", "card"),
    ("Settings", "gear"),
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
            draw.text((20, y + 2), label, fill=TEXT_MUTED, font=F_NAV_SECTION)
            y += 24
            continue

        if label == active_label:
            rr(draw, [12, y, SIDEBAR_W - 12, y + 32], fill="#1a2e27", radius=6)
            draw.rectangle([4, y + 6, 6, y + 26], fill=PRIMARY)
            color = PRIMARY
        else:
            color = TEXT_SECONDARY

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
    for gx in range(0, W, 60):
        d.line([gx, 0, gx, H_STD], fill="#0d0d0d", width=1)
    for gy in range(0, H_STD, 60):
        d.line([0, gy, W, gy], fill="#0d0d0d", width=1)

    # Top nav
    rr(d, [0, 0, W, 64], fill="#0a0a0aee", radius=0)
    # S logo in nav
    rr(d, [40, 12, 75, 52], fill=PRIMARY, radius=10)
    # Angular S in nav bar
    sx, sy = 48, 14
    d.polygon([(sx, sy), (sx + 19, sy), (sx + 19, sy + 4), (sx, sy + 4)], fill="#ffffff")
    d.polygon([(sx, sy + 4), (sx + 4, sy + 4), (sx + 4, sy + 14), (sx, sy + 14)], fill="#ffffff")
    d.polygon([(sx, sy + 12), (sx + 19, sy + 12), (sx + 19, sy + 16), (sx, sy + 16)], fill="#ffffff")
    d.polygon([(sx + 15, sy + 14), (sx + 19, sy + 14), (sx + 19, sy + 26), (sx + 15, sy + 26)], fill="#ffffff")
    d.polygon([(sx, sy + 24), (sx + 19, sy + 24), (sx + 19, sy + 28), (sx, sy + 28)], fill="#ffffff")
    d.text((85, 20), "Sigil", fill=TEXT_PRIMARY, font=font(22, bold=True))
    nav_links = ["Features", "Plugins", "Pricing", "Docs", "Blog"]
    nx = 600
    for nl in nav_links:
        d.text((nx, 22), nl, fill=TEXT_SECONDARY, font=F_BODY)
        nx += 120
    rr(d, [W - 200, 16, W - 40, 48], fill=PRIMARY, radius=20)
    d.text((W - 170, 22), "Get Started", fill="#0a0a0a", font=F_BODY_BOLD)

    # Hero
    hero_y = 180
    d.text((W // 2 - 340, hero_y), "Build Anything.", fill=TEXT_PRIMARY, font=F_HERO)
    d.text((W // 2 - 300, hero_y + 64), "Own Everything.", fill=PRIMARY, font=F_HERO)
    sub = "Multi-tenant headless CMS with 22 plugins. Self-host free, or cloud from $12/mo."
    d.text((W // 2 - 380, hero_y + 150), sub, fill=TEXT_SECONDARY, font=F_HERO_SUB)

    btn_y = hero_y + 210
    rr(d, [W // 2 - 200, btn_y, W // 2 - 20, btn_y + 50], fill=PRIMARY, radius=25)
    d.text((W // 2 - 170, btn_y + 14), "Start Building", fill="#0a0a0a", font=F_BODY_BOLD)
    rr(d, [W // 2 + 20, btn_y, W // 2 + 200, btn_y + 50], fill=None, outline=PRIMARY, radius=25, width=2)
    d.text((W // 2 + 56, btn_y + 14), "View Demo", fill=PRIMARY, font=F_BODY_BOLD)

    # Stats bar
    stats_y = hero_y + 300
    rr(d, [200, stats_y, W - 200, stats_y + 80], fill=CARD_BG, outline=CARD_BORDER, radius=12)
    stats = [("22", "Plugins"), ("70+", "Google Fonts"), ("49", "Admin Pages"), ("$0", "Self-Host")]
    sx2 = 280
    for val, lbl in stats:
        d.text((sx2, stats_y + 12), val, fill=PRIMARY, font=font(26, bold=True))
        d.text((sx2, stats_y + 48), lbl, fill=TEXT_SECONDARY, font=F_SMALL)
        sx2 += 340

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
# SCENE 2: Admin Dashboard (TALL - scrollable)
# ============================================================
def scene_02_dashboard():
    h = 1900  # content-aware height
    img, d = new_image(h)
    draw_sidebar(d, "Dashboard", h)
    cy = draw_topbar(d, "Dashboard", "Admin / Dashboard")

    card_w = (CONTENT_W - 60) // 4
    stats = [("12", "Total Sites"), ("148", "Pages"), ("1.2 GB", "Media Used"), ("22", "Active Plugins")]
    colors = [PRIMARY, INFO, WARNING, SUCCESS]
    for i, (val, lbl) in enumerate(stats):
        sx = CONTENT_X + i * (card_w + 20)
        draw_stat_card(d, sx, cy, card_w, lbl, val, colors[i])
    cy += 110

    # Quick actions
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
        ("Webhook fired", "page.published -> Slack notification", "2.5 hr ago", TEXT_MUTED),
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
# SCENE 3: Sites & Domains + Cloning + Subdomains (TALL scroll)
# ============================================================
def scene_03_sites():
    h = 2200
    img, d = new_image(h)
    draw_sidebar(d, "Sites", h)
    cy = draw_topbar(d, "Sites & Domains", "Admin / Sites")

    rr(d, [CONTENT_X, cy, CONTENT_X + 140, cy + 36], fill=PRIMARY, radius=18)
    d.text((CONTENT_X + 18, cy + 9), "+ New Site", fill="#0a0a0a", font=F_BODY_BOLD)
    cy += 56

    sites = [
        {"name": "Netrun Systems", "domain": "netrunsystems.com", "ssl": True, "verified": True, "status": "Published", "pages": 24, "storage": "340 MB", "updated": "2 min ago", "desc": "Corporate site — services, team, case studies"},
        {"name": "Sigil Documentation", "domain": "docs.sigil.dev", "ssl": True, "verified": True, "status": "Published", "pages": 67, "storage": "120 MB", "updated": "1 hr ago", "desc": "Plugin API docs, guides, tutorials"},
        {"name": "Client Demo", "domain": "demo.sigil.dev", "ssl": True, "verified": False, "status": "Draft", "pages": 6, "storage": "15 MB", "updated": "1 day ago", "desc": "Interactive demo environment for prospects"},
    ]

    for site in sites:
        card_h = 160
        rr(d, [CONTENT_X, cy, CONTENT_X + CONTENT_W, cy + card_h], fill=CARD_BG, outline=CARD_BORDER, radius=10)
        d.text((CONTENT_X + 20, cy + 16), site["name"], fill=TEXT_PRIMARY, font=F_HEADING)
        status_color = SUCCESS if site["status"] == "Published" else WARNING
        sx2 = CONTENT_X + 20 + len(site["name"]) * 12 + 20
        pill(d, [sx2, cy + 16, sx2 + 80, cy + 34], status_color, site["status"])
        d.text((CONTENT_X + 20, cy + 48), site["domain"], fill=PRIMARY, font=F_BODY)
        ssl_x = CONTENT_X + 20 + len(site["domain"]) * 9 + 16
        if site["ssl"]:
            pill(d, [ssl_x, cy + 48, ssl_x + 40, cy + 64], SUCCESS, "SSL", text_color="#fff")
        d.text((CONTENT_X + 20, cy + 78), site["desc"], fill=TEXT_SECONDARY, font=F_SMALL)
        d.text((CONTENT_X + 20, cy + 100), f"{site['pages']} pages  |  {site['storage']}  |  Updated {site['updated']}", fill=TEXT_MUTED, font=F_SMALL)
        btn_y2 = cy + 122
        for act in ["Edit", "Design", "Duplicate", "Settings"]:
            bw = len(act) * 8 + 24
            rr(d, [CONTENT_X + 20, btn_y2, CONTENT_X + 20 + bw, btn_y2 + 28], fill=None, outline=CARD_BORDER, radius=14, width=1)
            d.text((CONTENT_X + 32, btn_y2 + 6), act, fill=TEXT_SECONDARY, font=F_SMALL)
            CONTENT_X_TMP = CONTENT_X + 20 + bw + 10
            # Move cursor
        cy += card_h + 16

    # --- Site Cloning Section ---
    cy += 10
    d.text((CONTENT_X, cy), "Clone Site", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 30
    src_w = 540
    rr(d, [CONTENT_X, cy, CONTENT_X + src_w, cy + 110], fill=CARD_BG, outline=CARD_BORDER, radius=10)
    d.text((CONTENT_X + 20, cy + 14), "Netrun Systems", fill=TEXT_PRIMARY, font=F_HEADING)
    pill(d, [CONTENT_X + 210, cy + 16, CONTENT_X + 290, cy + 34], SUCCESS, "Published")
    d.text((CONTENT_X + 20, cy + 44), "24 pages  |  340 MB  |  12 blocks", fill=TEXT_SECONDARY, font=F_SMALL)
    rr(d, [CONTENT_X + 20, cy + 72, CONTENT_X + 130, cy + 100], fill=PRIMARY, radius=15)
    d.text((CONTENT_X + 38, cy + 78), "Clone Site", fill="#0a0a0a", font=F_BODY_BOLD)

    arrow_x = CONTENT_X + src_w + 20
    arrow_y2 = cy + 50
    d.line([arrow_x, arrow_y2, arrow_x + 80, arrow_y2], fill=PRIMARY, width=3)
    d.polygon([(arrow_x + 80, arrow_y2 - 8), (arrow_x + 95, arrow_y2), (arrow_x + 80, arrow_y2 + 8)], fill=PRIMARY)

    clone_x = arrow_x + 110
    rr(d, [clone_x, cy, clone_x + src_w, cy + 110], fill=CARD_BG, outline=PRIMARY, radius=10, width=2)
    d.text((clone_x + 20, cy + 14), "Netrun Systems (Copy)", fill=TEXT_PRIMARY, font=F_HEADING)
    pill(d, [clone_x + 300, cy + 16, clone_x + 360, cy + 34], WARNING, "Draft")
    d.text((clone_x + 20, cy + 44), "24 pages  |  340 MB  |  12 blocks", fill=TEXT_SECONDARY, font=F_SMALL)
    pill(d, [clone_x + 20, cy + 74, clone_x + 120, cy + 92], INFO, "Just Cloned", text_color="#fff")
    cy += 140

    # --- Subdomain Routing Section ---
    d.text((CONTENT_X, cy), "Auto-Generated Subdomains", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 32
    subdomain_sites = [
        ("Frost Portfolio", "frost.sigil.netrunsystems.com", "Published"),
        ("Agency Portfolio", "portfolio.sigil.netrunsystems.com", "Published"),
        ("Agency Client", "agency-client.sigil.netrunsystems.com", "Draft"),
    ]
    for name, subdomain, status in subdomain_sites:
        rr(d, [CONTENT_X, cy, CONTENT_X + CONTENT_W, cy + 56], fill=CARD_BG, outline=CARD_BORDER, radius=10)
        d.text((CONTENT_X + 20, cy + 8), name, fill=TEXT_PRIMARY, font=F_BODY_BOLD)
        sc = SUCCESS if status == "Published" else WARNING
        pill(d, [CONTENT_X + 20 + len(name) * 9 + 16, cy + 8, CONTENT_X + 20 + len(name) * 9 + 96, cy + 26], sc, status)
        d.text((CONTENT_X + 20, cy + 32), subdomain, fill=PRIMARY, font=F_SMALL)
        pill(d, [CONTENT_X + 20 + len(subdomain) * 7 + 12, cy + 32, CONTENT_X + 20 + len(subdomain) * 7 + 52, cy + 48], SUCCESS, "SSL", text_color="#fff")
        cy += 66

    cy += 10
    # Routing diagram
    d.text((CONTENT_X, cy), "Host Header Resolution Flow", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 36
    steps_data = [("Browser Request", INFO), ("Host Header", PURPLE), ("Tenant Lookup", WARNING), ("Site Content", SUCCESS)]
    box_w, box_h = 200, 60
    step_x = CONTENT_X + 40
    for i, (label, color) in enumerate(steps_data):
        bx = step_x + i * (box_w + 80)
        rr(d, [bx, cy, bx + box_w, cy + box_h], fill=CARD_BG, outline=color, radius=10, width=2)
        bbox = F_BODY_BOLD.getbbox(label)
        tw = bbox[2] - bbox[0]
        d.text((bx + (box_w - tw) // 2, cy + 20), label, fill=color, font=F_BODY_BOLD)
        if i < len(steps_data) - 1:
            ax2 = bx + box_w + 8
            ay2 = cy + box_h // 2
            d.line([ax2, ay2, ax2 + 60, ay2], fill=TEXT_MUTED, width=2)
            d.polygon([(ax2 + 60, ay2 - 6), (ax2 + 72, ay2), (ax2 + 60, ay2 + 6)], fill=TEXT_MUTED)

    img.save(OUT_DIR + "03-sites.png", optimize=True)
    print("  03-sites.png")


# ============================================================
# SCENE 4: Page Editor + Block Editor with grid editing (TALL scroll)
# ============================================================
def scene_04_editor():
    h = 2400
    img, d = new_image(h)
    draw_sidebar(d, "Pages", h)
    cy = draw_topbar(d, "Edit Page: Homepage", "Admin / Pages / Homepage")

    # Page meta bar
    rr(d, [CONTENT_X, cy, CONTENT_X + CONTENT_W, cy + 44], fill=CARD_BG, outline=CARD_BORDER, radius=8)
    d.text((CONTENT_X + 16, cy + 12), "Slug: /", fill=TEXT_SECONDARY, font=F_SMALL)
    d.text((CONTENT_X + 60, cy + 12), "home", fill=TEXT_PRIMARY, font=F_SMALL)
    pill(d, [CONTENT_X + 140, cy + 10, CONTENT_X + 220, cy + 28], SUCCESS, "Published")
    rr(d, [CONTENT_X + CONTENT_W - 80, cy + 8, CONTENT_X + CONTENT_W - 8, cy + 36], fill=PRIMARY, radius=16)
    d.text((CONTENT_X + CONTENT_W - 64, cy + 14), "Save", fill="#0a0a0a", font=F_SMALL_BOLD)
    cy += 60

    block_w = CONTENT_W - 280
    rev_x = CONTENT_X + block_w + 20
    rev_w = 260

    d.text((CONTENT_X, cy), "Content Blocks", fill=TEXT_PRIMARY, font=F_HEADING)
    rr(d, [CONTENT_X + 160, cy - 2, CONTENT_X + 260, cy + 22], fill=PRIMARY, radius=12)
    d.text((CONTENT_X + 172, cy + 2), "+ Add Block", fill="#0a0a0a", font=F_SMALL_BOLD)
    cy += 36

    # Standard blocks
    blocks = [
        {"type": "Hero", "expanded": True, "fields": [("Headline", "Build Anything. Own Everything."), ("Subheadline", "Multi-tenant headless CMS with 22 plugins"), ("CTA Text", "Get Started"), ("CTA URL", "/signup"), ("Background", "hero-bg.webp"), ("Overlay Opacity", "60%")]},
        {"type": "Stats Bar", "expanded": False, "summary": "4 stat items — Sites, Pages, Plugins, Fonts"},
    ]

    for block in blocks:
        if block["expanded"]:
            bh = 60 + len(block["fields"]) * 40
            rr(d, [CONTENT_X, cy, CONTENT_X + block_w, cy + bh], fill=CARD_BG, outline=PRIMARY, radius=10, width=2)
            d.text((CONTENT_X + 40, cy + 14), block["type"], fill=PRIMARY, font=F_BODY_BOLD)
            for dy2 in [cy + 16, cy + 22, cy + 28]:
                d.line([CONTENT_X + 14, dy2, CONTENT_X + 26, dy2], fill=TEXT_MUTED, width=1)
            fy = cy + 48
            for f_label, f_value in block["fields"]:
                d.text((CONTENT_X + 20, fy + 4), f_label, fill=TEXT_SECONDARY, font=F_SMALL)
                rr(d, [CONTENT_X + 160, fy, CONTENT_X + block_w - 20, fy + 30], fill="#0a0a0a", outline=CARD_BORDER, radius=4)
                d.text((CONTENT_X + 172, fy + 7), f_value, fill=TEXT_PRIMARY, font=F_SMALL)
                fy += 40
            cy += bh + 12
        else:
            rr(d, [CONTENT_X, cy, CONTENT_X + block_w, cy + 48], fill=CARD_BG, outline=CARD_BORDER, radius=10)
            for dy2 in [cy + 18, cy + 24, cy + 30]:
                d.line([CONTENT_X + 14, dy2, CONTENT_X + 26, dy2], fill=TEXT_MUTED, width=1)
            d.text((CONTENT_X + 40, cy + 14), block["type"], fill=TEXT_PRIMARY, font=F_BODY_BOLD)
            d.text((CONTENT_X + 200, cy + 16), block.get("summary", ""), fill=TEXT_MUTED, font=F_SMALL)
            cy += 56

    # === BENTO GRID BLOCK with layout preset picker ===
    bento_h = 320
    rr(d, [CONTENT_X, cy, CONTENT_X + block_w, cy + bento_h], fill=CARD_BG, outline=PRIMARY, radius=10, width=2)
    d.text((CONTENT_X + 40, cy + 14), "Bento Grid", fill=PRIMARY, font=F_BODY_BOLD)
    pill(d, [CONTENT_X + 160, cy + 12, CONTENT_X + 250, cy + 30], INFO, "Layout Block", text_color="#fff")
    for dy2 in [cy + 16, cy + 22, cy + 28]:
        d.line([CONTENT_X + 14, dy2, CONTENT_X + 26, dy2], fill=TEXT_MUTED, width=1)

    # Layout preset picker — 4 visual thumbnails
    d.text((CONTENT_X + 20, cy + 48), "Layout Preset", fill=TEXT_SECONDARY, font=F_SMALL)
    presets = ["2-Col", "3-Col", "Featured L", "Featured R"]
    thumb_w = 160
    thumb_h = 90
    tx = CONTENT_X + 20
    ty = cy + 68
    for pi, pname in enumerate(presets):
        px2 = tx + pi * (thumb_w + 12)
        is_selected = pi == 2  # Featured L selected
        rr(d, [px2, ty, px2 + thumb_w, ty + thumb_h], fill="#0d0d0d", outline=PRIMARY if is_selected else CARD_BORDER, radius=8, width=2 if is_selected else 1)
        # Draw mini layout preview
        if pi == 0:  # 2-col
            rr(d, [px2 + 8, ty + 8, px2 + 72, ty + thumb_h - 8], fill="#1a2e27", radius=4)
            rr(d, [px2 + 80, ty + 8, px2 + thumb_w - 8, ty + thumb_h - 8], fill="#1a2e27", radius=4)
        elif pi == 1:  # 3-col
            for ci in range(3):
                cx2 = px2 + 8 + ci * 50
                rr(d, [cx2, ty + 8, cx2 + 44, ty + thumb_h - 8], fill="#1a2e27", radius=4)
        elif pi == 2:  # Featured left
            rr(d, [px2 + 8, ty + 8, px2 + 96, ty + thumb_h - 8], fill="#1a2e27", radius=4)
            rr(d, [px2 + 104, ty + 8, px2 + thumb_w - 8, ty + 40], fill="#1a2e27", radius=4)
            rr(d, [px2 + 104, ty + 48, px2 + thumb_w - 8, ty + thumb_h - 8], fill="#1a2e27", radius=4)
        else:  # Featured right
            rr(d, [px2 + 8, ty + 8, px2 + 52, ty + 40], fill="#1a2e27", radius=4)
            rr(d, [px2 + 8, ty + 48, px2 + 52, ty + thumb_h - 8], fill="#1a2e27", radius=4)
            rr(d, [px2 + 60, ty + 8, px2 + thumb_w - 8, ty + thumb_h - 8], fill="#1a2e27", radius=4)
        d.text((px2 + thumb_w // 2 - len(pname) * 4, ty + thumb_h + 4), pname, fill=PRIMARY if is_selected else TEXT_MUTED, font=F_TINY)
    cy += bento_h + 12

    # === PRICING TABLE BLOCK with horizontal card editor ===
    pricing_h = 280
    rr(d, [CONTENT_X, cy, CONTENT_X + block_w, cy + pricing_h], fill=CARD_BG, outline=PRIMARY, radius=10, width=2)
    d.text((CONTENT_X + 40, cy + 14), "Pricing Table", fill=PRIMARY, font=F_BODY_BOLD)
    pill(d, [CONTENT_X + 180, cy + 12, CONTENT_X + 290, cy + 30], WARNING, "Horizontal Editor", text_color="#0a0a0a")
    for dy2 in [cy + 16, cy + 22, cy + 28]:
        d.line([CONTENT_X + 14, dy2, CONTENT_X + 26, dy2], fill=TEXT_MUTED, width=1)

    # Horizontal tier cards side by side
    tier_names = ["Free", "Starter", "Pro", "Enterprise"]
    tier_prices = ["$0", "$12/mo", "$49/mo", "$79+/mo"]
    tier_w = (block_w - 60) // 4
    for ti, (tname, tprice) in enumerate(zip(tier_names, tier_prices)):
        tx2 = CONTENT_X + 20 + ti * (tier_w + 10)
        is_pro = tname == "Pro"
        rr(d, [tx2, cy + 44, tx2 + tier_w, cy + pricing_h - 20], fill="#0d0d0d", outline=PRIMARY if is_pro else CARD_BORDER, radius=8, width=2 if is_pro else 1)
        if is_pro:
            pill(d, [tx2 + 10, cy + 50, tx2 + tier_w - 10, cy + 66], PRIMARY, "Highlighted", text_color="#0a0a0a")
        d.text((tx2 + 12, cy + 72), tname, fill=TEXT_PRIMARY, font=F_BODY_BOLD)
        d.text((tx2 + 12, cy + 94), tprice, fill=PRIMARY, font=F_HEADING)
        # Editable fields
        rr(d, [tx2 + 8, cy + 122, tx2 + tier_w - 8, cy + 144], fill="#0a0a0a", outline=CARD_BORDER, radius=4)
        d.text((tx2 + 14, cy + 128), "Features...", fill=TEXT_MUTED, font=F_TINY)
        # CTA button
        rr(d, [tx2 + 12, cy + pricing_h - 58, tx2 + tier_w - 12, cy + pricing_h - 34], fill=PRIMARY if is_pro else None, outline=None if is_pro else CARD_BORDER, radius=12)
        d.text((tx2 + tier_w // 2 - 18, cy + pricing_h - 54), "CTA", fill="#0a0a0a" if is_pro else TEXT_MUTED, font=F_SMALL_BOLD)
    cy += pricing_h + 12

    # More collapsed blocks
    for btype, bsummary in [("CTA Banner", "Full-width sage green CTA with button"), ("FAQ Accordion", "8 questions, collapsible"), ("Footer", "4-column footer with social links")]:
        rr(d, [CONTENT_X, cy, CONTENT_X + block_w, cy + 48], fill=CARD_BG, outline=CARD_BORDER, radius=10)
        for dy2 in [cy + 18, cy + 24, cy + 30]:
            d.line([CONTENT_X + 14, dy2, CONTENT_X + 26, dy2], fill=TEXT_MUTED, width=1)
        d.text((CONTENT_X + 40, cy + 14), btype, fill=TEXT_PRIMARY, font=F_BODY_BOLD)
        d.text((CONTENT_X + 200, cy + 16), bsummary, fill=TEXT_MUTED, font=F_SMALL)
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
        ("v9", "2 hr ago", "New bento grid layout"),
        ("v8", "Yesterday", "FAQ content update"),
        ("v7", "2 days ago", "Feature grid redesign"),
    ]
    ry2 = ry + 52
    for rev_name, rev_time, rev_desc in revisions:
        d.ellipse([rev_x + 16, ry2 + 6, rev_x + 24, ry2 + 14], fill=PRIMARY if "current" in rev_name else TEXT_MUTED)
        if rev_name != revisions[-1][0]:
            d.line([rev_x + 20, ry2 + 16, rev_x + 20, ry2 + 70], fill="#333333", width=1)
        d.text((rev_x + 32, ry2), rev_name, fill=PRIMARY if "current" in rev_name else TEXT_SECONDARY, font=F_SMALL_BOLD)
        d.text((rev_x + 32, ry2 + 18), rev_time, fill=TEXT_MUTED, font=F_TINY)
        d.text((rev_x + 32, ry2 + 34), rev_desc, fill=TEXT_SECONDARY, font=F_SMALL)
        ry2 += 72

    img.save(OUT_DIR + "04-editor.png", optimize=True)
    print("  04-editor.png")


# ============================================================
# SCENE 5: Design Playground + Block Templates (TALL scroll)
# ============================================================
def scene_05_design():
    h = 2200
    img, d = new_image(h)
    draw_sidebar(d, "Theme", h)
    cy = draw_topbar(d, "Design Playground", "Admin / Theme / Design Playground")

    tabs = ["Presets", "Colors", "Typography", "Shapes", "Effects", "Spacing"]
    tx = CONTENT_X
    for i, tab in enumerate(tabs):
        tw = len(tab) * 10 + 30
        if i == 1:
            rr(d, [tx, cy, tx + tw, cy + 34], fill=PRIMARY, radius=17)
            d.text((tx + 15, cy + 8), tab, fill="#0a0a0a", font=F_BODY_BOLD)
        else:
            rr(d, [tx, cy, tx + tw, cy + 34], fill=None, outline=CARD_BORDER, radius=17, width=1)
            d.text((tx + 15, cy + 8), tab, fill=TEXT_SECONDARY, font=F_BODY)
        tx += tw + 10
    cy += 54

    controls_w = 600
    preview_x = CONTENT_X + controls_w + 30
    preview_w = CONTENT_W - controls_w - 30

    # Color palette
    d.text((CONTENT_X, cy), "Color Palette", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 32
    color_rows = [
        ("Primary", "#90b9ab", PRIMARY), ("Secondary", "#1a1a1a", "#1a1a1a"),
        ("Accent", "#a78bfa", PURPLE), ("Background", "#0a0a0a", "#0a0a0a"),
        ("Surface", "#161616", CARD_BG), ("Text Primary", "#e5e5e5", TEXT_PRIMARY),
        ("Text Secondary", "#a0a0a0", TEXT_SECONDARY), ("Success", "#10b981", SUCCESS),
        ("Warning", "#f59e0b", WARNING), ("Error", "#ef4444", ERROR),
    ]
    for label, hex_val, color in color_rows:
        rr(d, [CONTENT_X, cy, CONTENT_X + controls_w, cy + 44], fill=CARD_BG, outline=CARD_BORDER, radius=8)
        rr(d, [CONTENT_X + 12, cy + 8, CONTENT_X + 40, cy + 36], fill=color, radius=6)
        d.text((CONTENT_X + 52, cy + 6), label, fill=TEXT_PRIMARY, font=F_BODY_BOLD)
        d.text((CONTENT_X + 52, cy + 24), hex_val, fill=TEXT_MUTED, font=F_TINY)
        rr(d, [CONTENT_X + controls_w - 140, cy + 8, CONTENT_X + controls_w - 12, cy + 36], fill="#0a0a0a", outline=CARD_BORDER, radius=4)
        d.text((CONTENT_X + controls_w - 130, cy + 13), hex_val, fill=TEXT_SECONDARY, font=F_SMALL)
        cy += 50
    cy += 20

    # Button shapes
    d.text((CONTENT_X, cy), "Button Shape", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 32
    for shape, rad, selected in [("Square", 2, False), ("Rounded", 8, False), ("Pill", 25, True)]:
        bx2 = CONTENT_X + [0, 180, 360][[s[0] for s in [("Square",), ("Rounded",), ("Pill",)]].index(shape)]
        rr(d, [bx2, cy, bx2 + 160, cy + 44], fill=PRIMARY if selected else CARD_BG, outline=PRIMARY, radius=rad, width=2)
        tc = "#0a0a0a" if selected else PRIMARY
        d.text((bx2 + 40, cy + 12), shape, fill=tc, font=F_BODY_BOLD)
    cy += 64

    # Typography + font browser
    d.text((CONTENT_X, cy), "Typography", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 32
    d.text((CONTENT_X, cy), "Heading Font", fill=TEXT_SECONDARY, font=F_SMALL)
    cy += 20
    rr(d, [CONTENT_X, cy, CONTENT_X + controls_w, cy + 36], fill="#0a0a0a", outline=PRIMARY, radius=6)
    d.text((CONTENT_X + 12, cy + 9), "Inter (Selected)", fill=TEXT_PRIMARY, font=F_BODY)
    cy += 40

    fonts_list = ["Inter", "Poppins", "Space Grotesk", "Raleway", "Montserrat", "Playfair Display", "Lora", "JetBrains Mono"]
    rr(d, [CONTENT_X, cy, CONTENT_X + controls_w, cy + len(fonts_list) * 32 + 10], fill="#0f0f0f", outline=CARD_BORDER, radius=8)
    fy = cy + 8
    for fname in fonts_list:
        if fname == "Inter":
            rr(d, [CONTENT_X + 4, fy - 2, CONTENT_X + controls_w - 4, fy + 26], fill="#1a2e27", radius=4)
            d.text((CONTENT_X + 16, fy + 2), fname, fill=PRIMARY, font=F_BODY)
        else:
            d.text((CONTENT_X + 16, fy + 2), fname, fill=TEXT_SECONDARY, font=F_BODY)
        fy += 32
    cy = fy + 20

    # Spacing sliders
    d.text((CONTENT_X, cy), "Spacing", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 32
    spacing_items = [("Section Padding", "80px", 0.65), ("Container Max-Width", "1200px", 0.75), ("Card Gap", "24px", 0.3), ("Block Margin", "32px", 0.4), ("Grid Columns", "12", 0.5)]
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
    cy += 20

    # Block Templates section
    d.text((CONTENT_X, cy), "Block Templates", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 32
    templates = [
        ("Hero - Dark", "Full-width hero with gradient overlay", PRIMARY, "5 uses"),
        ("Pricing - 3 Tier", "Starter / Pro / Enterprise columns", INFO, "3 uses"),
        ("FAQ - Collapsible", "Accordion Q&A with smooth toggle", PURPLE, "8 uses"),
        ("CTA - Gradient", "Call to action with gradient background", PINK, "12 uses"),
    ]
    tw2 = (CONTENT_W - 30) // 2
    for ti, (tname, tdesc, tcolor, tusage) in enumerate(templates):
        col2 = ti % 2
        row2 = ti // 2
        tx2 = CONTENT_X + col2 * (tw2 + 30)
        ty2 = cy + row2 * 110
        rr(d, [tx2, ty2, tx2 + tw2, ty2 + 100], fill=CARD_BG, outline=CARD_BORDER, radius=8)
        d.rectangle([tx2, ty2, tx2 + 6, ty2 + 100], fill=tcolor)
        d.text((tx2 + 18, ty2 + 12), tname, fill=TEXT_PRIMARY, font=F_BODY_BOLD)
        d.text((tx2 + 18, ty2 + 34), tdesc, fill=TEXT_SECONDARY, font=F_SMALL)
        d.text((tx2 + 18, ty2 + 56), tusage, fill=TEXT_MUTED, font=F_TINY)
        rr(d, [tx2 + 18, ty2 + 72, tx2 + 100, ty2 + 92], fill=tcolor, radius=12)
        d.text((tx2 + 34, ty2 + 76), "Apply", fill="#0a0a0a", font=F_SMALL_BOLD)

    # Live preview panel (right)
    py2 = 130
    rr(d, [preview_x, py2, preview_x + preview_w, py2 + 1400], fill="#0e0e0e", outline=CARD_BORDER, radius=12)
    d.text((preview_x + 16, py2 + 12), "Live Preview", fill=TEXT_MUTED, font=F_SMALL_BOLD)
    d.line([preview_x + 10, py2 + 36, preview_x + preview_w - 10, py2 + 36], fill=CARD_BORDER, width=1)
    rr(d, [preview_x + 20, py2 + 50, preview_x + preview_w - 20, py2 + 220], fill="#1a2e27", radius=8)
    d.text((preview_x + 40, py2 + 80), "Your Brand", fill=PRIMARY, font=font(24, bold=True))
    d.text((preview_x + 40, py2 + 116), "Tagline goes here", fill=TEXT_SECONDARY, font=F_BODY)
    rr(d, [preview_x + 40, py2 + 150, preview_x + 180, py2 + 180], fill=PRIMARY, radius=20)
    d.text((preview_x + 60, py2 + 156), "Get Started", fill="#0a0a0a", font=F_SMALL_BOLD)

    img.save(OUT_DIR + "05-design.png", optimize=True)
    print("  05-design.png")


# ============================================================
# SCENE 6: Media Library + Data Transfer (static)
# ============================================================
def scene_06_media():
    img, d = new_image()
    draw_sidebar(d, "Media Library")
    cy = draw_topbar(d, "Media Library & Data Transfer", "Admin / Media")

    # Media grid
    d.text((CONTENT_X, cy), "Media Library", fill=TEXT_PRIMARY, font=F_HEADING)
    rr(d, [CONTENT_X + 160, cy - 2, CONTENT_X + 280, cy + 22], fill=PRIMARY, radius=12)
    d.text((CONTENT_X + 172, cy + 2), "+ Upload Media", fill="#0a0a0a", font=F_SMALL_BOLD)
    cy += 36

    media_items = [
        ("hero-banner.webp", "420 KB", "Image"), ("logo-dark.svg", "12 KB", "SVG"),
        ("team-photo.jpg", "1.2 MB", "Image"), ("product-shot.webp", "380 KB", "Image"),
        ("favicon.ico", "4 KB", "Icon"), ("promo-video.mp4", "24 MB", "Video"),
    ]
    mw = (CONTENT_W - 50) // 3
    for mi, (fname, fsize, ftype) in enumerate(media_items):
        col2 = mi % 3
        row2 = mi // 3
        mx = CONTENT_X + col2 * (mw + 25)
        my = cy + row2 * 150
        rr(d, [mx, my, mx + mw, my + 140], fill=CARD_BG, outline=CARD_BORDER, radius=10)
        rr(d, [mx + 10, my + 10, mx + mw - 10, my + 80], fill="#1a1a1a", radius=6)
        d.text((mx + mw // 2 - 20, my + 38), ftype, fill=TEXT_MUTED, font=F_SMALL)
        d.text((mx + 10, my + 92), fname, fill=TEXT_PRIMARY, font=F_SMALL)
        d.text((mx + 10, my + 110), fsize, fill=TEXT_MUTED, font=F_TINY)
    cy += 320

    # Data Transfer section
    d.text((CONTENT_X, cy), "Data Transfer", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 32
    panel_w = (CONTENT_W - 30) // 2

    # Export
    rr(d, [CONTENT_X, cy, CONTENT_X + panel_w, cy + 200], fill=CARD_BG, outline=CARD_BORDER, radius=10)
    d.text((CONTENT_X + 20, cy + 14), "Export", fill=TEXT_PRIMARY, font=F_SUBHEADING)
    d.text((CONTENT_X + 20, cy + 40), "Formats: JSON / ZIP / CSV", fill=TEXT_SECONDARY, font=F_SMALL)
    items = ["Pages (24)", "Blocks (86)", "Themes (3)", "Media (147 files, 340 MB)"]
    ey = cy + 64
    for it in items:
        rr(d, [CONTENT_X + 20, ey, CONTENT_X + 40, ey + 20], fill=PRIMARY, radius=4)
        d.text((CONTENT_X + 23, ey + 1), "v", fill="#0a0a0a", font=F_BODY_BOLD)
        d.text((CONTENT_X + 50, ey + 2), it, fill=TEXT_SECONDARY, font=F_SMALL)
        ey += 26
    rr(d, [CONTENT_X + 20, cy + 166, CONTENT_X + 140, cy + 192], fill=PRIMARY, radius=14)
    d.text((CONTENT_X + 40, cy + 172), "Export", fill="#0a0a0a", font=F_BODY_BOLD)

    # Import
    ix = CONTENT_X + panel_w + 30
    rr(d, [ix, cy, ix + panel_w, cy + 200], fill=CARD_BG, outline=CARD_BORDER, radius=10)
    d.text((ix + 20, cy + 14), "Import", fill=TEXT_PRIMARY, font=F_SUBHEADING)
    rr(d, [ix + 20, cy + 44, ix + panel_w - 20, cy + 140], fill="#0d0d0d", outline=PRIMARY_DIM, radius=10, width=2)
    d.text((ix + panel_w // 2 - 80, cy + 80), "Drag & drop .json or .zip", fill=TEXT_MUTED, font=F_SMALL)
    d.text((ix + 20, cy + 150), "Modes: Merge / Overwrite / New Site", fill=TEXT_SECONDARY, font=F_SMALL)
    rr(d, [ix + 20, cy + 166, ix + 140, cy + 192], fill=INFO, radius=14)
    d.text((ix + 42, cy + 172), "Import", fill="#ffffff", font=F_BODY_BOLD)

    img.save(OUT_DIR + "06-media.png", optimize=True)
    print("  06-media.png")


# ============================================================
# SCENE 7: Artist Content (static)
# ============================================================
def scene_07_artist():
    img, d = new_image()
    draw_sidebar(d, "Blog / Posts")
    cy = draw_topbar(d, "Artist Content — Blog, Portfolio, Events", "Admin / Artist Content")

    # Blog section
    d.text((CONTENT_X, cy), "Blog / Posts", fill=TEXT_PRIMARY, font=F_HEADING)
    rr(d, [CONTENT_X + 140, cy - 2, CONTENT_X + 240, cy + 22], fill=PRIMARY, radius=12)
    d.text((CONTENT_X + 152, cy + 2), "+ New Post", fill="#0a0a0a", font=F_SMALL_BOLD)
    cy += 36

    posts = [
        ("Migrating from WordPress to Sigil", "Published", "Mar 24", "1,240 views"),
        ("Building a Multi-Tenant CMS", "Draft", "Mar 22", "—"),
        ("Resonance Analytics Deep Dive", "Published", "Mar 18", "890 views"),
    ]
    for title, status, date, views in posts:
        rr(d, [CONTENT_X, cy, CONTENT_X + CONTENT_W, cy + 56], fill=CARD_BG, outline=CARD_BORDER, radius=10)
        d.text((CONTENT_X + 20, cy + 8), title, fill=TEXT_PRIMARY, font=F_BODY_BOLD)
        sc = SUCCESS if status == "Published" else WARNING
        pill(d, [CONTENT_X + 20 + len(title) * 9 + 12, cy + 8, CONTENT_X + 20 + len(title) * 9 + 92, cy + 26], sc, status)
        d.text((CONTENT_X + 20, cy + 32), f"{date}  |  {views}", fill=TEXT_MUTED, font=F_SMALL)
        cy += 66

    # Portfolio section
    cy += 10
    d.text((CONTENT_X, cy), "Portfolio", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 36
    pw2 = (CONTENT_W - 40) // 3
    projects = [("Cloud Migration", "Case Study"), ("Sigil CMS", "Product"), ("GhostGrid", "Infrastructure")]
    for pi, (pname, ptype) in enumerate(projects):
        px2 = CONTENT_X + pi * (pw2 + 20)
        rr(d, [px2, cy, px2 + pw2, cy + 120], fill=CARD_BG, outline=CARD_BORDER, radius=10)
        rr(d, [px2 + 10, cy + 10, px2 + pw2 - 10, cy + 60], fill="#1a1a1a", radius=6)
        d.text((px2 + 10, cy + 72), pname, fill=TEXT_PRIMARY, font=F_BODY_BOLD)
        d.text((px2 + 10, cy + 94), ptype, fill=TEXT_MUTED, font=F_SMALL)
    cy += 140

    # Events section
    d.text((CONTENT_X, cy), "Events Calendar", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 36
    events = [("Sigil Launch Webinar", "Mar 28, 2:00 PM", "Virtual"), ("DevOps Workshop", "Apr 5, 10:00 AM", "In Person")]
    for ename, etime, eloc in events:
        rr(d, [CONTENT_X, cy, CONTENT_X + CONTENT_W, cy + 50], fill=CARD_BG, outline=CARD_BORDER, radius=10)
        d.text((CONTENT_X + 20, cy + 8), ename, fill=TEXT_PRIMARY, font=F_BODY_BOLD)
        d.text((CONTENT_X + 20, cy + 28), f"{etime}  |  {eloc}", fill=TEXT_MUTED, font=F_SMALL)
        cy += 60

    img.save(OUT_DIR + "07-artist.png", optimize=True)
    print("  07-artist.png")


# ============================================================
# SCENE 8: Knowledge Base (static)
# ============================================================
def scene_08_knowledge():
    img, d = new_image()
    draw_sidebar(d, "Knowledge Base")
    cy = draw_topbar(d, "Knowledge Base", "Admin / Knowledge Base")

    rr(d, [CONTENT_X, cy, CONTENT_X + 150, cy + 36], fill=PRIMARY, radius=18)
    d.text((CONTENT_X + 14, cy + 9), "+ New Article", fill="#0a0a0a", font=F_BODY_BOLD)
    rr(d, [CONTENT_X + 180, cy, CONTENT_X + 480, cy + 36], fill="#0a0a0a", outline=CARD_BORDER, radius=18)
    d.text((CONTENT_X + 200, cy + 9), "Search articles...", fill=TEXT_MUTED, font=F_BODY)
    cy += 56

    articles = [
        {"title": "Getting Started with Sigil CMS", "cat": "Guides", "views": 4820, "helpful": 94, "featured": True, "version": "v3"},
        {"title": "Plugin Development API Reference", "cat": "API Docs", "views": 3240, "helpful": 91, "featured": True, "version": "v2"},
        {"title": "Multi-Tenant Architecture Overview", "cat": "Architecture", "views": 2680, "helpful": 88, "featured": False, "version": "v4"},
        {"title": "Stripe Integration — Store Plugin", "cat": "Plugins", "views": 1950, "helpful": 85, "featured": False, "version": "v2"},
        {"title": "Design Playground — Custom Themes", "cat": "Guides", "views": 1740, "helpful": 92, "featured": True, "version": "v1"},
        {"title": "Resonance Analytics Setup", "cat": "Plugins", "views": 1200, "helpful": 79, "featured": False, "version": "v1"},
        {"title": "Migration from WordPress", "cat": "Guides", "views": 980, "helpful": 82, "featured": False, "version": "v1"},
        {"title": "Community Forum Moderation Guide", "cat": "Guides", "views": 640, "helpful": 90, "featured": False, "version": "v1"},
    ]

    for art in articles:
        rr(d, [CONTENT_X, cy, CONTENT_X + CONTENT_W, cy + 80], fill=CARD_BG, outline=CARD_BORDER, radius=10)
        if art["featured"]:
            d.text((CONTENT_X + 14, cy + 8), "*", fill=WARNING, font=font(20, bold=True))
        d.text((CONTENT_X + 40, cy + 10), art["title"], fill=TEXT_PRIMARY, font=F_BODY_BOLD)
        pill(d, [CONTENT_X + CONTENT_W - 80, cy + 8, CONTENT_X + CONTENT_W - 40, cy + 26], CARD_BORDER, art["version"], text_color=TEXT_SECONDARY)
        pill(d, [CONTENT_X + 40, cy + 34, CONTENT_X + 40 + len(art["cat"]) * 7 + 16, cy + 50], INFO, art["cat"], text_color="#fff")
        d.text((CONTENT_X + 40, cy + 58), f"{art['views']:,} views  |  {art['helpful']}% helpful", fill=TEXT_SECONDARY, font=F_SMALL)
        cy += 88

    img.save(OUT_DIR + "08-knowledge.png", optimize=True)
    print("  08-knowledge.png")


# ============================================================
# SCENE 9: Engagement — Mailing List + Contacts (static)
# ============================================================
def scene_09_engagement():
    img, d = new_image()
    draw_sidebar(d, "Mailing List")
    cy = draw_topbar(d, "Engagement — Mailing List & Forms", "Admin / Engagement")

    # Mailing list
    d.text((CONTENT_X, cy), "Mailing List", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 36
    card_w2 = (CONTENT_W - 60) // 3
    ml_stats = [("1,247", "Subscribers"), ("68%", "Open Rate"), ("12%", "Click Rate")]
    for i, (val, lbl) in enumerate(ml_stats):
        draw_stat_card(d, CONTENT_X + i * (card_w2 + 30), cy, card_w2, lbl, val, [PRIMARY, INFO, SUCCESS][i])
    cy += 110

    # Subscriber list
    cols = ["Email", "Status", "Subscribed", "Opens"]
    widths = [400, 120, 200, 120]
    cy = draw_table_header(d, CONTENT_X, cy, cols, widths)
    subs = [
        ("sarah@datahaus.io", "Active", "Mar 10, 2026", "24"),
        ("marcus@bluestar.co", "Active", "Feb 28, 2026", "18"),
        ("info@techforge.com", "Pending", "Mar 24, 2026", "0"),
        ("priya@apex.digital", "Active", "Jan 15, 2026", "31"),
    ]
    for email, status, sub_date, opens in subs:
        sc = SUCCESS if status == "Active" else WARNING
        cy = draw_table_row(d, CONTENT_X, cy, [email, status, sub_date, opens], widths, [PRIMARY, sc, TEXT_MUTED, TEXT_SECONDARY])
    cy += 30

    # Contact Forms
    d.text((CONTENT_X, cy), "Contact Forms", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 36
    forms = [("General Inquiry", "24 submissions", "Active"), ("Consultation Request", "8 submissions", "Active"), ("Feedback", "12 submissions", "Draft")]
    for fname, fcount, fstatus in forms:
        rr(d, [CONTENT_X, cy, CONTENT_X + CONTENT_W, cy + 50], fill=CARD_BG, outline=CARD_BORDER, radius=10)
        d.text((CONTENT_X + 20, cy + 8), fname, fill=TEXT_PRIMARY, font=F_BODY_BOLD)
        sc = SUCCESS if fstatus == "Active" else WARNING
        pill(d, [CONTENT_X + CONTENT_W - 80, cy + 12, CONTENT_X + CONTENT_W - 20, cy + 30], sc, fstatus)
        d.text((CONTENT_X + 20, cy + 30), fcount, fill=TEXT_MUTED, font=F_SMALL)
        cy += 58

    img.save(OUT_DIR + "09-engagement.png", optimize=True)
    print("  09-engagement.png")


# ============================================================
# SCENE 10: Commerce — Store + Merch (scroll)
# ============================================================
def scene_10_commerce():
    h = 2000
    img, d = new_image(h)
    draw_sidebar(d, "Products (Stripe)", h)
    cy = draw_topbar(d, "Commerce Suite", "Admin / Commerce")

    # Store Products
    d.text((CONTENT_X, cy), "Store Products (Stripe)", fill=TEXT_PRIMARY, font=F_HEADING)
    rr(d, [CONTENT_X + 240, cy - 2, CONTENT_X + 360, cy + 22], fill=PRIMARY, radius=12)
    d.text((CONTENT_X + 252, cy + 2), "+ New Product", fill="#0a0a0a", font=F_SMALL_BOLD)
    cy += 36

    products = [
        ("Cloud Audit Package", "$299.00", "one-time", "Synced", 12),
        ("MSP Monthly Retainer", "$1,499.00", "monthly", "Synced", 8),
        ("DevSecOps Consultation", "$199.00", "one-time", "Synced", 24),
        ("Sigil Pro License", "$79.00", "monthly", "Synced", 156),
    ]
    cols = ["Product Name", "Price", "Billing", "Stripe Status", "Sales"]
    widths = [300, 120, 120, 140, 80]
    cy = draw_table_header(d, CONTENT_X, cy, cols, widths)
    for pname, price, billing, status, sales in products:
        status_color = SUCCESS if status == "Synced" else WARNING
        cy = draw_table_row(d, CONTENT_X, cy, [pname, price, billing, status, str(sales)], widths, [TEXT_PRIMARY, PRIMARY, TEXT_SECONDARY, status_color, TEXT_SECONDARY])
    cy += 30

    # Merch
    d.text((CONTENT_X, cy), "Merch (Printful)", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 36
    merch = [("Netrun Logo Tee", "$28.00", "T-Shirt", "In Stock"), ("Sigil Dev Hoodie", "$52.00", "Hoodie", "In Stock"), ("GhostGrid Sticker Pack", "$8.00", "Sticker", "In Stock"), ("Code Mug — Dark Mode", "$16.00", "Mug", "Low Stock")]
    card_w2 = (CONTENT_W - 30) // 2
    col2 = 0
    for mname, mprice, mtype, mstock in merch:
        mx = CONTENT_X + col2 * (card_w2 + 30)
        rr(d, [mx, cy, mx + card_w2, cy + 120], fill=CARD_BG, outline=CARD_BORDER, radius=10)
        rr(d, [mx + 12, cy + 12, mx + 100, cy + 80], fill="#222222", radius=6)
        d.text((mx + 40, cy + 40), mtype[0:3], fill=TEXT_MUTED, font=F_HEADING)
        d.text((mx + 116, cy + 16), mname, fill=TEXT_PRIMARY, font=F_BODY_BOLD)
        d.text((mx + 116, cy + 40), mprice, fill=PRIMARY, font=F_BODY)
        stock_color = SUCCESS if mstock == "In Stock" else WARNING
        pill(d, [mx + 116, cy + 62, mx + 116 + len(mstock) * 7 + 16, cy + 78], stock_color, mstock, text_color="#0a0a0a")
        d.text((mx + 116, cy + 90), "Print-on-demand via Printful", fill=TEXT_MUTED, font=F_TINY)
        col2 += 1
        if col2 >= 2:
            col2 = 0
            cy += 136
    if col2 != 0:
        cy += 136
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
    ]
    for oid, cust, prod, amt, status, date in orders:
        s_color = SUCCESS if status == "Paid" else INFO
        cy = draw_table_row(d, CONTENT_X, cy, [oid, cust, prod, amt, status, date], order_widths, [TEXT_MUTED, TEXT_PRIMARY, TEXT_SECONDARY, PRIMARY, s_color, TEXT_MUTED])

    img.save(OUT_DIR + "10-commerce.png", optimize=True)
    print("  10-commerce.png")


# ============================================================
# SCENE 11: Booking System (static)
# ============================================================
def scene_11_booking():
    img, d = new_image()
    draw_sidebar(d, "Services")
    cy = draw_topbar(d, "Booking System", "Admin / Booking")

    services = [
        ("Strategy Consultation", "60 min", "$199", "Mon-Fri 9am-5pm", 3),
        ("Infrastructure Review", "90 min", "$299", "Tue, Thu 10am-3pm", 1),
        ("DevOps Workshop", "120 min", "$499", "Wed 1pm-5pm", 2),
    ]
    for sname, sdur, sprice, savail, upcoming in services:
        rr(d, [CONTENT_X, cy, CONTENT_X + CONTENT_W, cy + 100], fill=CARD_BG, outline=CARD_BORDER, radius=10)
        d.text((CONTENT_X + 20, cy + 12), sname, fill=TEXT_PRIMARY, font=F_BODY_BOLD)
        d.text((CONTENT_X + 20, cy + 36), f"Duration: {sdur}  |  Price: {sprice}", fill=TEXT_SECONDARY, font=F_SMALL)
        d.text((CONTENT_X + 20, cy + 58), f"Availability: {savail}", fill=TEXT_MUTED, font=F_SMALL)
        d.text((CONTENT_X + 20, cy + 78), f"{upcoming} upcoming appointments", fill=PRIMARY, font=F_SMALL)
        rr(d, [CONTENT_X + CONTENT_W - 120, cy + 36, CONTENT_X + CONTENT_W - 20, cy + 62], fill=PRIMARY, radius=14)
        d.text((CONTENT_X + CONTENT_W - 100, cy + 42), "Book", fill="#0a0a0a", font=F_SMALL_BOLD)
        cy += 116

    # Upcoming appointments
    cy += 10
    d.text((CONTENT_X, cy), "Upcoming Appointments", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 36
    appts = [
        ("Strategy Consultation", "Sarah Chen", "Mar 28, 10:00 AM", "Confirmed"),
        ("Infrastructure Review", "Marcus Webb", "Mar 29, 2:00 PM", "Pending"),
        ("DevOps Workshop", "Group (8 seats)", "Apr 5, 10:00 AM", "Confirmed"),
    ]
    cols = ["Service", "Client", "Date/Time", "Status"]
    widths = [300, 200, 200, 120]
    cy = draw_table_header(d, CONTENT_X, cy, cols, widths)
    for svc, client, dt, status in appts:
        sc = SUCCESS if status == "Confirmed" else WARNING
        cy = draw_table_row(d, CONTENT_X, cy, [svc, client, dt, status], widths, [TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, sc])

    img.save(OUT_DIR + "11-booking.png", optimize=True)
    print("  11-booking.png")


# ============================================================
# SCENE 12: Community Forum (static)
# ============================================================
def scene_12_community():
    img, d = new_image()
    draw_sidebar(d, "Community Forum")
    cy = draw_topbar(d, "Community Forum", "Admin / Community")

    threads_w = CONTENT_W - 300
    lb_x = CONTENT_X + threads_w + 20
    lb_w = 280

    threads = [
        {"title": "Best practices for multi-tenant PostgreSQL RLS?", "type": "Question", "votes": 42, "replies": 18, "solved": True, "cat": "Architecture"},
        {"title": "Sigil vs Strapi — honest comparison after 6 months", "type": "Discussion", "votes": 67, "replies": 34, "solved": False, "cat": "General"},
        {"title": "Custom block type tutorial — step by step", "type": "Article", "votes": 89, "replies": 12, "solved": False, "cat": "Tutorials"},
        {"title": "Webhook retry logic not firing after 3rd attempt", "type": "Question", "votes": 8, "replies": 5, "solved": True, "cat": "Bugs"},
        {"title": "v2.1 Release Notes and Migration Guide", "type": "Announcement", "votes": 120, "replies": 45, "solved": False, "cat": "Announcements"},
        {"title": "My portfolio site built with Sigil — feedback", "type": "Discussion", "votes": 31, "replies": 22, "solved": False, "cat": "Showcase"},
    ]
    type_colors = {"Question": INFO, "Discussion": PURPLE, "Article": PRIMARY, "Announcement": WARNING}

    for thread in threads:
        th2 = 80
        rr(d, [CONTENT_X, cy, CONTENT_X + threads_w, cy + th2], fill=CARD_BG, outline=CARD_BORDER, radius=10)
        d.text((CONTENT_X + 20, cy + 10), str(thread["votes"]), fill=PRIMARY, font=font(20, bold=True))
        d.text((CONTENT_X + 20, cy + 38), "votes", fill=TEXT_MUTED, font=F_TINY)
        d.text((CONTENT_X + 80, cy + 10), thread["title"][:55], fill=TEXT_PRIMARY, font=F_BODY_BOLD)
        tc = type_colors.get(thread["type"], TEXT_MUTED)
        pill(d, [CONTENT_X + 80, cy + 34, CONTENT_X + 80 + len(thread["type"]) * 7 + 16, cy + 50], tc, thread["type"], text_color="#0a0a0a")
        cat_x2 = CONTENT_X + 80 + len(thread["type"]) * 7 + 26
        pill(d, [cat_x2, cy + 34, cat_x2 + len(thread["cat"]) * 7 + 16, cy + 50], CARD_BORDER, thread["cat"], text_color=TEXT_SECONDARY)
        if thread["solved"]:
            sx2 = cat_x2 + len(thread["cat"]) * 7 + 26
            pill(d, [sx2, cy + 34, sx2 + 52, cy + 50], SUCCESS, "Solved", text_color="#fff")
        d.text((CONTENT_X + threads_w - 100, cy + 56), f"{thread['replies']} replies", fill=TEXT_SECONDARY, font=F_SMALL)
        cy += th2 + 8

    # Leaderboard
    ly = 130
    rr(d, [lb_x, ly, lb_x + lb_w, ly + 600], fill=CARD_BG, outline=CARD_BORDER, radius=10)
    d.text((lb_x + 16, ly + 12), "Top Contributors", fill=TEXT_PRIMARY, font=F_SUBHEADING)
    d.line([lb_x + 10, ly + 40, lb_x + lb_w - 10, ly + 40], fill=CARD_BORDER, width=1)
    leaders = [("sigil_team", 5000, "Legend"), ("block_builder", 2100, "Expert"), ("devops_dan", 1240, "Contributor"), ("cms_reviewer", 890, "Member"), ("analytics_pro", 670, "Member")]
    tier_colors = {"Legend": WARNING, "Expert": PURPLE, "Contributor": PRIMARY, "Member": INFO}
    ly2 = ly + 52
    for rank, (uname, rep, tier) in enumerate(leaders, 1):
        d.text((lb_x + 16, ly2), f"#{rank}", fill=TEXT_MUTED, font=F_SMALL_BOLD)
        d.text((lb_x + 46, ly2), f"@{uname}", fill=TEXT_PRIMARY, font=F_SMALL)
        d.text((lb_x + 46, ly2 + 18), f"{rep} rep", fill=TEXT_SECONDARY, font=F_TINY)
        tc = tier_colors.get(tier, TEXT_MUTED)
        pill(d, [lb_x + lb_w - 90, ly2 + 2, lb_x + lb_w - 12, ly2 + 18], tc, tier, text_color="#0a0a0a")
        ly2 += 44

    img.save(OUT_DIR + "12-community.png", optimize=True)
    print("  12-community.png")


# ============================================================
# SCENE 13: Resonance Analytics (static)
# ============================================================
def scene_13_analytics():
    img, d = new_image()
    draw_sidebar(d, "Resonance")
    cy = draw_topbar(d, "Resonance Analytics", "Admin / Analytics")

    heat_w = CONTENT_W - 340
    ai_x = CONTENT_X + heat_w + 20
    ai_w = 320

    d.text((CONTENT_X, cy), "Block Engagement Heatmap — Homepage", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 32

    blocks_data = [
        ("Hero Block", 92, SUCCESS), ("Stats Bar", 78, "#22c55e"), ("Feature Grid", 65, WARNING),
        ("Testimonials", 45, "#f97316"), ("Pricing Table", 71, "#22c55e"), ("CTA Banner", 58, WARNING),
        ("FAQ Section", 38, ERROR), ("Footer", 22, ERROR),
    ]
    for bname, score, color in blocks_data:
        rr(d, [CONTENT_X, cy, CONTENT_X + heat_w, cy + 60], fill=CARD_BG, outline=CARD_BORDER, radius=8)
        d.ellipse([CONTENT_X + 12, cy + 14, CONTENT_X + 46, cy + 48], fill=color)
        d.text((CONTENT_X + 20, cy + 22), str(score), fill="#0a0a0a", font=F_BODY_BOLD)
        d.text((CONTENT_X + 56, cy + 12), bname, fill=TEXT_PRIMARY, font=F_BODY_BOLD)
        bar_x2 = CONTENT_X + 56
        d.line([bar_x2, cy + 42, bar_x2 + heat_w - 100, cy + 42], fill="#333333", width=4)
        d.line([bar_x2, cy + 42, bar_x2 + int((heat_w - 100) * score / 100), cy + 42], fill=color, width=4)
        cy += 66

    # A/B test
    d.text((CONTENT_X, cy), "Active A/B Test: Hero CTA", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 30
    rr(d, [CONTENT_X, cy, CONTENT_X + heat_w // 2 - 10, cy + 80], fill=CARD_BG, outline=INFO, radius=10, width=2)
    d.text((CONTENT_X + 16, cy + 10), 'Variant A: "Get Started"', fill=TEXT_PRIMARY, font=F_BODY_BOLD)
    d.text((CONTENT_X + 16, cy + 34), "CTR: 4.2%  |  485 views", fill=TEXT_SECONDARY, font=F_SMALL)
    pill(d, [CONTENT_X + 16, cy + 56, CONTENT_X + 86, cy + 72], INFO, "Control", text_color="#fff")

    rr(d, [CONTENT_X + heat_w // 2 + 10, cy, CONTENT_X + heat_w, cy + 80], fill=CARD_BG, outline=SUCCESS, radius=10, width=2)
    vb_x = CONTENT_X + heat_w // 2 + 26
    d.text((vb_x, cy + 10), 'Variant B: "Start Building"', fill=TEXT_PRIMARY, font=F_BODY_BOLD)
    d.text((vb_x, cy + 34), "CTR: 6.1%  |  492 views", fill=TEXT_SECONDARY, font=F_SMALL)
    pill(d, [vb_x, cy + 56, vb_x + 70, cy + 72], SUCCESS, "Winning", text_color="#fff")

    # AI Suggestions panel
    sy = 130
    rr(d, [ai_x, sy, ai_x + ai_w, sy + 800], fill=CARD_BG, outline=CARD_BORDER, radius=10)
    d.text((ai_x + 16, sy + 12), "AI Suggestions", fill=TEXT_PRIMARY, font=F_SUBHEADING)
    pill(d, [ai_x + 160, sy + 12, ai_x + 220, sy + 28], PRIMARY, "Gemini", text_color="#0a0a0a")
    d.line([ai_x + 10, sy + 40, ai_x + ai_w - 10, sy + 40], fill=CARD_BORDER, width=1)
    suggestions = [
        ("FAQ Section (38)", "Move FAQ above CTA Banner.", ERROR),
        ("Testimonials (45)", "Add company logos beside quotes.", WARNING),
        ("CTA Banner (58)", "Change to specific action verb.", WARNING),
    ]
    sy2 = sy + 52
    for s_block, s_text, s_color in suggestions:
        d.ellipse([ai_x + 16, sy2 + 4, ai_x + 24, sy2 + 12], fill=s_color)
        d.text((ai_x + 32, sy2), s_block, fill=TEXT_PRIMARY, font=F_SMALL_BOLD)
        d.text((ai_x + 32, sy2 + 20), s_text, fill=TEXT_SECONDARY, font=F_TINY)
        rr(d, [ai_x + 32, sy2 + 40, ai_x + 112, sy2 + 58], fill=None, outline=PRIMARY, radius=10, width=1)
        d.text((ai_x + 48, sy2 + 43), "Apply", fill=PRIMARY, font=F_TINY)
        sy2 += 72

    img.save(OUT_DIR + "13-analytics.png", optimize=True)
    print("  13-analytics.png")


# ============================================================
# SCENE 14: Netrun Platform — Broadcasting, CRM, KAMERA, Charlotte (scroll)
# ============================================================
def scene_14_platform():
    h = 2200
    img, d = new_image(h)
    draw_sidebar(d, "KOG CRM", h)
    cy = draw_topbar(d, "Netrun Platform Integrations", "Admin / Integrations")

    # KOG CRM
    d.text((CONTENT_X, cy), "KOG CRM — Lead Management", fill=TEXT_PRIMARY, font=F_HEADING)
    pill(d, [CONTENT_X + 320, cy, CONTENT_X + 400, cy + 20], PRIMARY, "Connected", text_color="#0a0a0a")
    cy += 32
    crm_cols = ["Lead Name", "Company", "Stage", "Value", "Score", "Last Contact"]
    crm_widths = [180, 180, 120, 120, 80, 180]
    cy = draw_table_header(d, CONTENT_X, cy, crm_cols, crm_widths)
    leads = [
        ("Sarah Chen", "DataHaus Inc", "Proposal", "$48,000", "92", "Mar 24, 2026"),
        ("Marcus Webb", "BlueStar LLC", "Discovery", "$24,000", "78", "Mar 23, 2026"),
        ("James Park", "CloudNine Co", "Negotiation", "$72,000", "95", "Mar 21, 2026"),
        ("Priya Sharma", "Apex Digital", "Closed Won", "$18,000", "99", "Mar 20, 2026"),
    ]
    for name, company, stage, value, score, contact in leads:
        stage_colors = {"Proposal": INFO, "Discovery": WARNING, "Negotiation": PRIMARY, "Closed Won": SUCCESS}
        sc = stage_colors.get(stage, TEXT_MUTED)
        cy = draw_table_row(d, CONTENT_X, cy, [name, company, stage, value, score, contact], crm_widths, [TEXT_PRIMARY, TEXT_SECONDARY, sc, PRIMARY, SUCCESS, TEXT_MUTED])
    cy += 30

    # Intirkast Broadcasting
    d.text((CONTENT_X, cy), "Intirkast — Broadcasting", fill=TEXT_PRIMARY, font=F_HEADING)
    pill(d, [CONTENT_X + 260, cy, CONTENT_X + 340, cy + 20], PRIMARY, "Connected", text_color="#0a0a0a")
    cy += 32
    broadcasts = [
        ("Sigil Launch Keynote", "Scheduled", "Mar 28, 2:00 PM", "YouTube + Twitch"),
        ("Weekly Dev Update #14", "LIVE", "Now", "YouTube"),
        ("Q1 Product Demo", "Completed", "Mar 15, 3:00 PM", "YouTube + LinkedIn"),
    ]
    for bname, bstatus, btime, bplatforms in broadcasts:
        rr(d, [CONTENT_X, cy, CONTENT_X + CONTENT_W, cy + 70], fill=CARD_BG, outline=CARD_BORDER, radius=10)
        d.text((CONTENT_X + 20, cy + 12), bname, fill=TEXT_PRIMARY, font=F_BODY_BOLD)
        if bstatus == "LIVE":
            pill(d, [CONTENT_X + 20, cy + 38, CONTENT_X + 70, cy + 54], ERROR, "LIVE", text_color="#fff")
        elif bstatus == "Scheduled":
            pill(d, [CONTENT_X + 20, cy + 38, CONTENT_X + 100, cy + 54], WARNING, bstatus, text_color="#0a0a0a")
        else:
            pill(d, [CONTENT_X + 20, cy + 38, CONTENT_X + 110, cy + 54], TEXT_MUTED, bstatus, text_color="#fff")
        d.text((CONTENT_X + 130, cy + 40), btime, fill=TEXT_SECONDARY, font=F_SMALL)
        d.text((CONTENT_X + 320, cy + 40), bplatforms, fill=TEXT_MUTED, font=F_SMALL)
        cy += 82
    cy += 20

    # KAMERA
    d.text((CONTENT_X, cy), "KAMERA — 3D Site Scanning", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 32
    scans = [
        ("Office Building A — Floor 2", "Completed", "2.4M points", "View 3D"),
        ("Warehouse Expansion Zone", "Processing", "1.8M points", "Processing..."),
        ("Server Room Layout", "Completed", "890K points", "View 3D"),
    ]
    for sname, sstatus, spoints, saction in scans:
        rr(d, [CONTENT_X, cy, CONTENT_X + CONTENT_W, cy + 60], fill=CARD_BG, outline=CARD_BORDER, radius=10)
        d.text((CONTENT_X + 20, cy + 10), sname, fill=TEXT_PRIMARY, font=F_BODY_BOLD)
        s_color = SUCCESS if sstatus == "Completed" else WARNING
        pill(d, [CONTENT_X + 20, cy + 34, CONTENT_X + 20 + len(sstatus) * 7 + 16, cy + 50], s_color, sstatus, text_color="#0a0a0a")
        d.text((CONTENT_X + 180, cy + 36), spoints, fill=TEXT_SECONDARY, font=F_SMALL)
        action_color = PRIMARY if "View" in saction else TEXT_MUTED
        d.text((CONTENT_X + CONTENT_W - 100, cy + 24), saction, fill=action_color, font=F_SMALL)
        cy += 70
    cy += 20

    # Charlotte AI
    d.text((CONTENT_X, cy), "Charlotte AI — Assistant Widget", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 32
    rr(d, [CONTENT_X, cy, CONTENT_X + 500, cy + 300], fill=CARD_BG, outline=CARD_BORDER, radius=12)
    d.text((CONTENT_X + 16, cy + 12), "Charlotte AI — Preview", fill=TEXT_PRIMARY, font=F_SUBHEADING)
    d.line([CONTENT_X + 10, cy + 40, CONTENT_X + 490, cy + 40], fill=CARD_BORDER, width=1)
    chat = [
        ("user", "How do I add a Stripe product?"),
        ("bot", "Navigate to Commerce > Products, click New Product. Sigil auto-creates the Stripe objects."),
        ("user", "Does it handle webhooks?"),
        ("bot", "Yes. The Store plugin registers for checkout.session.completed events automatically."),
    ]
    chat_y = cy + 52
    for role, msg in chat:
        if role == "user":
            rr(d, [CONTENT_X + 200, chat_y, CONTENT_X + 480, chat_y + 36], fill="#1a2e27", radius=12)
            d.text((CONTENT_X + 216, chat_y + 10), msg[:36], fill=PRIMARY, font=F_SMALL)
            chat_y += 48
        else:
            rr(d, [CONTENT_X + 16, chat_y, CONTENT_X + 400, chat_y + 50], fill="#1a1a1a", outline=CARD_BORDER, radius=12)
            d.text((CONTENT_X + 24, chat_y + 8), msg[:55], fill=TEXT_SECONDARY, font=F_SMALL)
            if len(msg) > 55:
                d.text((CONTENT_X + 24, chat_y + 26), msg[55:], fill=TEXT_SECONDARY, font=F_SMALL)
            chat_y += 62

    img.save(OUT_DIR + "14-platform.png", optimize=True)
    print("  14-platform.png")


# ============================================================
# SCENE 15: Migration Tool (static)
# ============================================================
def scene_15_migrate():
    img, d = new_image()
    draw_sidebar(d, "Migration Tool")
    cy = draw_topbar(d, "Migration Tool", "Admin / Migration")

    sources = [
        ("WordPress", "Import posts, pages, media from WXR XML.", INFO, True),
        ("Shopify", "Import products, collections from CSV.", SUCCESS, True),
        ("Square", "Import catalog from Square POS API.", WARNING, False),
    ]
    card_w2 = (CONTENT_W - 40) // 3
    sx2 = CONTENT_X
    for sname, sdesc, scolor, available in sources:
        rr(d, [sx2, cy, sx2 + card_w2, cy + 160], fill=CARD_BG, outline=scolor if available else CARD_BORDER, radius=10, width=2 if available else 1)
        d.ellipse([sx2 + 20, cy + 20, sx2 + 56, cy + 56], fill=scolor)
        d.text((sx2 + 30, cy + 28), sname[0], fill="#0a0a0a", font=F_HEADING)
        d.text((sx2 + 20, cy + 68), sname, fill=TEXT_PRIMARY, font=F_HEADING)
        d.text((sx2 + 20, cy + 96), sdesc, fill=TEXT_SECONDARY, font=F_SMALL)
        if not available:
            d.text((sx2 + 20, cy + 130), "Coming soon", fill=TEXT_MUTED, font=F_TINY)
        sx2 += card_w2 + 20
    cy += 190

    # Migration history
    d.text((CONTENT_X, cy), "Migration History", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 32
    cols = ["Source", "Target Site", "Content", "Status", "Duration"]
    widths = [120, 200, 280, 100, 100]
    cy = draw_table_header(d, CONTENT_X, cy, cols, widths)
    migrations = [
        ("WordPress", "netrunsystems.com", "47 posts, 12 pages, 89 media", "Complete", "3m 42s"),
        ("Shopify", "KOG Landing", "24 products, 6 collections", "Complete", "1m 55s"),
        ("WordPress", "Client Demo", "8 pages, 12 media", "In Progress", "---"),
    ]
    for src, target, content, status, dur in migrations:
        s_color = SUCCESS if status == "Complete" else WARNING
        cy = draw_table_row(d, CONTENT_X, cy, [src, target, content, status, dur], widths, [INFO, TEXT_PRIMARY, TEXT_SECONDARY, s_color, TEXT_MUTED])

    # Progress bar
    cy += 20
    rr(d, [CONTENT_X, cy, CONTENT_X + CONTENT_W, cy + 70], fill=CARD_BG, outline=WARNING, radius=10, width=2)
    d.text((CONTENT_X + 20, cy + 12), "Active: WordPress -> Client Demo", fill=TEXT_PRIMARY, font=F_BODY_BOLD)
    d.text((CONTENT_X + 20, cy + 36), "Step 3/5: Downloading media assets...", fill=TEXT_SECONDARY, font=F_SMALL)
    bar_w = CONTENT_W - 40
    d.line([CONTENT_X + 20, cy + 58, CONTENT_X + 20 + bar_w, cy + 58], fill="#333333", width=6)
    d.line([CONTENT_X + 20, cy + 58, CONTENT_X + 20 + int(bar_w * 0.6), cy + 58], fill=WARNING, width=6)

    img.save(OUT_DIR + "15-migrate.png", optimize=True)
    print("  15-migrate.png")


# ============================================================
# SCENE 16: Webhooks & Events (static)
# ============================================================
def scene_16_webhooks():
    img, d = new_image()
    draw_sidebar(d, "Webhooks")
    cy = draw_topbar(d, "Webhooks & Events", "Admin / Webhooks")

    rr(d, [CONTENT_X, cy, CONTENT_X + 180, cy + 36], fill=PRIMARY, radius=18)
    d.text((CONTENT_X + 14, cy + 9), "+ New Endpoint", fill="#0a0a0a", font=F_BODY_BOLD)
    cy += 54

    endpoints = [
        {"url": "https://hooks.slack.com/services/T.../B.../xxx", "events": ["page.published", "page.updated"], "status": "Active", "success_rate": "99.2%", "last_fire": "2 min ago"},
        {"url": "https://api.zapier.com/hooks/catch/123456/abc", "events": ["order.completed", "booking.confirmed"], "status": "Active", "success_rate": "97.8%", "last_fire": "45 min ago"},
        {"url": "https://n8n.internal.example.com/webhook/cms", "events": ["media.uploaded", "form.submitted"], "status": "Active", "success_rate": "100%", "last_fire": "3 hr ago"},
    ]
    for ep in endpoints:
        rr(d, [CONTENT_X, cy, CONTENT_X + CONTENT_W, cy + 90], fill=CARD_BG, outline=CARD_BORDER, radius=10)
        d.text((CONTENT_X + 20, cy + 12), ep["url"][:60], fill=TEXT_PRIMARY, font=F_BODY)
        sc = SUCCESS if ep["status"] == "Active" else WARNING
        pill(d, [CONTENT_X + CONTENT_W - 80, cy + 10, CONTENT_X + CONTENT_W - 16, cy + 28], sc, ep["status"], text_color="#0a0a0a")
        ex = CONTENT_X + 20
        for event in ep["events"]:
            ew = len(event) * 7 + 14
            rr(d, [ex, cy + 40, ex + ew, cy + 56], fill="#1a2e27", radius=10)
            d.text((ex + 7, cy + 43), event, fill=PRIMARY, font=F_TINY)
            ex += ew + 6
        d.text((CONTENT_X + 20, cy + 66), f"Success: {ep['success_rate']}  |  Last: {ep['last_fire']}  |  HMAC-SHA256", fill=TEXT_MUTED, font=F_SMALL)
        cy += 100

    # Delivery log
    cy += 10
    d.text((CONTENT_X, cy), "Recent Delivery Log", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 32
    log_cols = ["Event", "Endpoint", "Status", "Duration", "Time"]
    log_widths = [200, 300, 80, 80, 160]
    cy = draw_table_header(d, CONTENT_X, cy, log_cols, log_widths)
    deliveries = [
        ("page.published", "hooks.slack.com/...", "200", "120ms", "2 min ago"),
        ("order.completed", "api.zapier.com/...", "200", "340ms", "45 min ago"),
        ("media.uploaded", "n8n.internal.../...", "200", "89ms", "3 hr ago"),
    ]
    for event, endpoint, status, dur, t in deliveries:
        s_color = SUCCESS if status == "200" else ERROR
        cy = draw_table_row(d, CONTENT_X, cy, [event, endpoint, status, dur, t], log_widths, [PRIMARY, TEXT_SECONDARY, s_color, TEXT_MUTED, TEXT_MUTED])

    img.save(OUT_DIR + "16-webhooks.png", optimize=True)
    print("  16-webhooks.png")


# ============================================================
# SCENE 17: Support Panel (static)
# ============================================================
def scene_17_support():
    img, d = new_image()
    draw_sidebar(d, "Support Panel")
    cy = draw_topbar(d, "Support Panel — Ticketing", "Admin / Support")

    tickets = [
        ("#TKT-342", "Cannot configure custom domain", "High", "Open", "2 hr ago"),
        ("#TKT-341", "Stripe webhook returning 500", "Critical", "In Progress", "4 hr ago"),
        ("#TKT-340", "Font upload not rendering in preview", "Medium", "Resolved", "1 day ago"),
        ("#TKT-339", "Community forum magic link expired", "Low", "Closed", "2 days ago"),
        ("#TKT-338", "Bulk provisioning timeout on 10+ sites", "Medium", "Open", "3 days ago"),
    ]
    t_cols = ["Ticket", "Subject", "Priority", "Status", "Age"]
    t_widths = [100, 380, 100, 120, 120]
    cy = draw_table_header(d, CONTENT_X, cy, t_cols, t_widths)
    for tid, subj, pri, status, age in tickets:
        pri_colors = {"Critical": ERROR, "High": WARNING, "Medium": INFO, "Low": TEXT_MUTED}
        stat_colors = {"Open": WARNING, "In Progress": INFO, "Resolved": SUCCESS, "Closed": TEXT_MUTED}
        cy = draw_table_row(d, CONTENT_X, cy, [tid, subj, pri, status, age], t_widths, [TEXT_MUTED, TEXT_PRIMARY, pri_colors.get(pri, TEXT_MUTED), stat_colors.get(status, TEXT_MUTED), TEXT_MUTED])

    cy += 30
    # SLA metrics
    d.text((CONTENT_X, cy), "SLA Metrics", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 36
    sla_w = (CONTENT_W - 60) // 3
    sla_items = [("4.2 hrs", "Avg Response Time", SUCCESS), ("92%", "SLA Compliance", PRIMARY), ("87%", "First Contact Resolution", INFO)]
    for i, (val, lbl, color) in enumerate(sla_items):
        draw_stat_card(d, CONTENT_X + i * (sla_w + 30), cy, sla_w, lbl, val, color)

    img.save(OUT_DIR + "17-support.png", optimize=True)
    print("  17-support.png")


# ============================================================
# SCENE 18: Security — 2FA + Audit Log (scroll)
# ============================================================
def scene_18_security():
    h = 2000
    img, d = new_image(h)
    draw_sidebar(d, "Settings", h)
    cy = draw_topbar(d, "Security — 2FA & Audit Log", "Admin / Security")

    # 2FA Setup
    d.text((CONTENT_X, cy), "Two-Factor Authentication", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 32
    tfa_h = 380
    rr(d, [CONTENT_X, cy, CONTENT_X + CONTENT_W, cy + tfa_h], fill=CARD_BG, outline=CARD_BORDER, radius=10)

    # QR code placeholder
    qr_x = CONTENT_X + 40
    qr_y = cy + 30
    qr_size = 180
    rr(d, [qr_x, qr_y, qr_x + qr_size, qr_y + qr_size], fill="#ffffff", radius=4)
    random.seed(42)
    cell = 8
    margin = 10
    for row in range(20):
        for col2 in range(20):
            if random.random() > 0.5:
                cx2 = qr_x + margin + col2 * cell
                cy2 = qr_y + margin + row * cell
                d.rectangle([cx2, cy2, cx2 + cell - 1, cy2 + cell - 1], fill="#0a0a0a")
    d.text((qr_x + 20, qr_y + qr_size + 12), "Scan with authenticator app", fill=TEXT_SECONDARY, font=F_SMALL)

    # Right side: instructions
    info_x = qr_x + qr_size + 60
    info_y = cy + 30
    d.text((info_x, info_y), "Setup Instructions", fill=TEXT_PRIMARY, font=F_SUBHEADING)
    info_y += 28
    for step in ["1. Install Google Authenticator or Authy", "2. Scan the QR code", "3. Enter the 6-digit code to verify", "4. Store backup codes safely"]:
        d.text((info_x, info_y), step, fill=TEXT_SECONDARY, font=F_BODY)
        info_y += 24
    info_y += 12
    rr(d, [info_x, info_y, info_x + 240, info_y + 40], fill="#0a0a0a", outline=CARD_BORDER, radius=8)
    d.text((info_x + 12, info_y + 10), "_ _ _ _ _ _", fill=TEXT_MUTED, font=F_HEADING)
    info_y += 56
    rr(d, [info_x, info_y, info_x + 160, info_y + 42], fill=PRIMARY, radius=20)
    d.text((info_x + 24, info_y + 11), "Enable 2FA", fill="#0a0a0a", font=F_BODY_BOLD)

    # Backup codes
    bc_y = cy + 260
    d.text((CONTENT_X + 40, bc_y), "Backup Recovery Codes", fill=TEXT_PRIMARY, font=F_SUBHEADING)
    bc_y += 28
    codes = ["a7f2-k9m3-p4x1", "b8d6-n2w5-q7y9", "c3e1-j6t8-r5v4", "d9g4-l1s7-u2z6", "e5h8-m3q2-w9a7", "f1k6-p5x4-y3b8", "g7n2-r8d1-z6c5", "h4t9-s2f3-e1j7"]
    for i, code in enumerate(codes):
        cx2 = CONTENT_X + 50 + (i % 4) * 220
        cy3 = bc_y + (i // 4) * 30
        rr(d, [cx2, cy3, cx2 + 200, cy3 + 24], fill="#0a0a0a", outline=CARD_BORDER, radius=4)
        d.text((cx2 + 10, cy3 + 5), code, fill=TEXT_PRIMARY, font=font(13))

    cy = cy + tfa_h + 40

    # Audit Log
    d.text((CONTENT_X, cy), "Audit Log", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 32
    filters = ["All Actions", "Auth", "Pages", "Themes", "Users", "Media"]
    fx = CONTENT_X
    for f_label in filters:
        fw = len(f_label) * 8 + 24
        active_f = f_label == "All Actions"
        rr(d, [fx, cy, fx + fw, cy + 28], fill=PRIMARY if active_f else None, outline=CARD_BORDER if not active_f else None, radius=14)
        d.text((fx + 12, cy + 6), f_label, fill="#0a0a0a" if active_f else TEXT_SECONDARY, font=F_SMALL_BOLD)
        fx += fw + 8
    cy += 44

    cols = ["Timestamp", "User", "Action", "Resource", "IP Address"]
    widths = [220, 200, 200, 340, 200]
    cy = draw_table_header(d, CONTENT_X, cy, cols, widths)

    audit_rows = [
        ("2026-03-26 14:32:01", "daniel@netrun.net", "page.updated", "/sites/netrun/pages/about", "72.134.89.12"),
        ("2026-03-26 14:28:44", "daniel@netrun.net", "theme.saved", "/sites/netrun/themes/dark-v2", "72.134.89.12"),
        ("2026-03-26 14:15:22", "admin@agency.co", "user.login", "admin@agency.co (2FA)", "98.210.45.67"),
        ("2026-03-26 13:58:10", "daniel@netrun.net", "media.uploaded", "hero-banner-2026.webp", "72.134.89.12"),
        ("2026-03-26 13:45:33", "editor@agency.co", "page.created", "/sites/client-a/pages/services", "98.210.45.67"),
        ("2026-03-26 13:30:01", "system", "backup.completed", "Full backup: 1.2GB compressed", "127.0.0.1"),
        ("2026-03-26 12:55:18", "daniel@netrun.net", "plugin.activated", "resonance-analytics", "72.134.89.12"),
        ("2026-03-26 12:40:44", "admin@agency.co", "user.invited", "editor@agency.co (role: Editor)", "98.210.45.67"),
        ("2026-03-26 12:22:09", "system", "ssl.renewed", "frost.sigil.netrunsystems.com", "127.0.0.1"),
        ("2026-03-26 11:58:33", "daniel@netrun.net", "block.deleted", "old-hero (Hero block)", "72.134.89.12"),
        ("2026-03-26 11:45:01", "editor@agency.co", "page.published", "/sites/client-a/pages/home", "98.210.45.67"),
        ("2026-03-26 11:30:22", "system", "cron.cleanup", "Deleted 14 expired sessions", "127.0.0.1"),
    ]
    action_colors = {
        "page.updated": INFO, "theme.saved": PURPLE, "user.login": SUCCESS,
        "media.uploaded": WARNING, "page.created": PRIMARY, "backup.completed": SUCCESS,
        "plugin.activated": PRIMARY, "user.invited": INFO, "ssl.renewed": SUCCESS,
        "block.deleted": ERROR, "page.published": SUCCESS, "cron.cleanup": TEXT_MUTED,
    }
    for row in audit_rows:
        ts, user, action, resource, ip = row
        ac = action_colors.get(action, TEXT_SECONDARY)
        cy = draw_table_row(d, CONTENT_X, cy, [ts, user, action, resource, ip], widths, [TEXT_MUTED, TEXT_SECONDARY, ac, TEXT_SECONDARY, TEXT_MUTED])

    img.save(OUT_DIR + "18-security.png", optimize=True)
    print("  18-security.png")


# ============================================================
# SCENE 19: Billing & Plans (static)
# ============================================================
def scene_19_billing():
    img, d = new_image()
    draw_sidebar(d, "Billing")
    cy = draw_topbar(d, "Billing & Subscription", "Admin / Billing")

    rr(d, [CONTENT_X, cy, CONTENT_X + CONTENT_W, cy + 100], fill="#1a2e27", outline=PRIMARY, radius=12, width=2)
    d.text((CONTENT_X + 20, cy + 14), "Current Plan: Pro", fill=PRIMARY, font=F_HEADING)
    d.text((CONTENT_X + 20, cy + 42), "$49/month  |  Billed monthly  |  Next billing: Apr 1, 2026", fill=TEXT_SECONDARY, font=F_BODY)
    d.text((CONTENT_X + 20, cy + 68), "Stripe Customer ID: cus_Px1234567890", fill=TEXT_MUTED, font=F_SMALL)
    rr(d, [CONTENT_X + CONTENT_W - 160, cy + 36, CONTENT_X + CONTENT_W - 20, cy + 62], fill=PRIMARY, radius=14)
    d.text((CONTENT_X + CONTENT_W - 140, cy + 42), "Manage Plan", fill="#0a0a0a", font=F_SMALL_BOLD)
    cy += 120

    # Usage meters
    d.text((CONTENT_X, cy), "Usage This Period", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 32
    meters = [("Sites", 4, 10, PRIMARY), ("Pages", 67, 200, INFO), ("Storage", 1.2, 10, WARNING), ("API Calls", 12400, 50000, SUCCESS)]
    meter_w = (CONTENT_W - 60) // 4
    mx = CONTENT_X
    for m_label, m_used, m_max, m_color in meters:
        rr(d, [mx, cy, mx + meter_w, cy + 90], fill=CARD_BG, outline=CARD_BORDER, radius=10)
        d.text((mx + 16, cy + 12), m_label, fill=TEXT_SECONDARY, font=F_SMALL_BOLD)
        ratio = m_used / m_max
        if isinstance(m_used, float):
            d.text((mx + 16, cy + 32), f"{m_used} GB / {m_max} GB", fill=TEXT_PRIMARY, font=F_BODY_BOLD)
        elif m_max >= 10000:
            d.text((mx + 16, cy + 32), f"{m_used:,} / {m_max:,}", fill=TEXT_PRIMARY, font=F_BODY_BOLD)
        else:
            d.text((mx + 16, cy + 32), f"{m_used} / {m_max}", fill=TEXT_PRIMARY, font=F_BODY_BOLD)
        d.line([mx + 16, cy + 66, mx + meter_w - 16, cy + 66], fill="#333333", width=6)
        fill_w = int((meter_w - 32) * min(ratio, 1.0))
        d.line([mx + 16, cy + 66, mx + 16 + fill_w, cy + 66], fill=m_color, width=6)
        mx += meter_w + 20
    cy += 110

    # Plan comparison
    d.text((CONTENT_X, cy), "Available Plans", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 32
    plans = [
        ("Free", "$0", ["1 site", "10 pages", "1 GB", "12 plugins"]),
        ("Starter", "$12", ["3 sites", "50 pages", "5 GB", "All plugins"]),
        ("Pro", "$49", ["10 sites", "200 pages", "10 GB", "Analytics"]),
        ("Enterprise", "Custom", ["Unlimited", "SLA 99.9%", "SSO", "Custom"]),
    ]
    plan_w = (CONTENT_W - 60) // 4
    px = CONTENT_X
    for pname, pprice, features in plans:
        is_current = pname == "Pro"
        rr(d, [px, cy, px + plan_w, cy + 300], fill=CARD_BG, outline=PRIMARY if is_current else CARD_BORDER, radius=12, width=2 if is_current else 1)
        if is_current:
            pill(d, [px + plan_w - 70, cy + 8, px + plan_w - 8, cy + 24], PRIMARY, "Current", text_color="#0a0a0a")
        d.text((px + 16, cy + 16), pname, fill=TEXT_PRIMARY, font=F_PRICE_TIER)
        d.text((px + 16, cy + 48), pprice, fill=PRIMARY, font=F_PRICE)
        d.line([px + 10, cy + 100, px + plan_w - 10, cy + 100], fill=CARD_BORDER, width=1)
        fy = cy + 114
        for feat in features:
            d.text((px + 16, fy), feat, fill=TEXT_SECONDARY, font=F_SMALL)
            fy += 24
        px += plan_w + 20

    img.save(OUT_DIR + "19-billing.png", optimize=True)
    print("  19-billing.png")


# ============================================================
# SCENE 20: Plugin Marketplace (scroll)
# ============================================================
def scene_20_marketplace():
    h = 2200
    img, d = new_image(h)
    draw_sidebar(d, "Marketplace", h)
    cy = draw_topbar(d, "Plugin Marketplace", "Admin / Marketplace")

    cats = ["All (22)", "Content", "Commerce", "Analytics", "Engagement", "Netrun", "System"]
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
        ("Blog / Posts", "Content", True), ("Portfolio", "Content", True), ("Events Calendar", "Content", True),
        ("Mailing List", "Content", True), ("Contact Forms", "Content", True), ("SEO Manager", "Content", True),
        ("Store (Stripe)", "Commerce", True), ("Merch (Printful)", "Commerce", True), ("PayPal", "Commerce", False),
        ("Booking", "Commerce", True), ("Community Forum", "Engagement", True), ("Knowledge Base", "Engagement", True),
        ("Resonance Analytics", "Analytics", True), ("Intirkast", "Netrun", True), ("KOG CRM", "Netrun", True),
        ("KAMERA", "Netrun", True), ("Charlotte AI", "Netrun", True), ("Support Panel", "Netrun", True),
        ("Migration Tool", "System", True), ("Webhooks", "System", True), ("Marketplace", "System", True),
        ("Billing", "System", True),
    ]
    cat_colors = {"Content": INFO, "Commerce": SUCCESS, "Analytics": WARNING, "Engagement": PURPLE, "Netrun": PRIMARY, "System": TEXT_MUTED}
    col_w = (CONTENT_W - 40) // 3
    col2 = 0
    row_y = cy
    for pname, pcat, active in plugins:
        px = CONTENT_X + col2 * (col_w + 20)
        card_h = 120
        rr(d, [px, row_y, px + col_w, row_y + card_h], fill=CARD_BG, outline=PRIMARY if active else CARD_BORDER, radius=10, width=2 if active else 1)
        ic = cat_colors.get(pcat, TEXT_MUTED)
        d.ellipse([px + 16, row_y + 16, px + 40, row_y + 40], fill=ic)
        d.text((px + 50, row_y + 16), pname[:22], fill=TEXT_PRIMARY, font=F_BODY_BOLD)
        pill(d, [px + 50, row_y + 38, px + 50 + len(pcat) * 7 + 16, row_y + 54], ic, pcat, text_color="#0a0a0a")
        if active:
            pill(d, [px + col_w - 64, row_y + 12, px + col_w - 12, row_y + 28], SUCCESS, "Active", text_color="#fff")
        rr(d, [px + 16, row_y + 86, px + col_w - 16, row_y + 108], fill=None, outline=PRIMARY if active else CARD_BORDER, radius=12, width=1)
        btn_text = "Configure" if active else "Activate"
        d.text((px + col_w // 2 - 30, row_y + 90), btn_text, fill=PRIMARY if active else TEXT_MUTED, font=F_SMALL)
        col2 += 1
        if col2 >= 3:
            col2 = 0
            row_y += card_h + 16

    img.save(OUT_DIR + "20-marketplace.png", optimize=True)
    print("  20-marketplace.png")


# ============================================================
# SCENE 21: POS System (static)
# ============================================================
def scene_21_pos():
    img, d = new_image()
    draw_sidebar(d, "Products (Stripe)")
    cy = draw_topbar(d, "Point of Sale", "Admin / Store / POS")

    grid_w = 860
    cart_w = CONTENT_W - grid_w - 20
    grid_x = CONTENT_X
    cart_x = grid_x + grid_w + 20

    categories = ["All Items", "Merch", "Digital", "Services", "Events"]
    tx = grid_x
    for cat in categories:
        cw = len(cat) * 8 + 24
        active = cat == "All Items"
        rr(d, [tx, cy, tx + cw, cy + 28], fill=PRIMARY if active else None, outline=CARD_BORDER if not active else None, radius=14)
        d.text((tx + 12, cy + 6), cat, fill="#0a0a0a" if active else TEXT_SECONDARY, font=F_SMALL_BOLD)
        tx += cw + 8
    cy += 44

    products = [
        ("Netrun Tee", "$34.99", "merch", True), ("Logo Hoodie", "$59.99", "merch", True),
        ("Dev Stickers", "$9.99", "merch", True), ("Pro License", "$149.00", "digital", True),
        ("Starter License", "$49.00", "digital", True), ("API Access Key", "$29.00/mo", "digital", True),
        ("1hr Consult", "$175.00", "service", True), ("Site Audit", "$350.00", "service", True),
        ("Workshop Pass", "$75.00", "event", True), ("Sigil Mug", "$19.99", "merch", True),
        ("Brand Kit", "$24.99", "digital", False), ("Deploy Help", "$125.00", "service", True),
    ]
    cat_colors = {"merch": PINK, "digital": INFO, "service": PURPLE, "event": WARNING}
    cols2 = 3
    card_w2 = (grid_w - 20) // cols2
    card_h = 110
    for i, (pname, price, cat, in_stock) in enumerate(products):
        col2 = i % cols2
        row2 = i // cols2
        px = grid_x + col2 * (card_w2 + 10)
        py = cy + row2 * (card_h + 10)
        rr(d, [px, py, px + card_w2, py + card_h], fill=CARD_BG, outline=CARD_BORDER, radius=10)
        d.ellipse([px + 14, py + 12, px + 24, py + 22], fill=cat_colors[cat])
        d.text((px + 14, py + 30), pname, fill=TEXT_PRIMARY, font=F_BODY_BOLD)
        d.text((px + 14, py + 52), price, fill=PRIMARY, font=F_BODY)
        if not in_stock:
            pill(d, [px + card_w2 - 60, py + 80, px + card_w2 - 14, py + 98], ERROR, "Out", text_color="#fff")

    # Cart panel
    rr(d, [cart_x, cy - 44, cart_x + cart_w, H_STD - 30], fill=CARD_BG, outline=CARD_BORDER, radius=10)
    ox = cart_x + 16
    oy = cy - 28
    d.text((ox, oy), "Current Order", fill=TEXT_PRIMARY, font=F_HEADING)
    d.text((ox + 170, oy + 2), "#POS-0047", fill=TEXT_MUTED, font=F_SMALL)
    oy += 30
    d.line([ox, oy, cart_x + cart_w - 16, oy], fill=CARD_BORDER, width=1)
    oy += 12

    cart_items = [("Netrun Tee (L)", 1, "$34.99"), ("Pro License", 1, "$149.00"), ("1hr Consult", 2, "$350.00")]
    for cname, qty, cprice in cart_items:
        d.text((ox, oy), f"{cname} x{qty}", fill=TEXT_PRIMARY, font=F_BODY)
        d.text((ox + cart_w - 100, oy), cprice, fill=PRIMARY, font=F_BODY)
        oy += 28

    oy += 10
    d.line([ox, oy, cart_x + cart_w - 16, oy], fill=CARD_BORDER, width=1)
    oy += 12
    d.text((ox, oy), "Subtotal", fill=TEXT_SECONDARY, font=F_BODY)
    d.text((ox + cart_w - 100, oy), "$533.99", fill=TEXT_PRIMARY, font=F_BODY)
    oy += 24
    d.text((ox, oy), "Tax (9.5%)", fill=TEXT_SECONDARY, font=F_BODY)
    d.text((ox + cart_w - 100, oy), "$50.73", fill=TEXT_PRIMARY, font=F_BODY)
    oy += 28
    d.text((ox, oy), "TOTAL", fill=TEXT_PRIMARY, font=F_HEADING)
    d.text((ox + cart_w - 100, oy), "$584.72", fill=PRIMARY, font=F_HEADING)

    oy += 50
    for btn_label, btn_color in [("Card", PRIMARY), ("Cash", SUCCESS), ("Split", INFO)]:
        bw = (cart_w - 48) // 3
        bx = ox + [0, bw + 6, 2 * (bw + 6)][["Card", "Cash", "Split"].index(btn_label)]
        rr(d, [bx, oy, bx + bw, oy + 40], fill=btn_color, radius=12)
        d.text((bx + bw // 2 - 16, oy + 10), btn_label, fill="#0a0a0a", font=F_BODY_BOLD)

    img.save(OUT_DIR + "21-pos.png", optimize=True)
    print("  21-pos.png")


# ============================================================
# MAIN: Generate all screenshots
# ============================================================
def generate_all():
    print("Generating Sigil CMS Feature Tour v4 — 21 screenshots\n")
    scene_01_landing()
    scene_02_dashboard()
    scene_03_sites()
    scene_04_editor()
    scene_05_design()
    scene_06_media()
    scene_07_artist()
    scene_08_knowledge()
    scene_09_engagement()
    scene_10_commerce()
    scene_11_booking()
    scene_12_community()
    scene_13_analytics()
    scene_14_platform()
    scene_15_migrate()
    scene_16_webhooks()
    scene_17_support()
    scene_18_security()
    scene_19_billing()
    scene_20_marketplace()
    scene_21_pos()
    print(f"\nAll 21 screenshots saved to {OUT_DIR}")


# ============================================================
# RENDER VIDEO
# ============================================================
GOOGLE_TTS_URL = "https://texttospeech.googleapis.com/v1/text:synthesize"
VOICES = {
    "HOST": {"name": "en-US-Studio-Q", "gender": "MALE"},
    "GUEST": {"name": "en-US-Studio-O", "gender": "FEMALE"},
}
FPS = 30
FADE = 0.5
BG_COLOR = "0x0A0A0A"
WORK_DIR = V4_DIR / "work"


def get_access_token():
    """Get OAuth2 access token via gcloud, fallback to GOOGLE_API_KEY."""
    try:
        r = subprocess.run(["gcloud", "auth", "print-access-token"], capture_output=True, text=True, timeout=10)
        if r.returncode == 0 and r.stdout.strip():
            return ("bearer", r.stdout.strip())
    except Exception:
        pass
    api_key = os.environ.get("GOOGLE_API_KEY", "")
    if api_key:
        return ("apikey", api_key)
    raise RuntimeError("No auth: gcloud not available and GOOGLE_API_KEY not set")


def tts_segment(text, speaker, out_path):
    if out_path.exists() and out_path.stat().st_size > 1000:
        return get_duration(out_path)
    auth_type, auth_val = get_access_token()
    voice = VOICES.get(speaker, VOICES["HOST"])
    headers = {"Content-Type": "application/json"}
    if auth_type == "bearer":
        url = GOOGLE_TTS_URL
        headers["Authorization"] = f"Bearer {auth_val}"
    else:
        url = f"{GOOGLE_TTS_URL}?key={auth_val}"
    resp = __import__("requests").post(
        url,
        headers=headers,
        json={
            "input": {"text": text},
            "voice": {"languageCode": "en-US", "name": voice["name"], "ssmlGender": voice["gender"]},
            "audioConfig": {"audioEncoding": "MP3", "sampleRateHertz": 24000, "speakingRate": 1.0, "pitch": 0.0},
        },
        timeout=120,
    )
    if resp.status_code != 200:
        raise RuntimeError(f"TTS {resp.status_code}: {resp.text[:200]}")
    out_path.write_bytes(base64.b64decode(resp.json()["audioContent"]))
    time.sleep(0.2)
    return get_duration(out_path)


def get_duration(p):
    r = subprocess.run(["ffprobe", "-v", "quiet", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)], capture_output=True, text=True)
    return float(r.stdout.strip() or "0")


def get_image_height(p):
    r = subprocess.run(["ffprobe", "-v", "quiet", "-select_streams", "v:0", "-show_entries", "stream=height", "-of", "csv=p=0", str(p)], capture_output=True, text=True)
    return int(r.stdout.strip() or "1080")


def concat_audio(segs, out):
    out.with_suffix(".txt").write_text("\n".join(f"file '{s}'" for s in segs))
    subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(out.with_suffix(".txt")), "-c", "copy", str(out)], capture_output=True)
    return get_duration(out)


def encode_static(img_path, audio, out, dur):
    pad = dur + 0.5
    subprocess.run([
        "ffmpeg", "-y", "-loop", "1", "-i", str(img_path), "-i", str(audio),
        "-c:v", "libx264", "-preset", "fast", "-crf", "23", "-c:a", "aac", "-b:a", "192k",
        "-vf", f"scale={W}:{H_STD}:force_original_aspect_ratio=decrease,pad={W}:{H_STD}:(ow-iw)/2:(oh-ih)/2:color={BG_COLOR},fade=in:0:{FPS*FADE},fade=out:st={pad-FADE}:d={FADE}",
        "-t", str(pad), "-pix_fmt", "yuv420p", str(out),
    ], capture_output=True)


def encode_scroll(img_path, audio, out, dur):
    pad = dur + 0.5
    ih = get_image_height(img_path)
    scroll = max(0, ih - H_STD)
    if scroll <= 0:
        return encode_static(img_path, audio, out, dur)
    hold_s, hold_e = 1.0, 1.0
    st = max(1.0, pad - hold_s - hold_e)
    pps = scroll / st
    y = f"if(lt(t,{hold_s}),0,if(lt(t,{hold_s+st}),min((t-{hold_s})*{pps},{scroll}),{scroll}))"
    subprocess.run([
        "ffmpeg", "-y", "-loop", "1", "-i", str(img_path), "-i", str(audio),
        "-c:v", "libx264", "-preset", "fast", "-crf", "23", "-c:a", "aac", "-b:a", "192k",
        "-vf", f"scale={W}:-1:flags=lanczos,crop={W}:{H_STD}:0:'{y}',fade=in:0:{FPS*FADE},fade=out:st={pad-FADE}:d={FADE}",
        "-t", str(pad), "-pix_fmt", "yuv420p", str(out),
    ], capture_output=True)


def render_video():
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    try:
        get_access_token()
    except RuntimeError as e:
        print(f"ERROR: {e} — skipping render")
        return

    script = json.loads((V4_DIR / "podcast_script.json").read_text())
    topics = script["topics"]

    print(f"\nRendering {len(topics)} scenes...\n")
    scene_clips = []
    for idx, topic in enumerate(topics):
        print(f"[{idx+1}/{len(topics)}] {topic['topic_title']}")
        img_path = Path(OUT_DIR) / topic["screenshot"]
        if not img_path.exists():
            print(f"  WARNING: {img_path.name} not found, skipping")
            continue

        ih = get_image_height(img_path)
        is_tall = ih > H_STD + 100
        print(f"  {W}x{ih} | {'SCROLL' if is_tall else 'STATIC'}")

        segs, dur = [], 0
        for j, line in enumerate(topic["dialogue"]):
            sp = WORK_DIR / f"s{idx:02d}_seg{j:02d}.mp3"
            d = tts_segment(line["text"], line["speaker"], sp)
            segs.append(sp)
            dur += d
            print(f"  {line['speaker']}: {d:.1f}s")

        ta = WORK_DIR / f"s{idx:02d}_audio.mp3"
        dur = concat_audio(segs, ta)
        print(f"  Total: {dur:.1f}s")

        sc = WORK_DIR / f"scene{idx:02d}.mp4"
        (encode_scroll if is_tall else encode_static)(img_path, ta, sc, dur)
        scene_clips.append(sc)
        print()

    if not scene_clips:
        print("No scenes!")
        return

    final = V4_DIR / "sigil-tour-v4.mp4"
    print(f"Assembling {len(scene_clips)} scenes...")
    cl = final.with_name("concat.txt")
    cl.write_text("\n".join(f"file '{s}'" for s in scene_clips))
    subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(cl), "-c", "copy", "-movflags", "+faststart", str(final)], capture_output=True)

    fd = get_duration(final)
    fs = final.stat().st_size / (1024 * 1024)
    print(f"\n{'='*60}")
    print(f"DONE: {final}")
    print(f"Duration: {int(fd//60)}:{int(fd%60):02d}")
    print(f"Size: {fs:.1f} MB")
    print(f"Scenes: {len(scene_clips)}")
    print(f"{'='*60}")


if __name__ == "__main__":
    generate_all()
    if "--render" in sys.argv or os.environ.get("GOOGLE_API_KEY"):
        render_video()
