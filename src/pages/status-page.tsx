import { StatusWidget } from "@/components/status-widget";
import { StatsWidget } from "@/components/stats-widget";

export function StatusPage() {

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="space-y-4">
                <h1 className="text-3xl font-bold tracking-tight">Status & Statistics</h1>
                <p className="text-muted-foreground">
                    System Information and Membership Statistics.
                </p>
            </div>
            <div className="grid grid-cols-1 gap-6">
                <StatusWidget />
                <StatsWidget />
            </div>
        </div>
    );
}
