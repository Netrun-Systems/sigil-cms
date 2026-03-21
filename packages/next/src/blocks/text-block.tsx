import type { BlockComponentProps } from '../types.js';

/**
 * Default text/rich-text block renderer.
 * Renders HTML content via dangerouslySetInnerHTML for rich text,
 * or plain text in a paragraph.
 */
export function TextBlock({ block, content }: BlockComponentProps) {
  const body = content.body as string | undefined;
  const html = content.html as string | undefined;
  const heading = content.heading as string | undefined;

  // Prefer html (rich text) over body (plain text)
  const richContent = html ?? body;
  const isHtml = Boolean(html) || (typeof richContent === 'string' && richContent.includes('<'));

  return (
    <div
      className={`sigil-block sigil-block--text ${block.settings.customClass ?? ''}`}
      data-block-id={block.id}
      data-block-type={block.blockType}
    >
      {heading && <h2 className="sigil-text__heading">{heading}</h2>}
      {richContent && isHtml ? (
        <div
          className="sigil-text__body sigil-prose"
          dangerouslySetInnerHTML={{ __html: richContent }}
        />
      ) : richContent ? (
        <p className="sigil-text__body">{richContent}</p>
      ) : null}
    </div>
  );
}
