import type { IconMeta, IconRegistry } from './types';

/**
 * Icon registry with full metadata for search, filtering by category, tags,
 * and vertical. Used by the IconPicker component.
 */
const r = (
  name: string,
  label: string,
  category: IconMeta['category'],
  tags: string[],
  verticals: IconMeta['verticals']
): IconMeta => ({ name, label, category, tags, verticals });

export const ICON_REGISTRY: IconRegistry = {
  // ── General ──────────────────────────────────────────────────────────────
  Home: r('Home', 'Home', 'general', ['house', 'main', 'dashboard', 'start'], ['all']),
  Settings: r('Settings', 'Settings', 'general', ['gear', 'config', 'preferences', 'options'], ['all']),
  Search: r('Search', 'Search', 'general', ['find', 'magnify', 'lookup', 'query'], ['all']),
  Menu: r('Menu', 'Menu', 'general', ['hamburger', 'nav', 'navigation', 'sidebar'], ['all']),
  Plus: r('Plus', 'Plus', 'general', ['add', 'create', 'new', 'insert'], ['all']),
  Minus: r('Minus', 'Minus', 'general', ['remove', 'subtract', 'delete'], ['all']),
  Edit: r('Edit', 'Edit', 'general', ['pencil', 'modify', 'change', 'update'], ['all']),
  Trash: r('Trash', 'Trash', 'general', ['delete', 'remove', 'bin', 'waste'], ['all']),
  Copy: r('Copy', 'Copy', 'general', ['duplicate', 'clone', 'paste', 'clipboard'], ['all']),
  Download: r('Download', 'Download', 'general', ['save', 'export', 'get', 'fetch'], ['all']),
  Upload: r('Upload', 'Upload', 'general', ['send', 'import', 'put', 'push'], ['all']),
  Filter: r('Filter', 'Filter', 'general', ['funnel', 'refine', 'narrow', 'sort'], ['all']),
  Sort: r('Sort', 'Sort', 'general', ['order', 'arrange', 'organize', 'rank'], ['all']),
  Grid: r('Grid', 'Grid', 'general', ['layout', 'tiles', 'gallery', 'table'], ['all']),
  List: r('List', 'List', 'general', ['rows', 'items', 'lines', 'table'], ['all']),
  Maximize: r('Maximize', 'Maximize', 'general', ['fullscreen', 'expand', 'enlarge'], ['all']),
  Minimize: r('Minimize', 'Minimize', 'general', ['collapse', 'shrink', 'reduce'], ['all']),
  Eye: r('Eye', 'Eye', 'general', ['view', 'show', 'visible', 'preview', 'watch'], ['all']),
  EyeOff: r('EyeOff', 'Eye Off', 'general', ['hide', 'invisible', 'password', 'masked'], ['all']),
  ExternalLink: r('ExternalLink', 'External Link', 'general', ['open', 'navigate', 'new tab', 'url'], ['all']),
  Close: r('Close', 'Close', 'general', ['x', 'dismiss', 'cancel', 'remove'], ['all']),

  // ── Navigation ───────────────────────────────────────────────────────────
  ArrowUp: r('ArrowUp', 'Arrow Up', 'navigation', ['up', 'north', 'increase', 'scroll'], ['all']),
  ArrowDown: r('ArrowDown', 'Arrow Down', 'navigation', ['down', 'south', 'decrease', 'scroll'], ['all']),
  ArrowLeft: r('ArrowLeft', 'Arrow Left', 'navigation', ['left', 'west', 'back', 'previous'], ['all']),
  ArrowRight: r('ArrowRight', 'Arrow Right', 'navigation', ['right', 'east', 'forward', 'next'], ['all']),
  ChevronUp: r('ChevronUp', 'Chevron Up', 'navigation', ['expand', 'open', 'up', 'caret'], ['all']),
  ChevronDown: r('ChevronDown', 'Chevron Down', 'navigation', ['collapse', 'close', 'down', 'caret'], ['all']),
  ChevronLeft: r('ChevronLeft', 'Chevron Left', 'navigation', ['back', 'previous', 'left', 'caret'], ['all']),
  ChevronRight: r('ChevronRight', 'Chevron Right', 'navigation', ['forward', 'next', 'right', 'caret'], ['all']),
  ChevronsUp: r('ChevronsUp', 'Chevrons Up', 'navigation', ['scroll top', 'top', 'double up'], ['all']),
  ChevronsDown: r('ChevronsDown', 'Chevrons Down', 'navigation', ['scroll bottom', 'bottom', 'double down'], ['all']),
  CornerUpRight: r('CornerUpRight', 'Corner Up Right', 'navigation', ['redirect', 'turn', 'corner'], ['all']),
  CornerDownLeft: r('CornerDownLeft', 'Corner Down Left', 'navigation', ['enter', 'return', 'corner'], ['all']),
  MoreHorizontal: r('MoreHorizontal', 'More Horizontal', 'navigation', ['ellipsis', 'options', 'more', 'menu'], ['all']),
  MoreVertical: r('MoreVertical', 'More Vertical', 'navigation', ['kebab', 'options', 'more', 'menu'], ['all']),
  Undo: r('Undo', 'Undo', 'navigation', ['revert', 'back', 'undo', 'history'], ['all']),
  Redo: r('Redo', 'Redo', 'navigation', ['forward', 'repeat', 'redo', 'history'], ['all']),
  Move: r('Move', 'Move', 'navigation', ['drag', 'reorder', 'position', 'pan'], ['all']),
  Expand: r('Expand', 'Expand', 'navigation', ['fullscreen', 'enlarge', 'grow'], ['all']),
  Collapse: r('Collapse', 'Collapse', 'navigation', ['shrink', 'minimize', 'reduce'], ['all']),

  // ── Content ──────────────────────────────────────────────────────────────
  FileText: r('FileText', 'File Text', 'content', ['document', 'file', 'text', 'note'], ['all']),
  Image: r('Image', 'Image', 'content', ['photo', 'picture', 'img', 'media'], ['all']),
  Video: r('Video', 'Video', 'content', ['film', 'movie', 'clip', 'media', 'camera'], ['all']),
  Link: r('Link', 'Link', 'content', ['url', 'hyperlink', 'anchor', 'chain'], ['all']),
  Bold: r('Bold', 'Bold', 'content', ['strong', 'formatting', 'text'], ['publishing']),
  Italic: r('Italic', 'Italic', 'content', ['emphasis', 'formatting', 'text'], ['publishing']),
  AlignLeft: r('AlignLeft', 'Align Left', 'content', ['justify', 'align', 'paragraph', 'text'], ['publishing']),
  AlignCenter: r('AlignCenter', 'Align Center', 'content', ['center', 'align', 'paragraph'], ['publishing']),
  AlignRight: r('AlignRight', 'Align Right', 'content', ['justify', 'align', 'paragraph', 'text'], ['publishing']),
  Heading1: r('Heading1', 'Heading 1', 'content', ['h1', 'title', 'headline', 'text'], ['publishing']),
  Heading2: r('Heading2', 'Heading 2', 'content', ['h2', 'subtitle', 'section', 'text'], ['publishing']),
  Quote: r('Quote', 'Quote', 'content', ['blockquote', 'citation', 'pullquote'], ['publishing']),
  ListOrdered: r('ListOrdered', 'Ordered List', 'content', ['numbered', 'ol', 'steps', 'sequence'], ['publishing']),
  ListUnordered: r('ListUnordered', 'Unordered List', 'content', ['bullet', 'ul', 'items'], ['publishing']),
  Code: r('Code', 'Code', 'content', ['programming', 'snippet', 'developer', 'monospace'], ['saas', 'publishing']),
  Strikethrough: r('Strikethrough', 'Strikethrough', 'content', ['strike', 'delete', 'formatting'], ['publishing']),
  Underline: r('Underline', 'Underline', 'content', ['formatting', 'underline', 'text'], ['publishing']),
  Attachment: r('Attachment', 'Attachment', 'content', ['clip', 'paperclip', 'file', 'attach'], ['all']),
  Columns: r('Columns', 'Columns', 'content', ['layout', 'grid', 'split', 'panels'], ['all']),

  // ── Commerce ─────────────────────────────────────────────────────────────
  ShoppingCart: r('ShoppingCart', 'Shopping Cart', 'commerce', ['cart', 'basket', 'buy', 'checkout'], ['commerce']),
  ShoppingBag: r('ShoppingBag', 'Shopping Bag', 'commerce', ['bag', 'shop', 'purchase', 'buy'], ['commerce']),
  CreditCard: r('CreditCard', 'Credit Card', 'commerce', ['payment', 'card', 'billing', 'pay'], ['commerce']),
  DollarSign: r('DollarSign', 'Dollar Sign', 'commerce', ['money', 'price', 'currency', 'usd', 'cost'], ['commerce', 'business']),
  Package: r('Package', 'Package', 'commerce', ['box', 'parcel', 'shipping', 'delivery'], ['commerce']),
  Truck: r('Truck', 'Truck', 'commerce', ['delivery', 'shipping', 'transport', 'freight'], ['commerce']),
  Tag: r('Tag', 'Tag', 'commerce', ['label', 'price', 'mark', 'badge'], ['commerce']),
  Percent: r('Percent', 'Percent', 'commerce', ['discount', 'sale', 'promo', 'deal'], ['commerce']),
  Receipt: r('Receipt', 'Receipt', 'commerce', ['invoice', 'bill', 'order', 'transaction'], ['commerce']),
  Store: r('Store', 'Store', 'commerce', ['shop', 'market', 'retail', 'business'], ['commerce', 'restaurant']),
  Barcode: r('Barcode', 'Barcode', 'commerce', ['sku', 'scan', 'product', 'upc'], ['commerce']),
  Wallet: r('Wallet', 'Wallet', 'commerce', ['money', 'payment', 'balance', 'funds'], ['commerce']),
  Gift: r('Gift', 'Gift', 'commerce', ['present', 'reward', 'promotion', 'holiday'], ['commerce']),
  Star: r('Star', 'Star', 'commerce', ['rating', 'review', 'favorite', 'bookmark'], ['commerce', 'community']),
  TrendingUp: r('TrendingUp', 'Trending Up', 'commerce', ['growth', 'increase', 'analytics', 'chart'], ['commerce', 'business', 'saas']),
  Coupon: r('Coupon', 'Coupon', 'commerce', ['voucher', 'discount', 'deal', 'promo code'], ['commerce']),

  // ── Social ───────────────────────────────────────────────────────────────
  Heart: r('Heart', 'Heart', 'social', ['like', 'love', 'favorite', 'react'], ['all']),
  MessageCircle: r('MessageCircle', 'Message Circle', 'social', ['chat', 'comment', 'bubble', 'talk'], ['all']),
  Share2: r('Share2', 'Share', 'social', ['share', 'send', 'broadcast', 'distribute'], ['all']),
  ThumbsUp: r('ThumbsUp', 'Thumbs Up', 'social', ['like', 'upvote', 'approve', 'positive'], ['community']),
  ThumbsDown: r('ThumbsDown', 'Thumbs Down', 'social', ['dislike', 'downvote', 'disapprove'], ['community']),
  Bookmark: r('Bookmark', 'Bookmark', 'social', ['save', 'favorite', 'tag', 'mark'], ['all']),
  Bell: r('Bell', 'Bell', 'social', ['notification', 'alert', 'reminder', 'sound'], ['all']),
  AtSign: r('AtSign', 'At Sign', 'social', ['mention', 'email', 'username', 'handle'], ['all']),
  Hash: r('Hash', 'Hash', 'social', ['hashtag', 'tag', 'topic', 'channel'], ['community', 'publishing']),
  Globe: r('Globe', 'Globe', 'social', ['world', 'internet', 'web', 'international'], ['all']),
  Users: r('Users', 'Users', 'social', ['people', 'team', 'group', 'members'], ['all']),
  UserPlus: r('UserPlus', 'User Plus', 'social', ['add user', 'follow', 'invite', 'join'], ['community']),
  Send: r('Send', 'Send', 'social', ['submit', 'forward', 'post', 'publish'], ['all']),
  Repeat: r('Repeat', 'Repeat', 'social', ['repost', 'retweet', 'share', 'loop'], ['community']),
  Flag: r('Flag', 'Flag', 'social', ['report', 'mark', 'attention', 'pin'], ['community']),
  Rss: r('Rss', 'RSS', 'social', ['feed', 'subscribe', 'syndication', 'updates'], ['publishing']),

  // ── Restaurant ───────────────────────────────────────────────────────────
  UtensilsCrossed: r('UtensilsCrossed', 'Utensils Crossed', 'restaurant', ['fork', 'knife', 'dining', 'eat', 'food'], ['restaurant']),
  ChefHat: r('ChefHat', 'Chef Hat', 'restaurant', ['chef', 'cook', 'kitchen', 'cuisine'], ['restaurant']),
  Wine: r('Wine', 'Wine', 'restaurant', ['drink', 'alcohol', 'beverage', 'glass', 'bar'], ['restaurant']),
  Coffee: r('Coffee', 'Coffee', 'restaurant', ['cafe', 'espresso', 'drink', 'beverage', 'mug'], ['restaurant']),
  Soup: r('Soup', 'Soup', 'restaurant', ['bowl', 'broth', 'warm', 'stew'], ['restaurant']),
  Pizza: r('Pizza', 'Pizza', 'restaurant', ['pie', 'slice', 'italian', 'fast food'], ['restaurant']),
  Cake: r('Cake', 'Cake', 'restaurant', ['dessert', 'birthday', 'sweet', 'bakery'], ['restaurant']),
  Salad: r('Salad', 'Salad', 'restaurant', ['healthy', 'greens', 'bowl', 'vegan', 'vegetarian'], ['restaurant']),
  Flame: r('Flame', 'Flame', 'restaurant', ['fire', 'hot', 'spicy', 'grill', 'cooking'], ['restaurant']),
  Timer: r('Timer', 'Timer', 'restaurant', ['cook time', 'countdown', 'clock', 'duration'], ['restaurant', 'scheduling']),
  Reservation: r('Reservation', 'Reservation', 'restaurant', ['booking', 'table', 'reserve', 'schedule'], ['restaurant', 'scheduling']),
  MenuBoard: r('MenuBoard', 'Menu Board', 'restaurant', ['menu', 'food list', 'dishes', 'items'], ['restaurant']),
  GlassWater: r('GlassWater', 'Glass Water', 'restaurant', ['drink', 'hydrate', 'water', 'beverage'], ['restaurant']),
  IceCream: r('IceCream', 'Ice Cream', 'restaurant', ['dessert', 'frozen', 'sweet', 'cone'], ['restaurant']),
  Wheat: r('Wheat', 'Wheat', 'restaurant', ['grain', 'bread', 'gluten', 'bakery', 'farm'], ['restaurant']),
  Cocktail: r('Cocktail', 'Cocktail', 'restaurant', ['bar', 'drink', 'alcohol', 'mixed', 'nightlife'], ['restaurant']),

  // ── Music ────────────────────────────────────────────────────────────────
  Music: r('Music', 'Music', 'music', ['note', 'song', 'audio', 'melody', 'sound'], ['music']),
  Mic: r('Mic', 'Microphone', 'music', ['record', 'voice', 'podcast', 'speak', 'audio'], ['music']),
  Headphones: r('Headphones', 'Headphones', 'music', ['listen', 'audio', 'earphone', 'sound'], ['music']),
  Volume2: r('Volume2', 'Volume', 'music', ['sound', 'speaker', 'loud', 'audio'], ['music']),
  Radio: r('Radio', 'Radio', 'music', ['broadcast', 'signal', 'station', 'fm', 'am'], ['music']),
  Disc: r('Disc', 'Disc', 'music', ['vinyl', 'record', 'cd', 'album'], ['music']),
  Play: r('Play', 'Play', 'music', ['start', 'run', 'begin', 'video', 'audio'], ['music']),
  Pause: r('Pause', 'Pause', 'music', ['stop', 'halt', 'wait', 'hold'], ['music']),
  SkipForward: r('SkipForward', 'Skip Forward', 'music', ['next', 'advance', 'forward', 'skip'], ['music']),
  SkipBack: r('SkipBack', 'Skip Back', 'music', ['previous', 'back', 'rewind', 'last'], ['music']),
  Shuffle: r('Shuffle', 'Shuffle', 'music', ['random', 'mix', 'shuffle', 'random play'], ['music']),
  Speaker: r('Speaker', 'Speaker', 'music', ['sound', 'audio', 'loudspeaker', 'volume'], ['music']),
  Guitar: r('Guitar', 'Guitar', 'music', ['instrument', 'string', 'band', 'rock', 'acoustic'], ['music']),
  Piano: r('Piano', 'Piano', 'music', ['keys', 'keyboard', 'instrument', 'classical'], ['music']),
  VolumeX: r('VolumeX', 'Mute', 'music', ['mute', 'silent', 'no sound', 'quiet'], ['music']),
  Waveform: r('Waveform', 'Waveform', 'music', ['audio', 'wave', 'sound wave', 'frequency'], ['music']),

  // ── Business ─────────────────────────────────────────────────────────────
  Briefcase: r('Briefcase', 'Briefcase', 'business', ['work', 'job', 'career', 'office', 'professional'], ['business']),
  BarChart2: r('BarChart2', 'Bar Chart', 'business', ['analytics', 'chart', 'graph', 'data', 'metrics'], ['business', 'saas']),
  PieChart: r('PieChart', 'Pie Chart', 'business', ['analytics', 'chart', 'data', 'statistics'], ['business', 'saas']),
  Presentation: r('Presentation', 'Presentation', 'business', ['slideshow', 'deck', 'pitch', 'slides'], ['business']),
  Building: r('Building', 'Building', 'business', ['office', 'company', 'corporate', 'hq'], ['business']),
  Handshake: r('Handshake', 'Handshake', 'business', ['deal', 'agreement', 'partnership', 'contract'], ['business']),
  Target: r('Target', 'Target', 'business', ['goal', 'aim', 'objective', 'bullseye', 'kpi'], ['business', 'saas']),
  Award: r('Award', 'Award', 'business', ['badge', 'prize', 'trophy', 'recognition', 'achievement'], ['business', 'community']),
  Clipboard: r('Clipboard', 'Clipboard', 'business', ['task', 'checklist', 'notes', 'form'], ['business']),
  FileSpreadsheet: r('FileSpreadsheet', 'Spreadsheet', 'business', ['excel', 'table', 'data', 'rows', 'columns'], ['business', 'saas']),
  Calculator: r('Calculator', 'Calculator', 'business', ['math', 'compute', 'finance', 'accounting'], ['business']),
  Scale: r('Scale', 'Scale', 'business', ['balance', 'justice', 'legal', 'compare', 'weigh'], ['business']),
  Gavel: r('Gavel', 'Gavel', 'business', ['legal', 'law', 'judge', 'auction', 'hammer'], ['business']),
  Stamp: r('Stamp', 'Stamp', 'business', ['approve', 'official', 'verify', 'mark', 'seal'], ['business']),
  LineChart: r('LineChart', 'Line Chart', 'business', ['graph', 'trend', 'analytics', 'data'], ['business', 'saas']),

  // ── SaaS ─────────────────────────────────────────────────────────────────
  Cloud: r('Cloud', 'Cloud', 'saas', ['hosting', 'storage', 'service', 'aws', 'azure', 'gcp'], ['saas']),
  Terminal: r('Terminal', 'Terminal', 'saas', ['command', 'cli', 'console', 'shell', 'bash'], ['saas']),
  Code2: r('Code2', 'Code', 'saas', ['developer', 'programming', 'dev', 'code', 'brackets'], ['saas']),
  Database: r('Database', 'Database', 'saas', ['db', 'sql', 'storage', 'data', 'tables'], ['saas']),
  Server: r('Server', 'Server', 'saas', ['host', 'vm', 'infrastructure', 'backend', 'rack'], ['saas']),
  Cpu: r('Cpu', 'CPU', 'saas', ['processor', 'chip', 'compute', 'hardware', 'performance'], ['saas']),
  Wifi: r('Wifi', 'WiFi', 'saas', ['wireless', 'internet', 'network', 'connection', 'signal'], ['saas']),
  Lock: r('Lock', 'Lock', 'saas', ['secure', 'protected', 'auth', 'private', 'password'], ['all']),
  Shield: r('Shield', 'Shield', 'saas', ['security', 'protect', 'safe', 'guard', 'defense'], ['saas']),
  Key: r('Key', 'Key', 'saas', ['auth', 'password', 'access', 'token', 'secret'], ['saas']),
  Webhook: r('Webhook', 'Webhook', 'saas', ['api', 'integration', 'callback', 'event', 'trigger'], ['saas']),
  Api: r('Api', 'API', 'saas', ['rest', 'endpoint', 'integration', 'request', 'developer'], ['saas']),
  Layers: r('Layers', 'Layers', 'saas', ['stack', 'levels', 'architecture', 'tiers'], ['saas']),
  GitBranch: r('GitBranch', 'Git Branch', 'saas', ['git', 'branch', 'version', 'code', 'fork'], ['saas']),
  Puzzle: r('Puzzle', 'Puzzle', 'saas', ['plugin', 'integration', 'extension', 'addon', 'module'], ['saas']),
  Monitor: r('Monitor', 'Monitor', 'saas', ['screen', 'display', 'desktop', 'computer'], ['saas']),

  // ── Community ────────────────────────────────────────────────────────────
  CommunityUsers: r('CommunityUsers', 'Community Users', 'community', ['members', 'group', 'people', 'team', 'network'], ['community']),
  MessageSquare: r('MessageSquare', 'Message Square', 'community', ['chat', 'forum', 'discussion', 'comment', 'reply'], ['community']),
  CommunityHeart: r('CommunityHeart', 'Community Heart', 'community', ['love', 'support', 'care', 'react', 'like'], ['community']),
  Trophy: r('Trophy', 'Trophy', 'community', ['achievement', 'win', 'prize', 'award', 'leaderboard'], ['community']),
  CommunityFlag: r('CommunityFlag', 'Community Flag', 'community', ['report', 'mark', 'signal', 'milestone'], ['community']),
  Badge: r('Badge', 'Badge', 'community', ['verified', 'certification', 'award', 'recognition'], ['community']),
  Crown: r('Crown', 'Crown', 'community', ['leader', 'top', 'premium', 'royalty', 'admin'], ['community']),
  Sparkles: r('Sparkles', 'Sparkles', 'community', ['magic', 'featured', 'highlight', 'special', 'shine'], ['community']),
  Zap: r('Zap', 'Zap', 'community', ['lightning', 'fast', 'boost', 'power', 'instant'], ['community', 'saas']),
  CommunityFlame: r('CommunityFlame', 'Trending', 'community', ['trending', 'hot', 'popular', 'viral'], ['community']),
  Vote: r('Vote', 'Vote', 'community', ['poll', 'ballot', 'election', 'feedback', 'survey'], ['community']),
  HandRaised: r('HandRaised', 'Hand Raised', 'community', ['volunteer', 'raise', 'ask', 'participate'], ['community']),
  Medal: r('Medal', 'Medal', 'community', ['rank', 'position', 'achievement', 'first', 'place'], ['community']),
  CircleUser: r('CircleUser', 'Circle User', 'community', ['profile', 'avatar', 'member', 'account'], ['all']),
  StarRating: r('StarRating', 'Star Rating', 'community', ['review', 'rate', 'score', 'feedback'], ['community', 'commerce']),

  // ── Publishing ───────────────────────────────────────────────────────────
  BookOpen: r('BookOpen', 'Book Open', 'publishing', ['read', 'book', 'learn', 'open', 'library'], ['publishing']),
  Newspaper: r('Newspaper', 'Newspaper', 'publishing', ['news', 'article', 'paper', 'media', 'editorial'], ['publishing']),
  PenTool: r('PenTool', 'Pen Tool', 'publishing', ['design', 'draw', 'vector', 'write', 'create'], ['publishing']),
  Printer: r('Printer', 'Printer', 'publishing', ['print', 'paper', 'output', 'publish'], ['publishing']),
  PublishingFileText: r('PublishingFileText', 'Document', 'publishing', ['file', 'text', 'article', 'document', 'page'], ['publishing']),
  PublishingBookmark: r('PublishingBookmark', 'Bookmark', 'publishing', ['save', 'mark', 'remember', 'favorite'], ['publishing']),
  Library: r('Library', 'Library', 'publishing', ['books', 'collection', 'archive', 'knowledge'], ['publishing']),
  Notebook: r('Notebook', 'Notebook', 'publishing', ['journal', 'diary', 'notes', 'write'], ['publishing']),
  Feather: r('Feather', 'Feather', 'publishing', ['write', 'author', 'pen', 'compose', 'create'], ['publishing']),
  PublishingQuote: r('PublishingQuote', 'Quote', 'publishing', ['blockquote', 'citation', 'speech', 'say'], ['publishing']),
  Highlighter: r('Highlighter', 'Highlighter', 'publishing', ['mark', 'highlight', 'annotate', 'emphasize'], ['publishing']),
  Scroll: r('Scroll', 'Scroll', 'publishing', ['manuscript', 'document', 'old', 'vintage', 'paper'], ['publishing']),
  Archive: r('Archive', 'Archive', 'publishing', ['store', 'save', 'old', 'past', 'box'], ['publishing']),
  PublishingRss: r('PublishingRss', 'RSS Feed', 'publishing', ['feed', 'subscribe', 'updates', 'blog'], ['publishing']),
  GraduationCap: r('GraduationCap', 'Graduation Cap', 'publishing', ['education', 'learn', 'degree', 'university', 'course'], ['publishing', 'community']),

  // ── Scheduling ───────────────────────────────────────────────────────────
  Calendar: r('Calendar', 'Calendar', 'scheduling', ['date', 'schedule', 'event', 'appointment', 'book'], ['scheduling', 'restaurant']),
  Clock: r('Clock', 'Clock', 'scheduling', ['time', 'hour', 'minute', 'watch'], ['scheduling', 'restaurant']),
  AlarmClock: r('AlarmClock', 'Alarm Clock', 'scheduling', ['alarm', 'reminder', 'wake', 'alert'], ['scheduling']),
  SchedulingTimer: r('SchedulingTimer', 'Timer', 'scheduling', ['countdown', 'stopwatch', 'duration', 'time'], ['scheduling', 'restaurant']),
  CalendarPlus: r('CalendarPlus', 'Add Event', 'scheduling', ['new event', 'schedule', 'book', 'add', 'create'], ['scheduling', 'restaurant']),
  CalendarCheck: r('CalendarCheck', 'Calendar Check', 'scheduling', ['confirmed', 'booked', 'appointment', 'done'], ['scheduling']),
  Hourglass: r('Hourglass', 'Hourglass', 'scheduling', ['time', 'wait', 'countdown', 'sand', 'passing'], ['scheduling']),
  Sunrise: r('Sunrise', 'Sunrise', 'scheduling', ['morning', 'dawn', 'early', 'am', 'start'], ['scheduling']),
  Sunset: r('Sunset', 'Sunset', 'scheduling', ['evening', 'dusk', 'late', 'pm', 'end'], ['scheduling']),
  Moon: r('Moon', 'Moon', 'scheduling', ['night', 'dark mode', 'late', 'sleep'], ['scheduling']),
  Sun: r('Sun', 'Sun', 'scheduling', ['day', 'light', 'bright', 'weather'], ['scheduling']),
  Watch: r('Watch', 'Watch', 'scheduling', ['time', 'wristwatch', 'clock', 'hr'], ['scheduling']),
  Stopwatch: r('Stopwatch', 'Stopwatch', 'scheduling', ['timer', 'count', 'race', 'speed', 'measure'], ['scheduling']),
  History: r('History', 'History', 'scheduling', ['past', 'recent', 'undo', 'log', 'timeline'], ['scheduling']),
  SchedulingRepeat: r('SchedulingRepeat', 'Repeat', 'scheduling', ['recurring', 'repeat', 'loop', 'cycle'], ['scheduling']),

  // ── Status ───────────────────────────────────────────────────────────────
  Check: r('Check', 'Check', 'status', ['done', 'tick', 'complete', 'ok', 'success'], ['all']),
  CheckCircle: r('CheckCircle', 'Check Circle', 'status', ['success', 'done', 'complete', 'approved', 'valid'], ['all']),
  X: r('X', 'X', 'status', ['close', 'dismiss', 'error', 'cancel', 'remove'], ['all']),
  XCircle: r('XCircle', 'X Circle', 'status', ['error', 'failed', 'invalid', 'rejected', 'cancel'], ['all']),
  AlertTriangle: r('AlertTriangle', 'Alert Triangle', 'status', ['warning', 'caution', 'danger', 'alert'], ['all']),
  AlertCircle: r('AlertCircle', 'Alert Circle', 'status', ['warning', 'error', 'notice', 'problem'], ['all']),
  Info: r('Info', 'Info', 'status', ['information', 'detail', 'about', 'help', 'note'], ['all']),
  HelpCircle: r('HelpCircle', 'Help Circle', 'status', ['question', 'help', 'support', 'faq', '?'], ['all']),
  Loader: r('Loader', 'Loader', 'status', ['loading', 'spinner', 'wait', 'processing', 'progress'], ['all']),
  RefreshCw: r('RefreshCw', 'Refresh', 'status', ['reload', 'refresh', 'sync', 'update', 'rotate'], ['all']),
  Ban: r('Ban', 'Ban', 'status', ['blocked', 'forbidden', 'not allowed', 'prohibited', 'stop'], ['all']),
  StatusShield: r('StatusShield', 'Shield', 'status', ['security', 'safe', 'protected', 'guard'], ['all']),
  StatusLock: r('StatusLock', 'Lock', 'status', ['locked', 'secure', 'private', 'auth'], ['all']),
  Unlock: r('Unlock', 'Unlock', 'status', ['unlocked', 'open', 'public', 'accessible'], ['all']),
  Verified: r('Verified', 'Verified', 'status', ['trusted', 'certified', 'checked', 'approved', 'official'], ['all']),
};

/**
 * Returns all icon metadata as a flat array.
 */
export const getAllIcons = (): IconMeta[] => Object.values(ICON_REGISTRY);

/**
 * Returns icons filtered by category.
 */
export const getIconsByCategory = (category: IconMeta['category']): IconMeta[] =>
  getAllIcons().filter((m) => m.category === category);

/**
 * Returns icons filtered by vertical (includes icons with 'all' vertical).
 */
export const getIconsByVertical = (vertical: IconMeta['verticals'][number]): IconMeta[] =>
  getAllIcons().filter((m) => m.verticals.includes('all') || m.verticals.includes(vertical));

/**
 * Full-text search across icon name, label, and tags. Case-insensitive.
 * Optionally filter to a specific category or vertical.
 */
export const searchIcons = (
  query: string,
  options?: {
    category?: IconMeta['category'];
    vertical?: IconMeta['verticals'][number];
  }
): IconMeta[] => {
  const q = query.toLowerCase().trim();
  let results = getAllIcons();

  if (options?.category) {
    results = results.filter((m) => m.category === options.category);
  }
  if (options?.vertical) {
    results = results.filter(
      (m) => m.verticals.includes('all') || m.verticals.includes(options.vertical!)
    );
  }
  if (!q) return results;

  return results.filter(
    (m) =>
      m.name.toLowerCase().includes(q) ||
      m.label.toLowerCase().includes(q) ||
      m.tags.some((t) => t.toLowerCase().includes(q))
  );
};

export const ICON_CATEGORIES: IconMeta['category'][] = [
  'general',
  'navigation',
  'content',
  'commerce',
  'social',
  'restaurant',
  'music',
  'business',
  'saas',
  'community',
  'publishing',
  'scheduling',
  'status',
];

export const ICON_CATEGORY_LABELS: Record<IconMeta['category'], string> = {
  general: 'General',
  navigation: 'Navigation',
  content: 'Content',
  commerce: 'Commerce',
  social: 'Social',
  restaurant: 'Restaurant',
  music: 'Music',
  business: 'Business',
  saas: 'SaaS / Dev',
  community: 'Community',
  publishing: 'Publishing',
  scheduling: 'Scheduling',
  status: 'Status',
};
