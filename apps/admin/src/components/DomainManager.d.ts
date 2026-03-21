/**
 * Domain Manager
 *
 * UI for configuring and verifying custom domains on a Sigil CMS site.
 */
interface DomainManagerProps {
    siteId: string;
    currentDomain: string;
    onDomainChange: (domain: string) => void;
}
export declare function DomainManager({ siteId, currentDomain, onDomainChange }: DomainManagerProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=DomainManager.d.ts.map