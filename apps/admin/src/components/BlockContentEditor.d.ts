/**
 * BlockContentEditor - Type-specific form fields for editing block content
 *
 * Renders appropriate inputs based on block type (hero, text, cta, etc.)
 * with a JSON fallback editor for unknown/custom block types.
 */
export interface BlockContentEditorProps {
    blockType: string;
    content: Record<string, unknown>;
    onChange: (content: Record<string, unknown>) => void;
}
export declare function BlockContentEditor({ blockType, content, onChange }: BlockContentEditorProps): import("react/jsx-runtime").JSX.Element;
export default BlockContentEditor;
//# sourceMappingURL=BlockContentEditor.d.ts.map