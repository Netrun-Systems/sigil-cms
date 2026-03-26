#!/usr/bin/env python3
"""
Sigil CMS Feature Tour v3 — Generate 6 additional screenshots (scenes 16-21).
Covers: Site Cloning, Subdomain Routing, Block Templates, Security/2FA/Audit,
Data Transfer, and POS System.
"""

import json
import os
from PIL import Image, ImageDraw, ImageFont

# === CONSTANTS (same as v2) ===
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
OUT_DIR = "/data/workspace/github/netrun-cms/studiocast/v3/screenshots/"
SCRIPT_PATH = "/data/workspace/github/netrun-cms/studiocast/v3/additional_script.json"

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


# === HELPERS (same as v2) ===
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
# SCENE 16: Site Cloning & Bulk Provisioning (1920x1080)
# ============================================================
def scene_16_cloning():
    img, d = new_image()
    draw_sidebar(d, "Sites & Domains")
    cy = draw_topbar(d, "Site Cloning & Bulk Provisioning", "Admin / Sites / Clone")

    # --- Top section: Clone a site ---
    d.text((CONTENT_X, cy), "Clone Site", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 30

    # Source site card
    src_x = CONTENT_X
    src_w = 580
    rr(d, [src_x, cy, src_x + src_w, cy + 130], fill=CARD_BG, outline=CARD_BORDER, radius=10)
    d.text((src_x + 20, cy + 14), "Netrun Systems", fill=TEXT_PRIMARY, font=F_HEADING)
    pill(d, [src_x + 210, cy + 16, src_x + 290, cy + 34], SUCCESS, "Published")
    d.text((src_x + 20, cy + 44), "netrunsystems.com", fill=PRIMARY, font=F_BODY)
    d.text((src_x + 20, cy + 68), "24 pages  |  340 MB  |  12 blocks", fill=TEXT_SECONDARY, font=F_SMALL)
    # Clone button highlighted
    btn_x = src_x + 20
    btn_y = cy + 92
    rr(d, [btn_x, btn_y, btn_x + 110, btn_y + 30], fill=PRIMARY, radius=15)
    d.text((btn_x + 18, btn_y + 7), "Clone Site", fill="#0a0a0a", font=F_BODY_BOLD)
    # Highlight glow around clone button
    rr(d, [btn_x - 4, btn_y - 4, btn_x + 114, btn_y + 34], outline=PRIMARY, radius=17, width=2)

    # Arrow
    arrow_x = src_x + src_w + 20
    arrow_y = cy + 60
    d.line([arrow_x, arrow_y, arrow_x + 80, arrow_y], fill=PRIMARY, width=3)
    d.polygon([(arrow_x + 80, arrow_y - 8), (arrow_x + 95, arrow_y), (arrow_x + 80, arrow_y + 8)], fill=PRIMARY)

    # Cloned site card
    clone_x = arrow_x + 110
    rr(d, [clone_x, cy, clone_x + src_w, cy + 130], fill=CARD_BG, outline=PRIMARY, radius=10, width=2)
    d.text((clone_x + 20, cy + 14), "Netrun Systems (Copy)", fill=TEXT_PRIMARY, font=F_HEADING)
    pill(d, [clone_x + 300, cy + 16, clone_x + 360, cy + 34], WARNING, "Draft")
    d.text((clone_x + 20, cy + 44), "No domain assigned", fill=TEXT_MUTED, font=F_BODY)
    d.text((clone_x + 20, cy + 68), "24 pages  |  340 MB  |  12 blocks", fill=TEXT_SECONDARY, font=F_SMALL)
    pill(d, [clone_x + 20, cy + 96, clone_x + 120, cy + 114], INFO, "Just Cloned", text_color="#fff")

    cy += 160

    # --- Bottom section: Bulk Provisioning ---
    d.text((CONTENT_X, cy), "Bulk Provision Sites", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 30

    bulk_w = CONTENT_W
    rr(d, [CONTENT_X, cy, CONTENT_X + bulk_w, cy + 380], fill=CARD_BG, outline=CARD_BORDER, radius=10)

    bx = CONTENT_X + 24
    by = cy + 16

    d.text((bx, by), "Create multiple tenant sites at once", fill=TEXT_SECONDARY, font=F_SMALL)
    by += 28

    # Tenant name input rows
    tenants = [
        ("acme-corp", "Acme Corporation", SUCCESS, "Ready"),
        ("blueiron", "BlueIron Capital", SUCCESS, "Ready"),
        ("west-coast-msp", "West Coast MSP", SUCCESS, "Ready"),
        ("davis-law", "Davis Law Group", WARNING, "Pending"),
        ("pinnacle-health", "Pinnacle Health", WARNING, "Pending"),
    ]
    for slug, name, color, status in tenants:
        # Input field
        rr(d, [bx, by, bx + 200, by + 32], fill="#0a0a0a", outline=CARD_BORDER, radius=6)
        d.text((bx + 10, by + 8), slug, fill=TEXT_PRIMARY, font=F_BODY)
        # Display name
        rr(d, [bx + 216, by, bx + 480, by + 32], fill="#0a0a0a", outline=CARD_BORDER, radius=6)
        d.text((bx + 226, by + 8), name, fill=TEXT_SECONDARY, font=F_BODY)
        # Status pill
        pill(d, [bx + 496, by + 4, bx + 570, by + 28], color, status, text_color="#fff" if color == SUCCESS else "#0a0a0a")
        by += 42

    # Progress bar
    by += 12
    d.text((bx, by), "Provisioning Progress", fill=TEXT_SECONDARY, font=F_SMALL_BOLD)
    by += 22
    bar_w = 700
    rr(d, [bx, by, bx + bar_w, by + 24], fill="#0a0a0a", radius=12)
    filled = int(bar_w * 0.6)
    rr(d, [bx, by, bx + filled, by + 24], fill=PRIMARY, radius=12)
    d.text((bx + filled + 12, by + 4), "3 / 5 complete", fill=TEXT_SECONDARY, font=F_SMALL)

    by += 44
    # Action buttons
    rr(d, [bx, by, bx + 160, by + 36], fill=PRIMARY, radius=18)
    d.text((bx + 16, by + 9), "Provision All", fill="#0a0a0a", font=F_BODY_BOLD)
    rr(d, [bx + 180, by, bx + 320, by + 36], outline=CARD_BORDER, radius=18)
    d.text((bx + 200, by + 9), "Add Row", fill=TEXT_SECONDARY, font=F_BODY)

    img.save(OUT_DIR + "16-cloning.png", optimize=True)
    print("  16-cloning.png")


# ============================================================
# SCENE 17: Subdomain Routing (1920x1080)
# ============================================================
def scene_17_subdomains():
    img, d = new_image()
    draw_sidebar(d, "Sites & Domains")
    cy = draw_topbar(d, "Subdomain Routing", "Admin / Sites / Routing")

    # --- Site cards with subdomains ---
    d.text((CONTENT_X, cy), "Auto-Generated Subdomains", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 32

    sites = [
        ("Frost Portfolio", "frost.sigil.netrunsystems.com", "Published", 18, "2 hr ago"),
        ("Agency Portfolio", "portfolio.sigil.netrunsystems.com", "Published", 32, "15 min ago"),
        ("Agency Client", "agency-client.sigil.netrunsystems.com", "Draft", 8, "3 days ago"),
    ]

    for name, subdomain, status, pages, updated in sites:
        card_h = 90
        rr(d, [CONTENT_X, cy, CONTENT_X + CONTENT_W, cy + card_h], fill=CARD_BG, outline=CARD_BORDER, radius=10)
        d.text((CONTENT_X + 20, cy + 12), name, fill=TEXT_PRIMARY, font=F_HEADING)
        status_color = SUCCESS if status == "Published" else WARNING
        pill(d, [CONTENT_X + 20 + len(name) * 12 + 16, cy + 14, CONTENT_X + 20 + len(name) * 12 + 100, cy + 32], status_color, status)

        # Subdomain with lock icon placeholder
        d.text((CONTENT_X + 20, cy + 42), subdomain, fill=PRIMARY, font=F_BODY)
        pill(d, [CONTENT_X + 20 + len(subdomain) * 8 + 12, cy + 42, CONTENT_X + 20 + len(subdomain) * 8 + 52, cy + 58], SUCCESS, "SSL", text_color="#fff")

        # Stats
        d.text((CONTENT_X + CONTENT_W - 240, cy + 14), f"{pages} pages", fill=TEXT_SECONDARY, font=F_SMALL)
        d.text((CONTENT_X + CONTENT_W - 240, cy + 34), f"Updated {updated}", fill=TEXT_MUTED, font=F_SMALL)
        # Custom domain button
        rr(d, [CONTENT_X + CONTENT_W - 240, cy + 56, CONTENT_X + CONTENT_W - 80, cy + 76], outline=CARD_BORDER, radius=14)
        d.text((CONTENT_X + CONTENT_W - 224, cy + 58), "+ Custom Domain", fill=TEXT_SECONDARY, font=F_SMALL)

        cy += card_h + 12

    cy += 20

    # --- Host Header Resolution Diagram ---
    d.text((CONTENT_X, cy), "Host Header Resolution Flow", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 36

    diagram_y = cy
    box_w = 200
    box_h = 60

    # Step boxes
    steps = [
        ("Browser Request", INFO),
        ("Host Header", PURPLE),
        ("Tenant Lookup", WARNING),
        ("Site Content", SUCCESS),
    ]
    labels_below = [
        "GET /about",
        "frost.sigil.\nnetrunsystems.com",
        "tenants WHERE\nsubdomain = 'frost'",
        "Render site pages\n& theme",
    ]

    step_x = CONTENT_X + 40
    for i, (label, color) in enumerate(steps):
        bx = step_x + i * (box_w + 80)
        rr(d, [bx, diagram_y, bx + box_w, diagram_y + box_h], fill=CARD_BG, outline=color, radius=10, width=2)
        # Center text
        bbox = F_BODY_BOLD.getbbox(label)
        tw = bbox[2] - bbox[0]
        d.text((bx + (box_w - tw) // 2, diagram_y + 20), label, fill=color, font=F_BODY_BOLD)

        # Arrow to next
        if i < len(steps) - 1:
            ax = bx + box_w + 8
            ay = diagram_y + box_h // 2
            d.line([ax, ay, ax + 60, ay], fill=TEXT_MUTED, width=2)
            d.polygon([(ax + 60, ay - 6), (ax + 72, ay), (ax + 60, ay + 6)], fill=TEXT_MUTED)

        # Label below
        d.text((bx + 10, diagram_y + box_h + 10), labels_below[i], fill=TEXT_SECONDARY, font=F_SMALL)

    cy = diagram_y + box_h + 70

    # Routing rules card
    rr(d, [CONTENT_X, cy, CONTENT_X + CONTENT_W, cy + 160], fill=CARD_BG, outline=CARD_BORDER, radius=10)
    d.text((CONTENT_X + 20, cy + 14), "Routing Configuration", fill=TEXT_PRIMARY, font=F_SUBHEADING)
    rules = [
        ("Wildcard DNS:", "*.sigil.netrunsystems.com  ->  Load Balancer IP"),
        ("Default pattern:", "{slug}.sigil.netrunsystems.com"),
        ("Custom domain:", "CNAME to sigil.netrunsystems.com + TXT verify"),
        ("Fallback:", "Unknown subdomain -> 404 branded page"),
    ]
    ry = cy + 42
    for key, val in rules:
        d.text((CONTENT_X + 30, ry), key, fill=TEXT_MUTED, font=F_SMALL_BOLD)
        d.text((CONTENT_X + 180, ry), val, fill=TEXT_SECONDARY, font=F_SMALL)
        ry += 26

    img.save(OUT_DIR + "17-subdomains.png", optimize=True)
    print("  17-subdomains.png")


# ============================================================
# SCENE 18: Block Templates (1920x1080)
# ============================================================
def scene_18_templates():
    img, d = new_image()
    draw_sidebar(d, "Pages")
    cy = draw_topbar(d, "Page Editor — Block Templates", "Admin / Pages / Homepage / Edit")

    # Left side: Page editor with blocks
    editor_w = 860
    editor_x = CONTENT_X

    # Block list header
    d.text((editor_x, cy), "Content Blocks", fill=TEXT_PRIMARY, font=F_SUBHEADING)
    rr(d, [editor_x + 160, cy - 2, editor_x + 260, cy + 22], fill=PRIMARY, radius=12)
    d.text((editor_x + 172, cy + 2), "+ Add Block", fill="#0a0a0a", font=F_SMALL_BOLD)
    cy += 34

    # Existing blocks in editor
    blocks = [
        ("Hero", "hero-dark", "Build Anything. Own Everything.", True),
        ("Pricing Table", "pricing-3tier", "3 tiers: Starter, Pro, Enterprise", False),
        ("FAQ", "faq-collapse", "8 questions, collapsible", False),
        ("CTA", "cta-gradient", "Get Started — Free forever", False),
    ]

    for name, template_id, summary, expanded in blocks:
        bh = 120 if expanded else 50
        rr(d, [editor_x, cy, editor_x + editor_w, cy + bh], fill=CARD_BG, outline=CARD_BORDER, radius=8)

        # Drag handle
        for dot_row in range(3):
            for dot_col in range(2):
                dx = editor_x + 12 + dot_col * 6
                dy = cy + 16 + dot_row * 6
                d.ellipse([dx, dy, dx + 3, dy + 3], fill=TEXT_MUTED)

        d.text((editor_x + 34, cy + 12), name, fill=TEXT_PRIMARY, font=F_BODY_BOLD)
        pill(d, [editor_x + 34 + len(name) * 9 + 10, cy + 12, editor_x + 34 + len(name) * 9 + 100, cy + 28], PURPLE, template_id, text_color="#fff")

        if expanded:
            d.text((editor_x + 34, cy + 38), summary, fill=TEXT_SECONDARY, font=F_BODY)
            # Save as Template button on expanded block
            stb_x = editor_x + 34
            stb_y = cy + 68
            rr(d, [stb_x, stb_y, stb_x + 170, stb_y + 30], outline=PRIMARY, radius=15, width=2)
            d.text((stb_x + 14, stb_y + 7), "Save as Template", fill=PRIMARY, font=F_SMALL_BOLD)
            # Apply Template dropdown
            atb_x = stb_x + 186
            rr(d, [atb_x, stb_y, atb_x + 160, stb_y + 30], outline=CARD_BORDER, radius=15)
            d.text((atb_x + 14, stb_y + 7), "Apply Template  v", fill=TEXT_SECONDARY, font=F_SMALL_BOLD)
        else:
            d.text((editor_x + 34, cy + 30), summary, fill=TEXT_MUTED, font=F_SMALL)

        cy += bh + 8

    # Right side: Template library panel
    panel_x = editor_x + editor_w + 20
    panel_w = CONTENT_W - editor_w - 20
    panel_y = draw_topbar(d, "", y=20) - 14  # align with top

    rr(d, [panel_x, 80, panel_x + panel_w, H_STD - 30], fill=CARD_BG, outline=CARD_BORDER, radius=10)
    d.text((panel_x + 16, 94), "Template Library", fill=TEXT_PRIMARY, font=F_SUBHEADING)
    d.text((panel_x + 16, 118), f"4 templates available", fill=TEXT_MUTED, font=F_SMALL)

    # Search bar
    rr(d, [panel_x + 16, 140, panel_x + panel_w - 16, 168], fill="#0a0a0a", outline=CARD_BORDER, radius=6)
    d.text((panel_x + 28, 148), "Search templates...", fill=TEXT_MUTED, font=F_SMALL)

    # Template cards
    templates = [
        ("Hero - Dark", "Full-width hero with gradient overlay", PRIMARY, "5 uses"),
        ("Pricing - 3 Tier", "Starter / Pro / Enterprise columns", INFO, "3 uses"),
        ("FAQ - Collapsible", "Accordion Q&A with smooth toggle", PURPLE, "8 uses"),
        ("CTA - Gradient", "Call to action with gradient background", PINK, "12 uses"),
    ]

    ty = 184
    for tname, tdesc, tcolor, tusage in templates:
        rr(d, [panel_x + 16, ty, panel_x + panel_w - 16, ty + 110], fill="#0d0d0d", outline=CARD_BORDER, radius=8)
        # Color accent bar
        d.rectangle([panel_x + 16, ty, panel_x + 22, ty + 110], fill=tcolor)
        d.text((panel_x + 34, ty + 12), tname, fill=TEXT_PRIMARY, font=F_BODY_BOLD)
        d.text((panel_x + 34, ty + 34), tdesc, fill=TEXT_SECONDARY, font=F_SMALL)
        d.text((panel_x + 34, ty + 56), tusage, fill=TEXT_MUTED, font=F_TINY)
        # Apply button
        rr(d, [panel_x + 34, ty + 74, panel_x + 120, ty + 98], fill=tcolor, radius=12)
        d.text((panel_x + 50, ty + 78), "Apply", fill="#0a0a0a", font=F_SMALL_BOLD)
        # Preview button
        rr(d, [panel_x + 130, ty + 74, panel_x + panel_w - 30, ty + 98], outline=CARD_BORDER, radius=12)
        d.text((panel_x + 146, ty + 78), "Preview", fill=TEXT_SECONDARY, font=F_SMALL_BOLD)
        ty += 120

    img.save(OUT_DIR + "18-templates.png", optimize=True)
    print("  18-templates.png")


# ============================================================
# SCENE 19: Security - 2FA & Audit (1920x2400 TALL)
# ============================================================
def scene_19_security():
    h = 2400
    img, d = new_image(h)
    draw_sidebar(d, "Dashboard", h)
    cy = draw_topbar(d, "Security — 2FA & Audit Log", "Admin / Security")

    # === TOP SECTION: 2FA Setup ===
    d.text((CONTENT_X, cy), "Two-Factor Authentication", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 32

    tfa_card_h = 440
    rr(d, [CONTENT_X, cy, CONTENT_X + CONTENT_W, cy + tfa_card_h], fill=CARD_BG, outline=CARD_BORDER, radius=10)

    # Left: QR code placeholder
    qr_x = CONTENT_X + 40
    qr_y = cy + 30
    qr_size = 200
    rr(d, [qr_x, qr_y, qr_x + qr_size, qr_y + qr_size], fill="#ffffff", radius=4)
    # Draw a fake QR pattern
    import random
    random.seed(42)
    cell = 8
    margin = 10
    for row in range(22):
        for col in range(22):
            if random.random() > 0.5:
                cx = qr_x + margin + col * cell
                cy2 = qr_y + margin + row * cell
                d.rectangle([cx, cy2, cx + cell - 1, cy2 + cell - 1], fill="#0a0a0a")
    # QR finder patterns (corners)
    for (px, py) in [(qr_x + margin, qr_y + margin), (qr_x + margin + 15 * cell, qr_y + margin), (qr_x + margin, qr_y + margin + 15 * cell)]:
        d.rectangle([px, py, px + 6 * cell, py + 6 * cell], fill="#0a0a0a")
        d.rectangle([px + cell, py + cell, px + 5 * cell, py + 5 * cell], fill="#ffffff")
        d.rectangle([px + 2 * cell, py + 2 * cell, px + 4 * cell, py + 4 * cell], fill="#0a0a0a")

    d.text((qr_x + 20, qr_y + qr_size + 12), "Scan with authenticator app", fill=TEXT_SECONDARY, font=F_SMALL)
    d.text((qr_x, qr_y + qr_size + 32), "Manual key: JBSWY3DPEHPK3PXP", fill=TEXT_MUTED, font=F_TINY)

    # Right: Setup instructions and backup codes
    info_x = qr_x + qr_size + 60
    info_y = cy + 30
    d.text((info_x, info_y), "Setup Instructions", fill=TEXT_PRIMARY, font=F_SUBHEADING)
    info_y += 28
    steps = [
        "1. Install Google Authenticator or Authy",
        "2. Scan the QR code with your app",
        "3. Enter the 6-digit code below to verify",
        "4. Store backup codes in a safe location",
    ]
    for step in steps:
        d.text((info_x, info_y), step, fill=TEXT_SECONDARY, font=F_BODY)
        info_y += 24

    # Verification code input
    info_y += 12
    d.text((info_x, info_y), "Verification Code", fill=TEXT_MUTED, font=F_SMALL_BOLD)
    info_y += 20
    rr(d, [info_x, info_y, info_x + 240, info_y + 40], fill="#0a0a0a", outline=CARD_BORDER, radius=8)
    d.text((info_x + 12, info_y + 10), "_ _ _ _ _ _", fill=TEXT_MUTED, font=F_HEADING)

    # Enable 2FA button
    info_y += 56
    rr(d, [info_x, info_y, info_x + 160, info_y + 42], fill=PRIMARY, radius=20)
    d.text((info_x + 24, info_y + 11), "Enable 2FA", fill="#0a0a0a", font=F_BODY_BOLD)

    # Backup codes section
    bc_y = cy + 270
    d.text((CONTENT_X + 40, bc_y), "Backup Recovery Codes", fill=TEXT_PRIMARY, font=F_SUBHEADING)
    d.text((CONTENT_X + 280, bc_y + 2), "(save these — shown only once)", fill=WARNING, font=F_SMALL)
    bc_y += 28
    codes = [
        "a7f2-k9m3-p4x1", "b8d6-n2w5-q7y9",
        "c3e1-j6t8-r5v4", "d9g4-l1s7-u2z6",
        "e5h8-m3q2-w9a7", "f1k6-p5x4-y3b8",
        "g7n2-r8d1-z6c5", "h4t9-s2f3-e1j7",
    ]
    col_x = CONTENT_X + 50
    for i, code in enumerate(codes):
        cx = col_x + (i % 4) * 220
        cy3 = bc_y + (i // 4) * 30
        rr(d, [cx, cy3, cx + 200, cy3 + 24], fill="#0a0a0a", outline=CARD_BORDER, radius=4)
        d.text((cx + 10, cy3 + 5), code, fill=TEXT_PRIMARY, font=font(13))

    cy = cy + tfa_card_h + 40

    # === BOTTOM SECTION: Audit Log ===
    d.text((CONTENT_X, cy), "Audit Log", fill=TEXT_PRIMARY, font=F_HEADING)
    cy += 8
    d.text((CONTENT_X, cy + 22), "Complete record of all admin actions", fill=TEXT_SECONDARY, font=F_SMALL)
    cy += 48

    # Filters
    filters = ["All Actions", "Auth", "Pages", "Themes", "Users", "Media"]
    fx = CONTENT_X
    for f_label in filters:
        fw = len(f_label) * 8 + 24
        active = f_label == "All Actions"
        rr(d, [fx, cy, fx + fw, cy + 28], fill=PRIMARY if active else None, outline=CARD_BORDER if not active else None, radius=14)
        d.text((fx + 12, cy + 6), f_label, fill="#0a0a0a" if active else TEXT_SECONDARY, font=F_SMALL_BOLD)
        fx += fw + 8
    cy += 44

    # Audit table
    cols = ["Timestamp", "User", "Action", "Resource", "IP Address"]
    widths = [220, 200, 200, 340, 200]
    cy = draw_table_header(d, CONTENT_X, cy, cols, widths)

    audit_rows = [
        ("2026-03-26 14:32:01", "daniel@netrun.net", "page.updated", "/sites/netrun/pages/about", "72.134.89.12"),
        ("2026-03-26 14:28:44", "daniel@netrun.net", "theme.saved", "/sites/netrun/themes/dark-v2", "72.134.89.12"),
        ("2026-03-26 14:15:22", "admin@agency.co", "user.login", "admin@agency.co (2FA)", "98.210.45.67"),
        ("2026-03-26 13:58:10", "daniel@netrun.net", "media.uploaded", "hero-banner-2026.webp (2.4MB)", "72.134.89.12"),
        ("2026-03-26 13:45:33", "editor@agency.co", "page.created", "/sites/client-a/pages/services", "98.210.45.67"),
        ("2026-03-26 13:30:01", "system", "backup.completed", "Full backup: 1.2GB compressed", "127.0.0.1"),
        ("2026-03-26 12:55:18", "daniel@netrun.net", "plugin.activated", "resonance-analytics", "72.134.89.12"),
        ("2026-03-26 12:40:44", "admin@agency.co", "user.invited", "editor@agency.co (role: Editor)", "98.210.45.67"),
        ("2026-03-26 12:22:09", "system", "ssl.renewed", "frost.sigil.netrunsystems.com", "127.0.0.1"),
        ("2026-03-26 11:58:33", "daniel@netrun.net", "block.deleted", "old-hero (Hero block)", "72.134.89.12"),
        ("2026-03-26 11:45:01", "editor@agency.co", "page.published", "/sites/client-a/pages/home", "98.210.45.67"),
        ("2026-03-26 11:30:22", "system", "cron.cleanup", "Deleted 14 expired sessions", "127.0.0.1"),
        ("2026-03-26 11:12:55", "daniel@netrun.net", "theme.saved", "/sites/netrun/themes/dark-v2", "72.134.89.12"),
        ("2026-03-26 10:58:44", "admin@agency.co", "user.login", "admin@agency.co (2FA)", "98.210.45.67"),
        ("2026-03-26 10:45:10", "daniel@netrun.net", "site.created", "new-client-project", "72.134.89.12"),
        ("2026-03-26 10:30:02", "system", "webhook.fired", "page.published -> https://hooks.slack.com", "127.0.0.1"),
        ("2026-03-26 10:15:33", "editor@agency.co", "media.uploaded", "logo-final-v3.svg (48KB)", "98.210.45.67"),
        ("2026-03-26 09:58:21", "daniel@netrun.net", "block.reordered", "/sites/netrun/pages/home", "72.134.89.12"),
        ("2026-03-26 09:45:44", "admin@agency.co", "page.updated", "/sites/client-b/pages/pricing", "98.210.45.67"),
        ("2026-03-26 09:30:11", "system", "backup.started", "Scheduled daily backup", "127.0.0.1"),
        ("2026-03-26 09:15:08", "daniel@netrun.net", "user.login", "daniel@netrun.net (2FA)", "72.134.89.12"),
        ("2026-03-26 09:00:00", "system", "cron.analytics", "Aggregated 24h resonance scores", "127.0.0.1"),
    ]

    action_colors = {
        "page.updated": INFO, "theme.saved": PURPLE, "user.login": SUCCESS,
        "media.uploaded": WARNING, "page.created": PRIMARY, "backup.completed": SUCCESS,
        "plugin.activated": PRIMARY, "user.invited": INFO, "ssl.renewed": SUCCESS,
        "block.deleted": ERROR, "page.published": SUCCESS, "cron.cleanup": TEXT_MUTED,
        "site.created": PRIMARY, "webhook.fired": PURPLE, "block.reordered": INFO,
        "backup.started": WARNING, "cron.analytics": TEXT_MUTED,
    }

    for row in audit_rows:
        ts, user, action, resource, ip = row
        ac = action_colors.get(action, TEXT_SECONDARY)
        row_colors = [TEXT_MUTED, TEXT_SECONDARY, ac, TEXT_SECONDARY, TEXT_MUTED]
        cy = draw_table_row(d, CONTENT_X, cy, [ts, user, action, resource, ip], widths, row_colors)

    # Pagination
    cy += 16
    d.text((CONTENT_X + 16, cy), "Showing 1-22 of 1,847 entries", fill=TEXT_MUTED, font=F_SMALL)
    pg_x = CONTENT_X + CONTENT_W - 300
    for i, pg in enumerate(["< Prev", "1", "2", "3", "...", "84", "Next >"]):
        pw = len(pg) * 8 + 16
        active_pg = pg == "1"
        rr(d, [pg_x, cy - 2, pg_x + pw, cy + 22], fill=PRIMARY if active_pg else None, outline=CARD_BORDER if not active_pg else None, radius=4)
        d.text((pg_x + 8, cy + 2), pg, fill="#0a0a0a" if active_pg else TEXT_SECONDARY, font=F_SMALL)
        pg_x += pw + 6

    img.save(OUT_DIR + "19-security.png", optimize=True)
    print("  19-security.png")


# ============================================================
# SCENE 20: Data Transfer (1920x1080)
# ============================================================
def scene_20_transfer():
    img, d = new_image()
    draw_sidebar(d, "Migration Tool")
    cy = draw_topbar(d, "Data Transfer — Export & Import", "Admin / System / Transfer")

    # Two panels side by side
    panel_w = (CONTENT_W - 30) // 2

    # === LEFT: Export Panel ===
    export_x = CONTENT_X
    rr(d, [export_x, cy, export_x + panel_w, cy + 620], fill=CARD_BG, outline=CARD_BORDER, radius=10)

    ex = export_x + 24
    ey = cy + 20
    d.text((ex, ey), "Export Site Data", fill=TEXT_PRIMARY, font=F_HEADING)
    ey += 32

    d.text((ex, ey), "Select content to export:", fill=TEXT_SECONDARY, font=F_SMALL)
    ey += 28

    # Checkboxes
    export_items = [
        ("Pages", True, "24 pages, 86 blocks"),
        ("Content Blocks", True, "86 blocks across all pages"),
        ("Themes", True, "3 themes, 1 active"),
        ("Media Library", True, "147 files, 340 MB"),
        ("Settings", True, "Site config, DNS, SEO"),
        ("Users & Roles", False, "8 users, 3 roles"),
        ("Analytics Data", False, "90 days of resonance data"),
        ("Community Posts", False, "342 threads, 1.2K replies"),
    ]

    for label, checked, detail in export_items:
        # Checkbox
        rr(d, [ex, ey, ex + 20, ey + 20], fill=PRIMARY if checked else "#0a0a0a", outline=CARD_BORDER if not checked else None, radius=4)
        if checked:
            d.text((ex + 3, ey + 1), "v", fill="#0a0a0a", font=F_BODY_BOLD)
        d.text((ex + 30, ey + 2), label, fill=TEXT_PRIMARY, font=F_BODY)
        d.text((ex + 30 + len(label) * 9 + 12, ey + 4), detail, fill=TEXT_MUTED, font=F_SMALL)
        ey += 32

    # Format dropdown
    ey += 16
    d.text((ex, ey), "Export Format", fill=TEXT_MUTED, font=F_SMALL_BOLD)
    ey += 20
    rr(d, [ex, ey, ex + 240, ey + 38], fill="#0a0a0a", outline=CARD_BORDER, radius=8)
    d.text((ex + 12, ey + 10), "JSON (structured)", fill=TEXT_PRIMARY, font=F_BODY)
    d.text((ex + 200, ey + 12), "v", fill=TEXT_MUTED, font=F_BODY)
    # Dropdown options hint
    ey += 44
    d.text((ex, ey), "Options: JSON / ZIP (with media) / CSV (tables only)", fill=TEXT_MUTED, font=F_TINY)

    # Export button
    ey += 32
    rr(d, [ex, ey, ex + 180, ey + 44], fill=PRIMARY, radius=22)
    d.text((ex + 24, ey + 12), "Export Site", fill="#0a0a0a", font=F_BODY_BOLD)

    # Estimated size
    d.text((ex + 200, ey + 14), "Est. size: 12.4 MB", fill=TEXT_MUTED, font=F_SMALL)

    # Previous exports
    ey += 64
    d.text((ex, ey), "Recent Exports", fill=TEXT_SECONDARY, font=F_SMALL_BOLD)
    ey += 22
    prev_exports = [
        ("netrun-full-2026-03-25.zip", "14.2 MB", "Yesterday"),
        ("netrun-pages-2026-03-20.json", "1.8 MB", "6 days ago"),
    ]
    for fname, fsize, when in prev_exports:
        d.text((ex, ey), fname, fill=PRIMARY, font=F_SMALL)
        d.text((ex + 360, ey), fsize, fill=TEXT_MUTED, font=F_SMALL)
        d.text((ex + 440, ey), when, fill=TEXT_MUTED, font=F_TINY)
        ey += 22

    # === RIGHT: Import Panel ===
    import_x = export_x + panel_w + 30
    rr(d, [import_x, cy, import_x + panel_w, cy + 620], fill=CARD_BG, outline=CARD_BORDER, radius=10)

    ix = import_x + 24
    iy = cy + 20
    d.text((ix, iy), "Import Site Data", fill=TEXT_PRIMARY, font=F_HEADING)
    iy += 32

    d.text((ix, iy), "Upload a Sigil export file:", fill=TEXT_SECONDARY, font=F_SMALL)
    iy += 28

    # Drag-drop zone
    drop_h = 180
    rr(d, [ix, iy, ix + panel_w - 48, iy + drop_h], fill="#0d0d0d", outline=PRIMARY_DIM, radius=10, width=2)
    # Dashed border effect (draw inner dashed rectangle)
    for dash_x in range(ix + 10, ix + panel_w - 58, 20):
        d.line([dash_x, iy + 4, dash_x + 10, iy + 4], fill=PRIMARY_DIM, width=1)
        d.line([dash_x, iy + drop_h - 4, dash_x + 10, iy + drop_h - 4], fill=PRIMARY_DIM, width=1)

    # Upload icon (simple arrow up)
    icon_cx = ix + (panel_w - 48) // 2
    icon_cy = iy + 50
    d.polygon([(icon_cx, icon_cy - 15), (icon_cx - 20, icon_cy + 5), (icon_cx + 20, icon_cy + 5)], fill=PRIMARY_DIM)
    d.rectangle([icon_cx - 6, icon_cy + 5, icon_cx + 6, icon_cy + 30], fill=PRIMARY_DIM)

    d.text((icon_cx - 110, iy + 95), "Drag & drop .json or .zip files", fill=TEXT_SECONDARY, font=F_BODY)
    d.text((icon_cx - 80, iy + 120), "or click to browse files", fill=TEXT_MUTED, font=F_SMALL)
    d.text((icon_cx - 60, iy + 145), "Max file size: 500 MB", fill=TEXT_MUTED, font=F_TINY)

    iy += drop_h + 24

    # Import options
    d.text((ix, iy), "Import Options", fill=TEXT_SECONDARY, font=F_SMALL_BOLD)
    iy += 24
    options = [
        ("Merge with existing", True, "Add new content, skip duplicates"),
        ("Overwrite existing", False, "Replace matching content by slug"),
        ("Import as new site", False, "Create a fresh site from export"),
    ]
    for opt, selected, desc in options:
        # Radio button
        d.ellipse([ix, iy, ix + 18, iy + 18], outline=PRIMARY if selected else CARD_BORDER, width=2)
        if selected:
            d.ellipse([ix + 5, iy + 5, ix + 13, iy + 13], fill=PRIMARY)
        d.text((ix + 26, iy), opt, fill=TEXT_PRIMARY, font=F_BODY)
        d.text((ix + 26, iy + 18), desc, fill=TEXT_MUTED, font=F_TINY)
        iy += 40

    # Import button
    iy += 8
    rr(d, [ix, iy, ix + 160, iy + 44], fill=INFO, radius=22)
    d.text((ix + 38, iy + 12), "Import", fill="#ffffff", font=F_BODY_BOLD)

    # Progress section
    iy += 64
    d.text((ix, iy), "Import Progress", fill=TEXT_SECONDARY, font=F_SMALL_BOLD)
    iy += 22
    rr(d, [ix, iy, ix + panel_w - 48, iy + 90], fill="#0d0d0d", outline=CARD_BORDER, radius=8)
    d.text((ix + 12, iy + 10), "netrun-full-2026-03-25.zip", fill=TEXT_PRIMARY, font=F_BODY)
    d.text((ix + 12, iy + 32), "Importing pages... (18/24)", fill=TEXT_SECONDARY, font=F_SMALL)
    # Progress bar
    bar_y = iy + 56
    rr(d, [ix + 12, bar_y, ix + panel_w - 60, bar_y + 16], fill="#0a0a0a", radius=8)
    bar_full = int((panel_w - 72) * 0.75)
    rr(d, [ix + 12, bar_y, ix + 12 + bar_full, bar_y + 16], fill=SUCCESS, radius=8)
    d.text((ix + panel_w - 56, bar_y), "75%", fill=SUCCESS, font=F_SMALL_BOLD)

    img.save(OUT_DIR + "20-transfer.png", optimize=True)
    print("  20-transfer.png")


# ============================================================
# SCENE 21: POS System (1920x1080)
# ============================================================
def scene_21_pos():
    img, d = new_image()
    draw_sidebar(d, "Products (Stripe)")
    cy = draw_topbar(d, "Point of Sale", "Admin / Store / POS")

    # Two main areas: product grid (left) + cart (right)
    grid_w = 860
    cart_w = CONTENT_W - grid_w - 20

    grid_x = CONTENT_X
    cart_x = grid_x + grid_w + 20

    # === LEFT: Product Grid ===
    # Category tabs
    categories = ["All Items", "Merch", "Digital", "Services", "Events"]
    tx = grid_x
    for cat in categories:
        cw = len(cat) * 8 + 24
        active = cat == "All Items"
        rr(d, [tx, cy, tx + cw, cy + 28], fill=PRIMARY if active else None, outline=CARD_BORDER if not active else None, radius=14)
        d.text((tx + 12, cy + 6), cat, fill="#0a0a0a" if active else TEXT_SECONDARY, font=F_SMALL_BOLD)
        tx += cw + 8
    cy += 44

    # Product grid (3x4)
    products = [
        ("Netrun Tee", "$34.99", "merch", True),
        ("Logo Hoodie", "$59.99", "merch", True),
        ("Dev Stickers", "$9.99", "merch", True),
        ("Pro License", "$149.00", "digital", True),
        ("Starter License", "$49.00", "digital", True),
        ("API Access Key", "$29.00/mo", "digital", True),
        ("1hr Consult", "$175.00", "service", True),
        ("Site Audit", "$350.00", "service", True),
        ("Workshop Pass", "$75.00", "event", True),
        ("Sigil Mug", "$19.99", "merch", True),
        ("Brand Kit", "$24.99", "digital", False),
        ("Deploy Help", "$125.00", "service", True),
    ]

    cat_colors = {"merch": PINK, "digital": INFO, "service": PURPLE, "event": WARNING}

    cols = 3
    card_w = (grid_w - 20) // cols
    card_h = 130

    for i, (pname, price, cat, in_stock) in enumerate(products):
        col = i % cols
        row = i // cols
        px = grid_x + col * (card_w + 10)
        py = cy + row * (card_h + 10)

        rr(d, [px, py, px + card_w, py + card_h], fill=CARD_BG, outline=CARD_BORDER, radius=10)

        # Category dot
        d.ellipse([px + 14, py + 14, px + 24, py + 24], fill=cat_colors[cat])

        # Product image placeholder
        rr(d, [px + 14, py + 32, px + card_w - 14, py + 72], fill="#0d0d0d", radius=6)
        d.text((px + card_w // 2 - 20, py + 44), pname[:8], fill=TEXT_MUTED, font=F_TINY)

        # Name & price
        d.text((px + 14, py + 80), pname, fill=TEXT_PRIMARY, font=F_BODY_BOLD)
        d.text((px + 14, py + 100), price, fill=PRIMARY, font=F_BODY)

        if not in_stock:
            pill(d, [px + card_w - 80, py + 100, px + card_w - 14, py + 118], ERROR, "Out", text_color="#fff")

    # === RIGHT: Cart / Order Panel ===
    rr(d, [cart_x, cy - 44, cart_x + cart_w, H_STD - 30], fill=CARD_BG, outline=CARD_BORDER, radius=10)

    ox = cart_x + 16
    oy = cy - 28
    d.text((ox, oy), "Current Order", fill=TEXT_PRIMARY, font=F_HEADING)
    d.text((ox + 170, oy + 2), "#POS-0047", fill=TEXT_MUTED, font=F_SMALL)
    oy += 30
    d.line([ox, oy, cart_x + cart_w - 16, oy], fill=CARD_BORDER, width=1)
    oy += 12

    # Cart line items
    cart_items = [
        ("Netrun Tee (L)", 1, "$34.99"),
        ("Pro License", 1, "$149.00"),
        ("1hr Consult", 2, "$350.00"),
        ("Dev Stickers", 3, "$29.97"),
    ]

    for cname, qty, subtotal in cart_items:
        d.text((ox, oy), cname, fill=TEXT_PRIMARY, font=F_BODY)
        d.text((ox, oy + 18), f"Qty: {qty}", fill=TEXT_MUTED, font=F_SMALL)
        # Right-aligned price
        bbox = F_BODY_BOLD.getbbox(subtotal)
        pw = bbox[2] - bbox[0]
        d.text((cart_x + cart_w - 24 - pw, oy + 4), subtotal, fill=TEXT_PRIMARY, font=F_BODY_BOLD)
        # Remove button
        d.text((cart_x + cart_w - 24 - pw - 50, oy + 4), "x", fill=ERROR, font=F_BODY)
        oy += 44

    # Divider
    oy += 8
    d.line([ox, oy, cart_x + cart_w - 16, oy], fill=CARD_BORDER, width=1)
    oy += 16

    # Subtotal, tax, total
    totals = [
        ("Subtotal", "$563.96", TEXT_SECONDARY),
        ("Tax (8.75%)", "$49.35", TEXT_SECONDARY),
        ("Total", "$613.31", TEXT_PRIMARY),
    ]
    for tlabel, tval, tcolor in totals:
        d.text((ox, oy), tlabel, fill=tcolor, font=F_BODY if tlabel != "Total" else F_BODY_BOLD)
        bbox = (F_BODY_BOLD if tlabel == "Total" else F_BODY).getbbox(tval)
        pw = bbox[2] - bbox[0]
        tfont = F_HEADING if tlabel == "Total" else F_BODY_BOLD
        d.text((cart_x + cart_w - 24 - pw, oy), tval, fill=PRIMARY if tlabel == "Total" else tcolor, font=tfont)
        oy += 28 if tlabel != "Total" else 20

    # Payment buttons
    oy += 30
    btn_w = (cart_w - 56) // 3
    payment_methods = [
        ("Card", PRIMARY),
        ("Cash", SUCCESS),
        ("Split", INFO),
    ]
    for i, (method, color) in enumerate(payment_methods):
        bx = ox + i * (btn_w + 10)
        btn_h = 50
        rr(d, [bx, oy, bx + btn_w, oy + btn_h], fill=color, radius=12)
        bbox = F_BODY_BOLD.getbbox(method)
        mw = bbox[2] - bbox[0]
        d.text((bx + (btn_w - mw) // 2, oy + 16), method, fill="#0a0a0a", font=F_BODY_BOLD)

    # Quick actions below payment
    oy += 68
    quick_actions = ["Discount", "Hold Order", "Clear Cart"]
    qa_x = ox
    for qa in quick_actions:
        qw = len(qa) * 8 + 20
        rr(d, [qa_x, oy, qa_x + qw, oy + 28], outline=CARD_BORDER, radius=14)
        d.text((qa_x + 10, oy + 6), qa, fill=TEXT_SECONDARY, font=F_SMALL)
        qa_x += qw + 8

    # Customer field
    oy += 44
    d.text((ox, oy), "Customer", fill=TEXT_MUTED, font=F_SMALL_BOLD)
    oy += 18
    rr(d, [ox, oy, cart_x + cart_w - 16, oy + 32], fill="#0a0a0a", outline=CARD_BORDER, radius=6)
    d.text((ox + 10, oy + 8), "Search customer or add new...", fill=TEXT_MUTED, font=F_SMALL)

    img.save(OUT_DIR + "21-pos.png", optimize=True)
    print("  21-pos.png")


# ============================================================
# ADDITIONAL SCRIPT (podcast narration)
# ============================================================
def generate_script():
    script = {
        "topics": [
            {
                "topic_title": "Site Cloning and Bulk Provisioning",
                "screenshot": "16-cloning.png",
                "dialogue": [
                    {"speaker": "HOST", "text": "Site Cloning lets you duplicate any existing site with a single click. The clone copies all pages, blocks, themes, and media into a new draft site. The original stays untouched. Below that, Bulk Provisioning creates multiple tenant sites at once. Enter five slugs and display names, hit Provision All, and Sigil spins up all five with their own isolated databases, themes, and admin users. The progress bar tracks each site as it initializes."},
                    {"speaker": "GUEST", "text": "This is an agency workflow feature. Without it, you are clicking through a site creation wizard five times, uploading the same starter template five times, configuring the same default theme five times. Clone gives you a golden template. Bulk provisioning turns a Monday morning of onboarding into a thirty-second operation. WordPress Multisite has network activation, but it does not clone an entire site config and content tree in one action."}
                ]
            },
            {
                "topic_title": "Subdomain Routing",
                "screenshot": "17-subdomains.png",
                "dialogue": [
                    {"speaker": "HOST", "text": "Every site gets an auto-generated subdomain under sigil.netrunsystems.com. Frost Portfolio resolves at frost.sigil.netrunsystems.com, the agency portfolio at portfolio.sigil.netrunsystems.com. The routing diagram shows how it works: the browser sends a request, the Host header carries the subdomain, the middleware extracts the slug, looks up the tenant in PostgreSQL, and serves that site's content and theme. Wildcard DNS handles all subdomains with a single A record."},
                    {"speaker": "GUEST", "text": "The beauty here is zero configuration per site. Create a site with slug 'frost' and it is instantly live at frost.sigil.netrunsystems.com. No DNS records to add, no SSL certificates to provision for the subdomain — the wildcard certificate covers everything. Custom domains are still supported via CNAME and TXT verification, but out of the box every site has a working URL. This eliminates the DNS propagation delay that blocks every new site launch."}
                ]
            },
            {
                "topic_title": "Block Templates",
                "screenshot": "18-templates.png",
                "dialogue": [
                    {"speaker": "HOST", "text": "Block Templates turn any configured content block into a reusable starting point. The page editor shows a Save as Template button on every expanded block. The Template Library panel on the right lists all saved templates — Hero Dark, Pricing Three Tier, FAQ Collapsible, CTA Gradient. Each shows its description, usage count, and an Apply button. Clicking Apply inserts a new block pre-filled with the template's content and settings."},
                    {"speaker": "GUEST", "text": "This is the missing piece between a blank block and a finished design. Without templates, every new page starts from scratch — you configure a hero block, set the overlay, pick the font size, set the CTA colors, every single time. With templates, your best-performing hero is one click away. The usage count tracks adoption, so you can see which templates your team actually uses. It is Figma component instances for CMS content."}
                ]
            },
            {
                "topic_title": "Security — Two-Factor Authentication and Audit Log",
                "screenshot": "19-security.png",
                "dialogue": [
                    {"speaker": "HOST", "text": "The Security page has two sections. The top is Two-Factor Authentication setup — a QR code for Google Authenticator or Authy, a manual key for backup apps, a six-digit verification field, and eight one-time backup recovery codes. Below that is the Audit Log — a filterable table of every admin action. Each row records the timestamp, user email, action type, affected resource, and source IP address. Actions range from page updates and theme saves to user logins, media uploads, plugin activations, and system operations like SSL renewals and scheduled backups."},
                    {"speaker": "GUEST", "text": "Two-factor is table stakes for any multi-tenant platform — without it, a compromised editor password exposes every site in the tenant. The backup codes are critical because people lose access to authenticator apps more often than you would expect. The audit log is where Sigil separates from most CMS platforms. WordPress has activity log plugins, but they are third-party and inconsistent. Here every action is logged at the framework level with IP tracking. For agencies managing client sites, this is compliance documentation built in."}
                ]
            },
            {
                "topic_title": "Data Transfer — Export and Import",
                "screenshot": "20-transfer.png",
                "dialogue": [
                    {"speaker": "HOST", "text": "The Data Transfer page splits into Export and Import panels. Export lets you select which content types to include — pages, blocks, themes, media, settings, users, analytics, and community data — with item counts and sizes for each. The format dropdown offers JSON for structured data, ZIP for media bundles, or CSV for tabular exports. Import has a drag-and-drop zone accepting JSON and ZIP files. Three import modes: merge with existing content, overwrite by slug, or create a fresh site from the export. A progress bar tracks the operation in real time."},
                    {"speaker": "GUEST", "text": "This closes the portability gap. Most CMS platforms make it easy to get content in and hard to get it out. Sigil exports everything — not just pages and posts, but theme configurations, block settings, media files, and even analytics data. The merge mode is what makes this practical for real workflows. You export a staging site, import it into production, and existing content stays untouched while new pages merge in. Try doing that with a WordPress XML export."}
                ]
            },
            {
                "topic_title": "Point of Sale System",
                "screenshot": "21-pos.png",
                "dialogue": [
                    {"speaker": "HOST", "text": "The Point of Sale interface is a register-style layout inside the Sigil admin. The left side is a product grid organized by category — merch, digital products, services, and events. Each card shows the product name, price, category indicator, and stock status. The right side is the order panel with line items, quantities, subtotal, tax calculation, and a prominent total. Three payment buttons at the bottom — Card for Stripe terminal, Cash, and Split for mixed payment. Quick actions handle discounts, order holds, and cart clearing."},
                    {"speaker": "GUEST", "text": "This turns Sigil from a website CMS into a full retail platform. A pop-up shop, a conference booth, a studio visit — you pull up the POS on a tablet, ring up a T-shirt and a consulting session in the same transaction. The Stripe terminal integration means card payments go through the same Stripe account as online orders. No separate Square account, no reconciliation between in-person and online sales. The customer field ties the sale to a CRM contact, so the next email campaign knows what they bought."}
                ]
            }
        ]
    }

    with open(SCRIPT_PATH, "w") as f:
        json.dump(script, f, indent=2)
    print("  additional_script.json")


# ============================================================
# MAIN
# ============================================================
if __name__ == "__main__":
    print("Generating Sigil CMS Feature Tour v3 — 6 additional scenes...")
    print("=" * 50)

    print("\nGenerating screenshots:")
    scene_16_cloning()
    scene_17_subdomains()
    scene_18_templates()
    scene_19_security()
    scene_20_transfer()
    scene_21_pos()

    print("\nGenerating podcast script:")
    generate_script()

    print("\n" + "=" * 50)
    print("Complete! Files in:")
    print(f"  Screenshots: {OUT_DIR}")
    print(f"  Script: {SCRIPT_PATH}")
