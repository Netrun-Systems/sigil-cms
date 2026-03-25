import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
/**
 * ThemeLockPanel - Toggle locks for individual design layers
 *
 * When a layer is locked, switching theme presets will preserve
 * the current values for that layer while updating unlocked layers.
 *
 * @module admin/components
 */
import { Lock, Unlock, Palette, Type, Maximize, Sparkles, LayoutGrid } from 'lucide-react';
import { Button, cn } from '@netrun-cms/ui';
const lockLayers = [
    { key: 'colors', label: 'Colors', icon: Palette },
    { key: 'typography', label: 'Typography', icon: Type },
    { key: 'spacing', label: 'Spacing', icon: Maximize },
    { key: 'effects', label: 'Effects', icon: Sparkles },
    { key: 'blockDefaults', label: 'Layout', icon: LayoutGrid },
];
export function ThemeLockPanel({ locks, onLocksChange, disabled }) {
    const toggleLock = (key) => {
        onLocksChange({ ...locks, [key]: !locks[key] });
    };
    const lockedCount = Object.values(locks).filter(Boolean).length;
    return (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("p", { className: "text-sm font-medium text-muted-foreground", children: ["Design Locks", lockedCount > 0 && (_jsxs("span", { className: "ml-1.5 text-xs text-primary", children: ["(", lockedCount, " locked)"] }))] }), lockedCount > 0 && (_jsx(Button, { variant: "ghost", size: "sm", className: "h-6 px-2 text-xs", onClick: () => onLocksChange({
                            colors: false,
                            typography: false,
                            spacing: false,
                            effects: false,
                            blockDefaults: false,
                        }), disabled: disabled, children: "Unlock All" }))] }), _jsx("div", { className: "flex gap-1.5", children: lockLayers.map(({ key, label, icon: Icon }) => {
                    const isLocked = locks[key];
                    return (_jsxs(Button, { variant: isLocked ? 'secondary' : 'outline', size: "sm", className: cn('flex-1 gap-1.5 text-xs h-9 transition-all', isLocked && 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/15', !isLocked && 'text-muted-foreground hover:text-foreground'), onClick: () => toggleLock(key), disabled: disabled, title: isLocked ? `Unlock ${label} — will update when switching presets` : `Lock ${label} — preserve when switching presets`, children: [_jsx(Icon, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "hidden sm:inline", children: label }), isLocked ? (_jsx(Lock, { className: "h-3 w-3 ml-auto" })) : (_jsx(Unlock, { className: "h-3 w-3 ml-auto opacity-40" }))] }, key));
                }) })] }));
}
export default ThemeLockPanel;
//# sourceMappingURL=ThemeLockPanel.js.map