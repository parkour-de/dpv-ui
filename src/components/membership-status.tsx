
import { useTranslation } from "react-i18next";
import { type Membership, displayStatus } from "@/types";
import { StatusBadge } from "@/components/status-badge";

interface MembershipStatusProps {
    readonly membership?: Membership;
    // Only the date rows, for places that already show the status and membership number elsewhere
    readonly datesOnly?: boolean;
}

export function MembershipStatus({ membership, datesOnly }: MembershipStatusProps) {
    const { t, i18n } = useTranslation();

    if (!membership?.status || displayStatus(membership.status) === 'inactive') {
        return <p className="text-muted-foreground text-sm">{t('profile.membership.none')}</p>;
    }

    const { application_date, begin_date, end_date, membership_number } = membership;

    // Adaptive label based on status
    const isRequested = membership.status === 'requested';
    const dateLabel = isRequested ? t('profile.membership.application_date') : t('profile.membership.entry_date');
    
    let begin = t('profile.membership.immediately');
    if (isRequested && application_date) {
        begin = new Date(application_date * 1000).toLocaleDateString(i18n.language);
    } else if (begin_date) {
        begin = new Date(begin_date * 1000).toLocaleDateString(i18n.language);
    }

    // Rejected applications without a start date: no "Sofort" fallback, just leave the date row out
    const showBegin = !(membership.status === 'denied' && !begin_date);

    // Note: status 'active' but begin_date in future means it's upcoming (handled by StatusBadge)
    const end = end_date
        ? new Date(end_date * 1000).toLocaleDateString(i18n.language)
        : undefined;

    return (
        <div className="space-y-2 text-sm">
            {!datesOnly && (
                <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">{t('profile.membership.status')}</span>
                    <span className="font-medium"><StatusBadge membership={membership} /></span>
                </div>
            )}
            {showBegin && (
                <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">{dateLabel}</span>
                    <span className="font-medium">{begin}</span>
                </div>
            )}
            {/* Applications: the membership will begin on the application date once approved */}
            {isRequested && !!application_date && (
                <div className="flex justify-between border-b pb-2 gap-4">
                    <span className="text-muted-foreground">{t('profile.membership.planned_begin')}</span>
                    <span className="font-medium text-right">{begin} <span className="font-normal text-muted-foreground">({t('profile.membership.after_approval')})</span></span>
                </div>
            )}
            {end && (
                <div className="flex justify-between border-b pb-2 text-destructive">
                    <span className="text-muted-foreground">{t('profile.membership.end_date')}</span>
                    <span className="font-medium">{end}</span>
                </div>
            )}
            {membership_number && !datesOnly && (
                <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">{t('profile.membership.membership_number')}</span>
                    <span className="font-mono">{membership_number}</span>
                </div>
            )}
        </div>
    );
}
