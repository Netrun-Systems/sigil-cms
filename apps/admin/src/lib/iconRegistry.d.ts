/**
 * Icon Registry — Maps string icon names to lucide-react components
 *
 * Used by the Sidebar to render plugin nav icons from manifest data
 * (which contains icon names as strings, not component references).
 */
import { type LucideIcon } from 'lucide-react';
/**
 * Look up a lucide-react icon component by name.
 * Falls back to the Puzzle icon if not found.
 */
export declare function getIcon(name: string): LucideIcon;
//# sourceMappingURL=iconRegistry.d.ts.map