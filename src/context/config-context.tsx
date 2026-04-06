import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { type Config } from "@/types";
import { ConfigContext } from "./config-context-core";

/**
 * ConfigProvider manages the global application configuration.
 * It is exported separately to ensure Fast Refresh only detects components in this file.
 */
export function ConfigProvider({ children }: { children: React.ReactNode }) {
    const [config, setConfig] = useState<Config | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const data = await api.get<Config>("/config");
            setConfig(data);
        } catch (err) {
            console.error("Failed to load config", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    return (
        <ConfigContext.Provider value={{ config, loading, refreshConfig: fetchConfig }}>
            {children}
        </ConfigContext.Provider>
    );
}
