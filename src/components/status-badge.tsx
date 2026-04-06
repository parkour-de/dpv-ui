import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { type Membership, CLUB_STATUS_COLORS } from "@/types";

interface StatusBadgeProps {
    readonly membership?: Membership;
    readonly className?: string; // Additional classes
}

export function StatusBadge({ membership, className }: StatusBadgeProps) {
    const { t } = useTranslation();
    const [now] = useState(() => Math.floor(Date.now() / 1000));

    if (!membership) return null;

    const { status, begin_date, end_date } = membership;

    let labelKey = `club.status.${status}`;

    if ((status === 'active' || status === 'approved') && begin_date && begin_date > now) {
        labelKey = 'club.status.upcoming_membership';
    } else if (status === 'approved') {
        labelKey = 'club.status.upcoming_membership';
    } else if ((status === 'cancelled' || status === 'cancelling') && end_date && end_date > now) {
        labelKey = 'club.status.pending_cancellation';
    } else if (status === 'cancelling') {
        labelKey = 'club.status.pending_cancellation';
    }

    return (
        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap", CLUB_STATUS_COLORS[status], className)}>
            {t(labelKey)}
        </span>
    );
}
