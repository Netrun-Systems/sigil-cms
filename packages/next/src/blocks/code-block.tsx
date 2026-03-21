import type { BlockComponentProps } from '../types.js';

/**
 * Default code block renderer.
 * Renders a pre/code block with optional language annotation.
 * Consumers can override this with a syntax-highlighted component (Prism, Shiki, etc.).
 */
export function CodeBlock({ block, content }: BlockComponentProps) {
  const code = (content.code as string) ?? (content.body as string) ?? '';
  const language = (content.language as string) ?? 'text';
  const filename = content.filename as string | undefined;
  const showLineNumbers = content.showLineNumbers as boolean | undefined;

  return (
    <div
      className={`sigil-block sigil-block--code ${block.settings.customClass ?? ''}`}
      data-block-id={block.id}
      data-block-type="code_block"
    >
      {filename && <div className="sigil-code__filename">{filename}</div>}
      <pre
        className="sigil-code__pre"
        data-language={language}
        data-line-numbers={showLineNumbers ? '' : undefined}
      >
        <code className={`sigil-code__code language-${language}`}>{code}</code>
      </pre>
    </div>
  );
}
