#!/usr/bin/env python3
"""Generate 10 professional Sigil CMS product tour screenshots using Pillow."""

import os
from PIL import Image, ImageDraw, ImageFont

# === CONSTANTS ===
W, H = 1920, 1080
SIDEBAR_W = 260
CONTENT_X = SIDEBAR_W + 40
CONTENT_W = W - SIDEBAR_W - 80

# Colors
BG = "#0a0a0a"
SIDEBAR_BG = "#111111"
SIDEBAR_HEADER = "#1a1a1a"
PRIMARY = "#90b9ab"
CARD_BG = "#161616"
CARD_BORDER = "#222222"
TEXT_PRIMARY = "#e5e5e5"
TEXT_SECONDARY = "#a0a0a0"
TEXT_MUTED = "#666666"
SUCCESS = "#10b981"
WARNING = "#f59e0b"
ERROR = "#ef4444"
INFO = "#3b82f6"
HOVER_BG = "#1e1e1e"

FONT_DIR = "/usr/share/fonts/truetype/dejavu/"
OUT_DIR = "/data/workspace/github/netrun-cms/studiocast/screenshots/"

os.makedirs(OUT_DIR, exist_ok=True)

# === FONTS ===
def font(size, bold=False):
    name = "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf"
    return ImageFont.truetype(FONT_DIR + name, size)

F_TITLE = font(24, bold=True)
F_HEADING = font(18, bold=True)
F_BODY = font(14)
F_BODY_BOLD = font(14, bold=True)
F_SMALL = font(12)
F_SMALL_BOLD = font(12, bold=True)
F_TINY = font(10)
F_LOGO = font(28, bold=True)
F_LOGO_SUB = font(10)
F_STAT_NUM = font(32, bold=True)
F_NAV = font(13)


# === HELPERS ===
def new_image():
    img = Image.new("RGB", (W, H), BG)
    return img, ImageDraw.Draw(img)


def rounded_rect(draw, xy, fill=None, outline=None, radius=8, width=1):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def draw_sidebar(draw, active_index=0):
    # Sidebar background
    draw.rectangle([0, 0, SIDEBAR_W, H], fill=SIDEBAR_BG)
    # Header area
    draw.rectangle([0, 0, SIDEBAR_W, 70], fill=SIDEBAR_HEADER)

    # Logo: sage green rounded rect with "S"
    rounded_rect(draw, [20, 15, 55, 55], fill=PRIMARY, radius=10)
    draw.text((28, 17), "S", fill="#0a0a0a", font=F_LOGO)
    draw.text((65, 20), "Sigil", fill=TEXT_PRIMARY, font=font(20, bold=True))
    draw.text((65, 46), "by Netrun", fill=TEXT_MUTED, font=F_TINY)

    # Divider
    draw.line([20, 75, SIDEBAR_W - 20, 75], fill="#222222", width=1)

    nav_items = [
        ("Dashboard", "grid"),
        ("Sites & Domains", "globe"),
        ("Design Playground", "palette"),
        ("Font Browser", "type"),
        ("Block Editor", "layers"),
        ("Plugin Marketplace", "puzzle"),
        ("Commerce", "cart"),
        ("Booking", "calendar"),
        ("Community", "users"),
        ("Analytics", "chart"),
    ]

    y = 90
    for i, (label, _icon) in enumerate(nav_items):
        if i == active_index:
            rounded_rect(draw, [12, y, SIDEBAR_W - 12, y + 36], fill="#1a2e27", radius=6)
            # Active indicator
            draw.rectangle([4, y + 8, 6, y + 28], fill=PRIMARY)
            color = PRIMARY
        else:
            color = TEXT_SECONDARY

        # Icon placeholder: small circle
        cx, cy = 32, y + 18
        r = 7
        icon_color = PRIMARY if i == active_index else TEXT_MUTED
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=icon_color, width=1)
        draw.text((48, y + 9), label, fill=color, font=F_NAV)
        y += 42

    # Bottom section
    draw.line([20, H - 70, SIDEBAR_W - 20, H - 70], fill="#222222", width=1)
    draw.ellipse([20, H - 50, 48, H - 22], fill="#2a2a2a", outline="#333333")
    draw.text((32, H - 44), "D", fill=TEXT_SECONDARY, font=F_SMALL)
    draw.text((56, H - 50), "Daniel Garza", fill=TEXT_PRIMARY, font=F_SMALL)
    draw.text((56, H - 34), "Admin", fill=TEXT_MUTED, font=F_TINY)


def draw_page_title(draw, title, subtitle=None, y=30):
    draw.text((CONTENT_X, y), title, fill=TEXT_PRIMARY, font=F_TITLE)
    if subtitle:
        draw.text((CONTENT_X, y + 32), subtitle, fill=TEXT_SECONDARY, font=F_SMALL)
    return y + (60 if subtitle else 45)


def draw_card(draw, x, y, w, h, title=None, radius=10):
    rounded_rect(draw, [x, y, x + w, y + h], fill=CARD_BG, outline=CARD_BORDER, radius=radius)
    if title:
        draw.text((x + 20, y + 16), title, fill=TEXT_PRIMARY, font=F_HEADING)
        draw.line([x + 1, y + 48, x + w - 1, y + 48], fill=CARD_BORDER, width=1)
        return y + 58
    return y + 16


def draw_badge(draw, x, y, text, color, bg=None):
    if bg is None:
        bg = color + "22"
        # approximate translucent bg
        r, g, b = int(color[1:3], 16), int(color[3:5], 16), int(color[5:7], 16)
        bg = "#{:02x}{:02x}{:02x}".format(max(r // 5, 10), max(g // 5, 10), max(b // 5, 10))
    tw = len(text) * 7 + 16
    rounded_rect(draw, [x, y, x + tw, y + 22], fill=bg, radius=11)
    draw.text((x + 8, y + 4), text, fill=color, font=F_SMALL)
    return tw


def draw_button(draw, x, y, text, fill_color=PRIMARY, text_color="#0a0a0a", w=None):
    tw = (len(text) * 8 + 24) if w is None else w
    rounded_rect(draw, [x, y, x + tw, y + 34], fill=fill_color, radius=6)
    draw.text((x + 12, y + 8), text, fill=text_color, font=F_BODY_BOLD)
    return tw


def draw_dot(draw, x, y, color, r=5):
    draw.ellipse([x - r, y - r, x + r, y + r], fill=color)


# === SCREENSHOT 1: Dashboard ===
def gen_dashboard():
    img, draw = new_image()
    draw_sidebar(draw, 0)
    cy = draw_page_title(draw, "Dashboard", "Welcome back, Daniel")

    # Stat cards
    stats = [
        ("Sites", "3", PRIMARY),
        ("Pages", "24", INFO),
        ("Media Files", "156", WARNING),
        ("Active Plugins", "14", SUCCESS),
    ]
    card_w = (CONTENT_W - 60) // 4
    for i, (label, val, color) in enumerate(stats):
        x = CONTENT_X + i * (card_w + 20)
        rounded_rect(draw, [x, cy, x + card_w, cy + 110], fill=CARD_BG, outline=CARD_BORDER, radius=10)
        # Color accent bar at top
        rounded_rect(draw, [x, cy, x + card_w, cy + 5], fill=color, radius=2)
        draw.text((x + 20, cy + 22), val, fill=TEXT_PRIMARY, font=F_STAT_NUM)
        draw.text((x + 20, cy + 64), label, fill=TEXT_SECONDARY, font=F_BODY)
        # Mini icon
        draw.ellipse([x + card_w - 40, cy + 30, x + card_w - 16, cy + 54], fill=color + "33", outline=color)

    cy += 140

    # Recent Activity
    act_w = int(CONTENT_W * 0.62)
    inner_y = draw_card(draw, CONTENT_X, cy, act_w, 340, "Recent Activity")
    activities = [
        ("Page updated: /about", "2 min ago", INFO),
        ("New media uploaded: hero-banner.jpg", "15 min ago", SUCCESS),
        ("Plugin enabled: SEO Optimizer", "1 hour ago", PRIMARY),
        ("Site published: portfolio.netrun.net", "3 hours ago", SUCCESS),
        ("Theme changed: Netrun Dark", "5 hours ago", WARNING),
    ]
    for label, time_str, color in activities:
        draw_dot(draw, CONTENT_X + 30, inner_y + 10, color, r=4)
        draw.text((CONTENT_X + 45, inner_y + 2), label, fill=TEXT_PRIMARY, font=F_BODY)
        draw.text((CONTENT_X + act_w - 120, inner_y + 2), time_str, fill=TEXT_MUTED, font=F_SMALL)
        inner_y += 48

    # Quick Actions
    qa_x = CONTENT_X + act_w + 20
    qa_w = CONTENT_W - act_w - 20
    inner_y2 = draw_card(draw, qa_x, cy, qa_w, 340, "Quick Actions")
    actions = ["Create New Page", "Upload Media", "Install Plugin", "Edit Theme", "View Analytics"]
    for action in actions:
        draw_button(draw, qa_x + 20, inner_y2, action, fill_color="#1a2e27", text_color=PRIMARY, w=qa_w - 40)
        inner_y2 += 50

    img.save(OUT_DIR + "01-dashboard.png")
    print("  01-dashboard.png")


# === SCREENSHOT 2: Sites & Domains ===
def gen_sites():
    img, draw = new_image()
    draw_sidebar(draw, 1)
    cy = draw_page_title(draw, "Sites & Domains", "Manage your multi-tenant sites")

    sites = [
        ("Portfolio Site", "portfolio.netrun.net", True, "Published", SUCCESS, 8),
        ("Company Blog", "blog.netrunsystems.com", True, "Published", SUCCESS, 12),
        ("Product Landing", "sigil.netrun.net", False, "Draft", WARNING, 4),
    ]

    card_w = (CONTENT_W - 40) // 3
    for i, (name, domain, ssl, status, color, pages) in enumerate(sites):
        x = CONTENT_X + i * (card_w + 20)
        rounded_rect(draw, [x, cy, x + card_w, cy + 260], fill=CARD_BG, outline=CARD_BORDER, radius=10)

        # Site preview placeholder
        rounded_rect(draw, [x + 12, cy + 12, x + card_w - 12, cy + 100], fill="#1a1a1a", radius=6)
        draw.text((x + card_w // 2 - 30, cy + 48), "Preview", fill=TEXT_MUTED, font=F_SMALL)

        # Name
        draw.text((x + 16, cy + 112), name, fill=TEXT_PRIMARY, font=F_HEADING)

        # Domain with SSL
        ssl_icon = " ✓" if ssl else " ✗"
        ssl_color = SUCCESS if ssl else ERROR
        draw.text((x + 16, cy + 140), domain, fill=TEXT_SECONDARY, font=F_SMALL)
        draw.text((x + 16 + len(domain) * 7, cy + 140), ssl_icon, fill=ssl_color, font=F_SMALL_BOLD)

        # Status badge
        draw_badge(draw, x + 16, cy + 168, status, color)

        # Page count
        draw.text((x + 16, cy + 205), f"{pages} pages", fill=TEXT_MUTED, font=F_SMALL)

        # Edit button
        draw_button(draw, x + 16, cy + 225, "Manage", w=card_w - 32)

    # Add new site card (dashed)
    x = CONTENT_X
    cy2 = cy + 290
    rounded_rect(draw, [x, cy2, x + 200, cy2 + 120], fill=None, outline=TEXT_MUTED, radius=10)
    draw.text((x + 70, cy2 + 35), "+", fill=TEXT_MUTED, font=font(30))
    draw.text((x + 50, cy2 + 75), "Add New Site", fill=TEXT_MUTED, font=F_SMALL)

    img.save(OUT_DIR + "02-sites-domains.png")
    print("  02-sites-domains.png")


# === SCREENSHOT 3: Design Playground ===
def gen_design_playground():
    img, draw = new_image()
    draw_sidebar(draw, 2)
    cy = draw_page_title(draw, "Design Playground", "Customize your theme tokens")

    # Tabs
    tabs = ["Colors", "Typography", "Spacing", "Borders", "Shadows", "Motion"]
    tx = CONTENT_X
    for i, tab in enumerate(tabs):
        tw = len(tab) * 9 + 24
        if i == 0:
            rounded_rect(draw, [tx, cy, tx + tw, cy + 32], fill=PRIMARY, radius=6)
            draw.text((tx + 12, cy + 7), tab, fill="#0a0a0a", font=F_BODY_BOLD)
        else:
            rounded_rect(draw, [tx, cy, tx + tw, cy + 32], fill=CARD_BG, outline=CARD_BORDER, radius=6)
            draw.text((tx + 12, cy + 7), tab, fill=TEXT_SECONDARY, font=F_BODY)
        tx += tw + 10
    cy += 52

    # Left panel: Color swatches
    panel_w = int(CONTENT_W * 0.55)
    inner_y = draw_card(draw, CONTENT_X, cy, panel_w, 520, "Color Tokens")

    colors = [
        ("Primary", "#90b9ab"), ("Primary Dark", "#6d9a8a"), ("Primary Light", "#b3d4c8"),
        ("Background", "#0a0a0a"), ("Surface", "#161616"), ("Card", "#1a1a1a"),
        ("Text Primary", "#e5e5e5"), ("Text Secondary", "#a0a0a0"), ("Border", "#222222"),
        ("Success", "#10b981"), ("Warning", "#f59e0b"), ("Error", "#ef4444"),
        ("Info", "#3b82f6"), ("Accent", "#8b5cf6"), ("Highlight", "#ec4899"),
    ]
    cols = 3
    sw = 48
    for i, (name, hex_val) in enumerate(colors):
        col = i % cols
        row = i // cols
        sx = CONTENT_X + 20 + col * (panel_w // cols)
        sy = inner_y + row * 50
        # Swatch circle
        draw.ellipse([sx, sy, sx + sw, sy + sw - 8], fill=hex_val, outline="#333333")
        draw.text((sx + sw + 8, sy + 2), name, fill=TEXT_PRIMARY, font=F_SMALL)
        draw.text((sx + sw + 8, sy + 18), hex_val, fill=TEXT_MUTED, font=F_TINY)

    # Right: button shapes + preview
    prev_x = CONTENT_X + panel_w + 20
    prev_w = CONTENT_W - panel_w - 20
    inner_y2 = draw_card(draw, prev_x, cy, prev_w, 240, "Button Radius")

    radii = [0, 4, 8, 16, 50]
    labels = ["Square", "Subtle", "Rounded", "Pill-ish", "Pill"]
    bw = 80
    for i, (r, lbl) in enumerate(zip(radii, labels)):
        bx = prev_x + 20 + i * (bw + 8)
        by = inner_y2 + 10
        rounded_rect(draw, [bx, by, bx + bw, by + 36], fill=PRIMARY if i == 2 else CARD_BG,
                      outline=PRIMARY, radius=r)
        tc = "#0a0a0a" if i == 2 else PRIMARY
        draw.text((bx + 15, by + 9), lbl, fill=tc, font=F_TINY)

    # Mini preview panel
    inner_y3 = draw_card(draw, prev_x, cy + 260, prev_w, 260, "Live Preview")
    # Mini page preview
    rounded_rect(draw, [prev_x + 20, inner_y3 + 5, prev_x + prev_w - 20, inner_y3 + 180],
                 fill="#0e0e0e", outline="#222222", radius=6)
    draw.rectangle([prev_x + 20, inner_y3 + 5, prev_x + 80, inner_y3 + 185], fill="#111111")
    draw.text((prev_x + 90, inner_y3 + 20), "Preview", fill=TEXT_MUTED, font=F_SMALL)
    rounded_rect(draw, [prev_x + 90, inner_y3 + 50, prev_x + prev_w - 40, inner_y3 + 80],
                 fill=PRIMARY, radius=6)
    draw.text((prev_x + 100, inner_y3 + 56), "Hero Block", fill="#0a0a0a", font=F_SMALL)
    rounded_rect(draw, [prev_x + 90, inner_y3 + 90, prev_x + prev_w - 40, inner_y3 + 110],
                 fill=CARD_BG, outline=CARD_BORDER, radius=4)
    rounded_rect(draw, [prev_x + 90, inner_y3 + 120, prev_x + prev_w - 40, inner_y3 + 140],
                 fill=CARD_BG, outline=CARD_BORDER, radius=4)

    img.save(OUT_DIR + "03-design-playground.png")
    print("  03-design-playground.png")


# === SCREENSHOT 4: Font Browser ===
def gen_font_browser():
    img, draw = new_image()
    draw_sidebar(draw, 3)
    cy = draw_page_title(draw, "Font Browser", "70+ Google Fonts available")

    # Search bar
    rounded_rect(draw, [CONTENT_X, cy, CONTENT_X + CONTENT_W, cy + 44], fill=CARD_BG, outline=CARD_BORDER, radius=8)
    draw.text((CONTENT_X + 16, cy + 12), "Search fonts...", fill=TEXT_MUTED, font=F_BODY)
    # Search icon
    draw.ellipse([CONTENT_X + CONTENT_W - 40, cy + 10, CONTENT_X + CONTENT_W - 16, cy + 34],
                 outline=TEXT_MUTED, width=1)
    cy += 60

    # Category pills
    cats = ["All", "Sans-serif", "Serif", "Display", "Monospace", "Handwriting"]
    px = CONTENT_X
    for i, cat in enumerate(cats):
        pw = len(cat) * 8 + 20
        if i == 1:
            rounded_rect(draw, [px, cy, px + pw, cy + 30], fill=PRIMARY, radius=15)
            draw.text((px + 10, cy + 7), cat, fill="#0a0a0a", font=F_SMALL_BOLD)
        else:
            rounded_rect(draw, [px, cy, px + pw, cy + 30], fill=CARD_BG, outline=CARD_BORDER, radius=15)
            draw.text((px + 10, cy + 7), cat, fill=TEXT_SECONDARY, font=F_SMALL)
        px += pw + 10
    cy += 50

    # Font list
    fonts_list = [
        ("Inter", "The quick brown fox jumps over the lazy dog", "Sans-serif", True),
        ("Roboto", "The quick brown fox jumps over the lazy dog", "Sans-serif", False),
        ("Playfair Display", "The quick brown fox jumps over the lazy dog", "Serif", False),
        ("Montserrat", "The quick brown fox jumps over the lazy dog", "Sans-serif", False),
        ("Lato", "The quick brown fox jumps over the lazy dog", "Sans-serif", False),
        ("Merriweather", "The quick brown fox jumps over the lazy dog", "Serif", False),
        ("Oswald", "The quick brown fox jumps over the lazy dog", "Display", False),
        ("Poppins", "The quick brown fox jumps over the lazy dog", "Sans-serif", False),
    ]

    for fname, sample, cat, selected in fonts_list:
        bg = "#1a2e27" if selected else CARD_BG
        border = PRIMARY if selected else CARD_BORDER
        rounded_rect(draw, [CONTENT_X, cy, CONTENT_X + CONTENT_W, cy + 80], fill=bg, outline=border, radius=8)

        draw.text((CONTENT_X + 20, cy + 10), fname, fill=TEXT_PRIMARY, font=F_HEADING)
        draw_badge(draw, CONTENT_X + 20 + len(fname) * 11 + 10, cy + 12, cat, TEXT_MUTED, bg="#222222")

        # Sample text — use different sizes to simulate different weights
        if fname in ("Playfair Display", "Merriweather"):
            sample_font = font(16, bold=True)
        elif fname in ("Oswald",):
            sample_font = font(16)
        else:
            sample_font = F_BODY
        draw.text((CONTENT_X + 20, cy + 44), sample, fill=TEXT_SECONDARY, font=sample_font)

        if selected:
            draw.text((CONTENT_X + CONTENT_W - 80, cy + 28), "Selected", fill=PRIMARY, font=F_SMALL_BOLD)
        else:
            draw_button(draw, CONTENT_X + CONTENT_W - 80, cy + 24, "Use", fill_color="#222222", text_color=TEXT_SECONDARY, w=60)

        cy += 90

    img.save(OUT_DIR + "04-font-browser.png")
    print("  04-font-browser.png")


# === SCREENSHOT 5: Block Editor ===
def gen_block_editor():
    img, draw = new_image()
    draw_sidebar(draw, 4)
    cy = draw_page_title(draw, "Block Editor", "Editing: /about — 3 content blocks")

    # Page path breadcrumb
    draw.text((CONTENT_X, cy), "Home  /  Sites  /  Portfolio  /  About Page", fill=TEXT_MUTED, font=F_SMALL)
    cy += 30

    # Block 1: Hero (expanded)
    block_h = 280
    rounded_rect(draw, [CONTENT_X, cy, CONTENT_X + CONTENT_W, cy + block_h], fill=CARD_BG, outline=PRIMARY, radius=10)
    # Drag handle
    for j in range(3):
        draw.rectangle([CONTENT_X + 8, cy + 14 + j * 6, CONTENT_X + 18, cy + 16 + j * 6], fill=TEXT_MUTED)
    # Block header
    draw_badge(draw, CONTENT_X + 28, cy + 10, "HERO", PRIMARY)
    draw.text((CONTENT_X + CONTENT_W - 120, cy + 12), "Expanded", fill=PRIMARY, font=F_SMALL)
    draw.line([CONTENT_X + 1, cy + 40, CONTENT_X + CONTENT_W - 1, cy + 40], fill=CARD_BORDER)

    # Fields
    fields = [
        ("Heading", "Welcome to Netrun Systems"),
        ("Subheading", "Cloud infrastructure, DevSecOps, and AI solutions"),
        ("CTA Button Text", "Get Started"),
        ("CTA Button URL", "/contact"),
        ("Background", "Gradient: #0a0a0a to #1a2e27"),
    ]
    fy = cy + 52
    fw = CONTENT_W - 60
    for label, value in fields:
        draw.text((CONTENT_X + 30, fy), label, fill=TEXT_SECONDARY, font=F_SMALL)
        rounded_rect(draw, [CONTENT_X + 30, fy + 18, CONTENT_X + 30 + fw, fy + 44], fill="#0e0e0e", outline="#333333", radius=4)
        draw.text((CONTENT_X + 40, fy + 23), value, fill=TEXT_PRIMARY, font=F_SMALL)
        fy += 46
    cy += block_h + 12

    # Block 2: Text (collapsed)
    block_h2 = 56
    rounded_rect(draw, [CONTENT_X, cy, CONTENT_X + CONTENT_W, cy + block_h2], fill=CARD_BG, outline=CARD_BORDER, radius=10)
    for j in range(3):
        draw.rectangle([CONTENT_X + 8, cy + 20 + j * 6, CONTENT_X + 18, cy + 22 + j * 6], fill=TEXT_MUTED)
    draw_badge(draw, CONTENT_X + 28, cy + 16, "TEXT", INFO)
    draw.text((CONTENT_X + 110, cy + 18), "Our mission is to empower businesses with...", fill=TEXT_SECONDARY, font=F_SMALL)
    draw.text((CONTENT_X + CONTENT_W - 120, cy + 18), "Collapsed", fill=TEXT_MUTED, font=F_SMALL)
    cy += block_h2 + 12

    # Block 3: Gallery (collapsed)
    block_h3 = 56
    rounded_rect(draw, [CONTENT_X, cy, CONTENT_X + CONTENT_W, cy + block_h3], fill=CARD_BG, outline=CARD_BORDER, radius=10)
    for j in range(3):
        draw.rectangle([CONTENT_X + 8, cy + 20 + j * 6, CONTENT_X + 18, cy + 22 + j * 6], fill=TEXT_MUTED)
    draw_badge(draw, CONTENT_X + 28, cy + 16, "GALLERY", WARNING)
    draw.text((CONTENT_X + 140, cy + 18), "12 images  |  Grid layout  |  Lightbox enabled", fill=TEXT_SECONDARY, font=F_SMALL)
    draw.text((CONTENT_X + CONTENT_W - 120, cy + 18), "Collapsed", fill=TEXT_MUTED, font=F_SMALL)
    cy += block_h3 + 20

    # Add block button
    rounded_rect(draw, [CONTENT_X, cy, CONTENT_X + CONTENT_W, cy + 48], fill=None, outline=TEXT_MUTED, radius=8)
    draw.text((CONTENT_X + CONTENT_W // 2 - 40, cy + 14), "+ Add Block", fill=TEXT_MUTED, font=F_BODY)

    img.save(OUT_DIR + "05-block-editor.png")
    print("  05-block-editor.png")


# === SCREENSHOT 6: Plugin Marketplace ===
def gen_plugins():
    img, draw = new_image()
    draw_sidebar(draw, 5)
    cy = draw_page_title(draw, "Plugin Marketplace", "Extend Sigil with powerful plugins")

    plugins = [
        ("SEO Optimizer", "Meta tags, sitemaps, Open Graph", SUCCESS, True, "#3b82f6"),
        ("Analytics", "Visitor tracking and insights", SUCCESS, True, "#8b5cf6"),
        ("Forms", "Contact forms and submissions", SUCCESS, True, "#10b981"),
        ("Commerce", "Stripe payments, products", SUCCESS, True, "#f59e0b"),
        ("Booking", "Appointments and scheduling", SUCCESS, True, "#ec4899"),
        ("Community", "Forums and discussions", SUCCESS, True, "#ef4444"),
        ("Newsletter", "Email collection, campaigns", None, False, "#06b6d4"),
        ("Multilingual", "i18n translation support", None, False, "#84cc16"),
        ("Image Optimizer", "WebP conversion, lazy loading", None, False, "#f97316"),
    ]

    card_w = (CONTENT_W - 40) // 3
    card_h = 180
    for i, (name, desc, status_color, active, icon_color) in enumerate(plugins):
        col = i % 3
        row = i // 3
        x = CONTENT_X + col * (card_w + 20)
        y = cy + row * (card_h + 16)

        rounded_rect(draw, [x, y, x + card_w, y + card_h], fill=CARD_BG, outline=CARD_BORDER, radius=10)

        # Plugin icon (colored circle)
        draw.ellipse([x + 16, y + 16, x + 48, y + 48], fill=icon_color)
        # Icon letter
        draw.text((x + 26, y + 22), name[0], fill="#ffffff", font=F_BODY_BOLD)

        # Name and desc
        draw.text((x + 58, y + 18), name, fill=TEXT_PRIMARY, font=F_BODY_BOLD)
        draw.text((x + 58, y + 38), desc, fill=TEXT_SECONDARY, font=F_TINY)

        # Status
        if active:
            draw_badge(draw, x + 16, y + 70, "Active", SUCCESS)
            # Settings link
            draw.text((x + 16, y + card_h - 40), "Settings", fill=PRIMARY, font=F_SMALL)
        else:
            draw_button(draw, x + 16, y + 70, "Install", fill_color="#222222", text_color=PRIMARY, w=80)
            draw.text((x + 16, y + card_h - 40), "Learn more", fill=TEXT_MUTED, font=F_SMALL)

        # Version
        draw.text((x + card_w - 50, y + card_h - 24), "v1.0.0", fill=TEXT_MUTED, font=F_TINY)

    img.save(OUT_DIR + "06-plugin-marketplace.png")
    print("  06-plugin-marketplace.png")


# === SCREENSHOT 7: Commerce ===
def gen_commerce():
    img, draw = new_image()
    draw_sidebar(draw, 6)
    cy = draw_page_title(draw, "Commerce", "Products, orders, and Stripe integration")

    # Product list
    list_w = int(CONTENT_W * 0.65)
    inner_y = draw_card(draw, CONTENT_X, cy, list_w, 440, "Products")

    products = [
        ("Starter Plan", "$29/mo", SUCCESS, True),
        ("Pro Plan", "$79/mo", SUCCESS, True),
        ("Enterprise Plan", "$249/mo", SUCCESS, True),
        ("Custom Integration", "$499 one-time", WARNING, False),
    ]

    # Table header
    draw.text((CONTENT_X + 20, inner_y), "Product", fill=TEXT_MUTED, font=F_SMALL_BOLD)
    draw.text((CONTENT_X + list_w // 2, inner_y), "Price", fill=TEXT_MUTED, font=F_SMALL_BOLD)
    draw.text((CONTENT_X + list_w - 140, inner_y), "Stripe Sync", fill=TEXT_MUTED, font=F_SMALL_BOLD)
    inner_y += 28

    for name, price, color, synced in products:
        draw.line([CONTENT_X + 10, inner_y - 4, CONTENT_X + list_w - 10, inner_y - 4], fill="#1e1e1e")
        draw.text((CONTENT_X + 20, inner_y + 6), name, fill=TEXT_PRIMARY, font=F_BODY)
        draw.text((CONTENT_X + list_w // 2, inner_y + 6), price, fill=TEXT_PRIMARY, font=F_BODY_BOLD)

        # Sync dot
        dot_color = SUCCESS if synced else WARNING
        draw_dot(draw, CONTENT_X + list_w - 100, inner_y + 14, dot_color, r=5)
        label = "Synced" if synced else "Pending"
        draw.text((CONTENT_X + list_w - 90, inner_y + 6), label, fill=dot_color, font=F_SMALL)
        inner_y += 50

    # Add product button
    draw_button(draw, CONTENT_X + 20, inner_y + 10, "+ Add Product", fill_color="#1a2e27", text_color=PRIMARY, w=list_w - 40)

    # Order stats sidebar
    stats_x = CONTENT_X + list_w + 20
    stats_w = CONTENT_W - list_w - 20
    inner_y2 = draw_card(draw, stats_x, cy, stats_w, 200, "Order Stats")

    # Stats
    draw.text((stats_x + 20, inner_y2 + 10), "12", fill=SUCCESS, font=F_STAT_NUM)
    draw.text((stats_x + 80, inner_y2 + 20), "Completed", fill=TEXT_SECONDARY, font=F_BODY)

    draw.text((stats_x + 20, inner_y2 + 60), "3", fill=WARNING, font=F_STAT_NUM)
    draw.text((stats_x + 50, inner_y2 + 70), "Pending", fill=TEXT_SECONDARY, font=F_BODY)

    draw.text((stats_x + 20, inner_y2 + 110), "$2,847", fill=PRIMARY, font=font(22, bold=True))
    draw.text((stats_x + 20, inner_y2 + 138), "Total Revenue (MTD)", fill=TEXT_MUTED, font=F_SMALL)

    # Revenue chart placeholder
    inner_y3 = draw_card(draw, stats_x, cy + 220, stats_w, 220, "Revenue Trend")
    # Simple bar chart
    bars = [30, 45, 35, 60, 80, 55, 90]
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    bar_w = (stats_w - 60) // 7
    for i, (h, day) in enumerate(zip(bars, days)):
        bx = stats_x + 20 + i * (bar_w + 4)
        by = inner_y3 + 140 - h
        rounded_rect(draw, [bx, by, bx + bar_w, inner_y3 + 140], fill=PRIMARY, radius=3)
        draw.text((bx + 4, inner_y3 + 148), day, fill=TEXT_MUTED, font=F_TINY)

    img.save(OUT_DIR + "07-commerce.png")
    print("  07-commerce.png")


# === SCREENSHOT 8: Booking ===
def gen_booking():
    img, draw = new_image()
    draw_sidebar(draw, 7)
    cy = draw_page_title(draw, "Booking", "Services, availability, and appointments")

    # Service cards
    services = [
        ("Cloud Consultation", "60 min", "$150", "12 booked"),
        ("Security Audit", "90 min", "$300", "8 booked"),
        ("DevOps Workshop", "120 min", "$500", "4 booked"),
    ]
    card_w = (CONTENT_W - 40) // 3
    for i, (name, duration, price, booked) in enumerate(services):
        x = CONTENT_X + i * (card_w + 20)
        rounded_rect(draw, [x, cy, x + card_w, cy + 130], fill=CARD_BG, outline=CARD_BORDER, radius=10)
        draw.text((x + 16, cy + 14), name, fill=TEXT_PRIMARY, font=F_BODY_BOLD)
        draw.text((x + 16, cy + 38), f"{duration}  |  {price}", fill=TEXT_SECONDARY, font=F_SMALL)
        draw_badge(draw, x + 16, cy + 65, booked, INFO)
        draw_button(draw, x + 16, cy + 95, "Edit", fill_color="#222222", text_color=PRIMARY, w=card_w - 32)

    cy += 155

    # Appointment count badge
    draw_badge(draw, CONTENT_X + CONTENT_W - 150, cy - 8, "24 this week", PRIMARY)

    # Weekly availability grid
    inner_y = draw_card(draw, CONTENT_X, cy, CONTENT_W, 450, "Weekly Availability")

    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    day_w = (CONTENT_W - 40) // 7
    hours = ["9AM", "10AM", "11AM", "12PM", "1PM", "2PM", "3PM", "4PM", "5PM"]

    # Day headers
    for i, day in enumerate(days):
        dx = CONTENT_X + 20 + i * day_w
        draw.text((dx + 4, inner_y), day[:3], fill=TEXT_SECONDARY, font=F_SMALL_BOLD)
    inner_y += 24

    # Time slots
    slot_colors = [
        # Mon    Tue      Wed     Thu      Fri     Sat      Sun
        [SUCCESS, None, SUCCESS, SUCCESS, None, None, None],      # 9AM
        [SUCCESS, SUCCESS, None, SUCCESS, SUCCESS, None, None],   # 10AM
        [None, SUCCESS, SUCCESS, None, SUCCESS, None, None],      # 11AM
        [WARNING, None, None, WARNING, None, None, None],         # 12PM (lunch)
        [SUCCESS, SUCCESS, SUCCESS, None, SUCCESS, SUCCESS, None], # 1PM
        [None, None, SUCCESS, SUCCESS, SUCCESS, SUCCESS, None],   # 2PM
        [SUCCESS, SUCCESS, None, SUCCESS, None, None, None],      # 3PM
        [None, SUCCESS, SUCCESS, None, SUCCESS, None, None],      # 4PM
        [None, None, None, None, None, None, None],               # 5PM
    ]

    for hi, (hour, row) in enumerate(zip(hours, slot_colors)):
        for di, color in enumerate(row):
            sx = CONTENT_X + 20 + di * day_w
            sy = inner_y + hi * 40
            if color:
                rounded_rect(draw, [sx + 2, sy + 2, sx + day_w - 4, sy + 34], fill=color + "33", outline=color, radius=4)
                draw.text((sx + 8, sy + 10), hour, fill=color, font=F_TINY)
            else:
                rounded_rect(draw, [sx + 2, sy + 2, sx + day_w - 4, sy + 34], fill="#111111", outline="#1e1e1e", radius=4)

    img.save(OUT_DIR + "08-booking.png")
    print("  08-booking.png")


# === SCREENSHOT 9: Community ===
def gen_community():
    img, draw = new_image()
    draw_sidebar(draw, 8)
    cy = draw_page_title(draw, "Community", "Forums, discussions, and leaderboard")

    # Thread list
    list_w = int(CONTENT_W * 0.68)
    inner_y = draw_card(draw, CONTENT_X, cy, list_w, 600, "Forum Threads")

    threads = [
        ("How to customize theme tokens?", "design", 42, 12, "alice_dev", True),
        ("Best practices for multi-tenant setup", "architecture", 38, 8, "bob_ops", False),
        ("Plugin API documentation request", "plugins", 27, 15, "charlie_eng", False),
        ("Migrating from WordPress to Sigil", "migration", 24, 6, "dana_web", True),
        ("Block editor keyboard shortcuts", "editor", 19, 4, "eve_ux", False),
        ("Custom commerce webhook handlers", "commerce", 15, 9, "frank_pay", False),
        ("Community feature roadmap", "meta", 31, 22, "garza_admin", True),
        ("Performance benchmarks vs competitors", "benchmarks", 28, 11, "heidi_perf", False),
    ]

    for title, cat, votes, replies, author, pinned in threads:
        draw.line([CONTENT_X + 10, inner_y - 2, CONTENT_X + list_w - 10, inner_y - 2], fill="#1e1e1e")

        # Vote arrows and count
        vx = CONTENT_X + 30
        draw.polygon([(vx, inner_y + 16), (vx - 8, inner_y + 26), (vx + 8, inner_y + 26)], fill=PRIMARY)
        draw.text((vx - 8, inner_y + 30), str(votes), fill=TEXT_PRIMARY, font=F_SMALL_BOLD)
        draw.polygon([(vx, inner_y + 56), (vx - 8, inner_y + 46), (vx + 8, inner_y + 46)], fill=TEXT_MUTED)

        # Title
        title_color = TEXT_PRIMARY
        draw.text((CONTENT_X + 60, inner_y + 8), title, fill=title_color, font=F_BODY_BOLD)
        if pinned:
            draw_badge(draw, CONTENT_X + 60 + len(title) * 8 + 5, inner_y + 8, "Pinned", WARNING)

        # Category badge
        cat_colors = {"design": "#8b5cf6", "architecture": INFO, "plugins": SUCCESS,
                      "migration": WARNING, "editor": "#ec4899", "commerce": "#f59e0b",
                      "meta": PRIMARY, "benchmarks": "#06b6d4"}
        cc = cat_colors.get(cat, TEXT_MUTED)
        draw_badge(draw, CONTENT_X + 60, inner_y + 34, cat, cc)

        # Reply count and author
        draw.text((CONTENT_X + 60 + len(cat) * 7 + 30, inner_y + 36), f"{replies} replies", fill=TEXT_MUTED, font=F_TINY)
        draw.text((CONTENT_X + list_w - 100, inner_y + 36), author, fill=TEXT_MUTED, font=F_TINY)

        inner_y += 68

    # Leaderboard sidebar
    lb_x = CONTENT_X + list_w + 20
    lb_w = CONTENT_W - list_w - 20
    inner_y2 = draw_card(draw, lb_x, cy, lb_w, 300, "Leaderboard")

    leaders = [
        ("garza_admin", 142, "#ffd700"),
        ("alice_dev", 98, "#c0c0c0"),
        ("bob_ops", 87, "#cd7f32"),
        ("charlie_eng", 65, None),
        ("dana_web", 52, None),
    ]
    for i, (name, pts, medal) in enumerate(leaders):
        ly = inner_y2 + i * 42
        if medal:
            draw.ellipse([lb_x + 16, ly + 4, lb_x + 30, ly + 18], fill=medal)
            draw.text((lb_x + 20, ly + 4), str(i + 1), fill="#0a0a0a", font=F_TINY)
        else:
            draw.text((lb_x + 18, ly + 4), str(i + 1), fill=TEXT_MUTED, font=F_SMALL)
        draw.text((lb_x + 40, ly + 2), name, fill=TEXT_PRIMARY, font=F_SMALL)
        draw.text((lb_x + 40, ly + 18), f"{pts} pts", fill=PRIMARY, font=F_TINY)

    # Stats card
    inner_y3 = draw_card(draw, lb_x, cy + 320, lb_w, 150, "Community Stats")
    stats = [("Members", "247"), ("Threads", "89"), ("Posts", "1,342")]
    for i, (label, val) in enumerate(stats):
        sy = inner_y3 + i * 28
        draw.text((lb_x + 20, sy), label, fill=TEXT_SECONDARY, font=F_SMALL)
        draw.text((lb_x + lb_w - 70, sy), val, fill=TEXT_PRIMARY, font=F_SMALL_BOLD)

    img.save(OUT_DIR + "09-community.png")
    print("  09-community.png")


# === SCREENSHOT 10: Analytics (Resonance) ===
def gen_analytics():
    img, draw = new_image()
    draw_sidebar(draw, 9)
    cy = draw_page_title(draw, "Analytics — Resonance Engine", "Content performance heatmap and experiments")

    # Stats cards at top
    stats = [
        ("Pageviews (7d)", "4,281", SUCCESS),
        ("Avg. Time on Page", "2m 34s", INFO),
        ("Bounce Rate", "32%", WARNING),
        ("Conversions", "67", PRIMARY),
    ]
    card_w = (CONTENT_W - 60) // 4
    for i, (label, val, color) in enumerate(stats):
        x = CONTENT_X + i * (card_w + 20)
        rounded_rect(draw, [x, cy, x + card_w, cy + 90], fill=CARD_BG, outline=CARD_BORDER, radius=10)
        draw.text((x + 16, cy + 14), val, fill=TEXT_PRIMARY, font=font(22, bold=True))
        draw.text((x + 16, cy + 50), label, fill=TEXT_SECONDARY, font=F_SMALL)
        draw_dot(draw, x + card_w - 20, cy + 20, color, r=6)
    cy += 115

    # Resonance Heatmap
    hm_w = int(CONTENT_W * 0.58)
    inner_y = draw_card(draw, CONTENT_X, cy, hm_w, 380, "Resonance Heatmap")

    blocks = [
        ("Hero Block", 0.95, 4281),
        ("Features Grid", 0.78, 3340),
        ("Testimonials", 0.65, 2783),
        ("Pricing Table", 0.52, 2225),
        ("FAQ Section", 0.38, 1627),
        ("Footer CTA", 0.22, 942),
    ]

    bar_max_w = hm_w - 140
    for i, (name, engagement, views) in enumerate(blocks):
        by = inner_y + i * 52

        draw.text((CONTENT_X + 20, by + 8), name, fill=TEXT_PRIMARY, font=F_SMALL)
        draw.text((CONTENT_X + 20, by + 24), f"{views} views", fill=TEXT_MUTED, font=F_TINY)

        # Gradient bar: red -> yellow -> green based on engagement
        bar_x = CONTENT_X + 130
        bar_w = int(bar_max_w * engagement)
        if engagement > 0.7:
            bar_color = SUCCESS
        elif engagement > 0.4:
            bar_color = WARNING
        else:
            bar_color = ERROR
        rounded_rect(draw, [bar_x, by + 6, bar_x + bar_w, by + 30], fill=bar_color, radius=4)
        draw.text((bar_x + bar_w + 8, by + 10), f"{int(engagement * 100)}%", fill=bar_color, font=F_SMALL_BOLD)

    # Experiment comparison panel
    exp_x = CONTENT_X + hm_w + 20
    exp_w = CONTENT_W - hm_w - 20
    inner_y2 = draw_card(draw, exp_x, cy, exp_w, 380, "A/B Experiments")

    experiments = [
        ("CTA Color Test", "Variant B", "+12%", SUCCESS),
        ("Hero Copy", "Variant A", "+5%", SUCCESS),
        ("Pricing Layout", "Control", "0%", TEXT_MUTED),
        ("Nav Style", "Running", "...", WARNING),
    ]
    for i, (name, winner, lift, color) in enumerate(experiments):
        ey = inner_y2 + i * 72

        draw.text((exp_x + 16, ey), name, fill=TEXT_PRIMARY, font=F_BODY_BOLD)
        draw.text((exp_x + 16, ey + 22), f"Winner: {winner}", fill=TEXT_SECONDARY, font=F_SMALL)

        # Lift badge
        if lift != "...":
            draw_badge(draw, exp_x + 16, ey + 44, lift, color)
        else:
            draw_badge(draw, exp_x + 16, ey + 44, "In Progress", WARNING)

    img.save(OUT_DIR + "10-analytics.png")
    print("  10-analytics.png")


# === MAIN ===
if __name__ == "__main__":
    print("Generating Sigil CMS product tour screenshots...")
    gen_dashboard()
    gen_sites()
    gen_design_playground()
    gen_font_browser()
    gen_block_editor()
    gen_plugins()
    gen_commerce()
    gen_booking()
    gen_community()
    gen_analytics()
    print(f"\nDone! All screenshots saved to {OUT_DIR}")
