import { useContext } from "react";
import { ConfigContext } from "@/context/config-context-core";

/**
 * useConfig is a custom hook to access the global application configuration.
 * It is isolated in its own file to maintain clean exports and satisfy ESLint rules.
 */
export function useConfig() {
    const context = useContext(ConfigContext);
    if (context === undefined) {
        throw new Error("useConfig must be used within a ConfigProvider");
    }
    return context;
}
