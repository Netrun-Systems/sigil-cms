import type { BlockComponentProps } from '../types.js';

/**
 * Fallback block renderer for unrecognized block types.
 * In production, renders nothing. In development, renders a placeholder
 * so developers know which block type needs a custom component.
 */
export function FallbackBlock({ block }: BlockComponentProps) {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div
      className="sigil-block sigil-block--fallback"
      data-block-id={block.id}
      data-block-type={block.blockType}
    >
      <p className="sigil-fallback__message">
        Unknown block type: <code>{block.blockType}</code>
      </p>
      <p className="sigil-fallback__hint">
        Register a custom component for this block type via the <code>components</code> prop.
      </p>
    </div>
  );
}
