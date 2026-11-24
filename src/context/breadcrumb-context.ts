import { createContext, useContext, useEffect } from "react";

export const BreadcrumbLabelContext = createContext<(label: string | undefined) => void>(() => {});

/**
 * Lets a detail page (e.g. a club or user) show its real name as the last
 * breadcrumb instead of a generic label like "Club".
 */
export function useBreadcrumbLabel(label: string | undefined) {
    const setLabel = useContext(BreadcrumbLabelContext);
    useEffect(() => {
        setLabel(label);
        return () => setLabel(undefined);
    }, [label, setLabel]);
}
