import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { Users, Building2 } from "lucide-react";

interface StatsResponse {
    active_users: number;
    active_clubs: number;
    active_members: number;
}

export function StatsWidget() {
    const [stats, setStats] = useState<StatsResponse | null>(null);

    useEffect(() => {
        api.get<StatsResponse>('/stats')
            .then(data => setStats(data))
            .catch(err => console.error("Failed to fetch stats", err));
    }, []);

    return (
        <Card className="bg-background/95 backdrop-blur shadow-md">
            <CardHeader>
                <CardTitle>System Statistics</CardTitle>
                <CardDescription>Current active memberships overview</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-4 rounded-lg border p-4 bg-muted/30">
                    <Users className="h-8 w-8 text-primary" />
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Active Members (Users)</p>
                        <p className="text-2xl font-bold">{stats?.active_users ?? '-'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 rounded-lg border p-4 bg-muted/30">
                    <Building2 className="h-8 w-8 text-primary" />
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Active Clubs (Members)</p>
                        <p className="text-2xl font-bold">
                            {stats?.active_clubs ?? '-'} 
                            <span className="text-sm font-normal text-muted-foreground ml-2">
                                ({stats?.active_members ?? '-'} total members)
                            </span>
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
