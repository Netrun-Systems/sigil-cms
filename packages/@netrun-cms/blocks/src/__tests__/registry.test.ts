// @vitest-environment happy-dom

/**
 * Block Registry tests
 *
 * Tests the Map-based block registry exported from BlockRenderer.
 * Uses happy-dom so that React imports resolve without a real browser.
 */

import { describe, it, expect } from 'vitest';
import {
  getRegisteredBlockTypes,
  registerBlockComponent,
} from '../BlockRenderer';

// ---------------------------------------------------------------------------
// getRegisteredBlockTypes
// ---------------------------------------------------------------------------

describe('getRegisteredBlockTypes', () => {
  it('returns an array of strings', () => {
    const types = getRegisteredBlockTypes();
    expect(Array.isArray(types)).toBe(true);
    types.forEach((t) => {
      expect(typeof t).toBe('string');
    });
  });

  const coreTypes = [
    'hero',
    'text',
    'rich_text',
    'feature_grid',
    'gallery',
    'cta',
    'pricing_table',
    'testimonial',
    'contact_form',
  ] as const;

  it.each(coreTypes)('includes core block type "%s"', (type) => {
    const types = getRegisteredBlockTypes();
    expect(types).toContain(type);
  });

  it('has at least 9 core block types registered', () => {
    const types = getRegisteredBlockTypes();
    expect(types.length).toBeGreaterThanOrEqual(9);
  });
});

// ---------------------------------------------------------------------------
// registerBlockComponent
// ---------------------------------------------------------------------------

describe('registerBlockComponent', () => {
  it('adds a new block type to the registry', () => {
    const before = getRegisteredBlockTypes();
    expect(before).not.toContain('test_custom_block');

    // Register a dummy component (plain function returning null)
    registerBlockComponent('test_custom_block', (() => null) as any);

    const after = getRegisteredBlockTypes();
    expect(after).toContain('test_custom_block');
  });

  it('allows overriding an existing block type', () => {
    const dummy = (() => null) as any;
    registerBlockComponent('hero', dummy);

    // hero should still be in the list (just with a different component)
    const types = getRegisteredBlockTypes();
    expect(types).toContain('hero');
  });

  it('registers multiple custom types', () => {
    const dummy = (() => null) as any;
    registerBlockComponent('plugin_video', dummy);
    registerBlockComponent('plugin_map', dummy);

    const types = getRegisteredBlockTypes();
    expect(types).toContain('plugin_video');
    expect(types).toContain('plugin_map');
  });
});
