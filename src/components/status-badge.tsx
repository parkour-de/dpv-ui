import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { type Membership, CLUB_STATUS_COLORS, displayStatus } from "@/types";

interface StatusBadgeProps {
    readonly membership?: Membership;
    readonly className?: string; // Additional classes
}

export function StatusBadge({ membership, className }: StatusBadgeProps) {
    const { t } = useTranslation();
    const [now] = useState(() => Math.floor(Date.now() / 1000));

    if (!membership) return null;

    const { begin_date } = membership;
    const status = displayStatus(membership.status);

    let labelKey = `club.status.${status}`;

    if ((status === 'active' || status === 'approved') && begin_date && begin_date > now) {
        labelKey = 'club.status.upcoming_membership';
    } else if (status === 'approved') {
        labelKey = 'club.status.upcoming_membership';
    } else if (status === 'cancelling') {
        labelKey = 'club.status.pending_cancellation';
    }

    return (
        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap", CLUB_STATUS_COLORS[status], className)}>
            {t(labelKey)}
        </span>
    );
}
