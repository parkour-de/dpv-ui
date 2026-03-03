
import { type Membership } from "@/types";
import { StatusBadge } from "@/components/status-badge";

interface MembershipStatusProps {
    membership?: Membership;
}

export function MembershipStatus({ membership }: MembershipStatusProps) {

    if (!membership?.status || membership.status === 'inactive') {
        return <p className="text-muted-foreground text-sm">Kein aktiver Aufnahmeantrag vorhanden.</p>;
    }

    const { begin_date, end_date, membership_number } = membership;

    const begin = begin_date
        ? new Date(begin_date * 1000).toLocaleDateString()
        : 'Sofort';

    // Note: status 'active' but begin_date in future means it's upcoming (handled by StatusBadge)
    const end = end_date
        ? new Date(end_date * 1000).toLocaleDateString()
        : undefined;

    return (
        <div className="space-y-2 text-sm">
            <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium"><StatusBadge membership={membership} /></span>
            </div>
            <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Eintrittsdatum:</span>
                <span className="font-medium">{begin}</span>
            </div>
            {end && (
                <div className="flex justify-between border-b pb-2 text-destructive">
                    <span className="text-muted-foreground">Kündigungsdatum:</span>
                    <span className="font-medium">{end}</span>
                </div>
            )}
            {membership_number && (
                <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Mitgliedsnummer:</span>
                    <span className="font-mono">{membership_number}</span>
                </div>
            )}
        </div>
    );
}
