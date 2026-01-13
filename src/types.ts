export type ClubStatus = 'active' | 'inactive' | 'requested' | 'denied' | 'cancelled';

export const CLUB_STATUS_LABELS: Record<ClubStatus, string> = {
    active: 'Aktiv',
    inactive: 'Inaktiv',
    requested: 'Beantragt',
    denied: 'Abgelehnt',
    cancelled: 'Gekündigt',
};

export const CLUB_STATUS_COLORS: Record<ClubStatus, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    requested: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    denied: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    cancelled: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
};

export interface Membership {
    status: ClubStatus;
    contribution?: number;
    address?: string;
    iban?: string; // usually omitted except for owners
    sepa_mandate_number?: string;
}

export interface Club {
    _key: string;
    name: string;
    legal_form: string;
    membership: Membership;
    members: number;
    votes: number;
    contact_person?: string;
    email?: string;
    website_ok: boolean;
    owner_key: string;
    vorstand?: VorstandUser[]; // Board members
    census?: CensusSummary[];
}

export interface CensusSummary {
    year: number;
    count: number;
}

export interface CensusMember {
    firstname: string;
    lastname: string;
    gender: string;
    birthYear: number;
}

export interface Census {
    year: number;
    members: CensusMember[];
}

export interface VorstandUser {
    _key: string;
    firstname: string;
    lastname: string;
}

export interface User {
    _key: string;
    email: string;
    firstname: string;
    lastname: string;
    roles: string[];
    language?: string;
}
