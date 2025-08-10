export type Page = 'dashboard' | 'bookings' | 'guests' | 'reports' | 'housekeeping' | 'settings' | 'calendar' | 'hotels' | 'room-management' | 'import-data';
export type SuperAdminPage = 'saas-dashboard' | 'saas-customers' | 'saas-system-health';


export enum BookingStatus {
    Confirmed = 'CONFIRMED',
    CheckedIn = 'CHECKED_IN',
    CheckedOut = 'CHECKED_OUT',
    Cancelled = 'CANCELLED'
}

export enum RoomType {
    Single = 'SINGLE',
    Double = 'DOUBLE',
    Suite = 'SUITE'
}

export enum HousekeepingStatus {
    Clean = 'CLEAN',
    Dirty = 'DIRTY',
    InProgress = 'IN_PROGRESS',
    Inspection = 'INSPECTION'
}

export enum IntegrationCategory {
    ChannelManager = 'Channel Manager',
    PaymentGateway = 'Payment Gateway',
    Accounting = 'Accounting',
    POS = 'POS System',
    Communication = 'Communication',
}

export interface PlatformSettings {
    currency: string;
    timezone: string;
}

export interface PaymentMode {
    id: string;
    name: string;
}

export interface PaymentAccount {
    id: string;
    name: string;
    details: string;
}

export interface Payment {
    amount: number;
    modeId: string;
    accountId: string;
    date: string; // ISO Date string
}

export interface Property {
    id: string;
    name: string;
    location: string;
    customerId: string;
    phone: string;
    managementType: 'OYO' | 'SELF';
}

export interface Room {
    id: string;
    name: string;
    type: RoomType;
    propertyId: string;
    housekeepingStatus: HousekeepingStatus;
    foRemarks?: string;
    hkRemarks?: string;
    housekeeperId?: string;
}

export interface Guest {
    id: string;
    name: string;
    email: string;
    phone: string;
}

export interface User {
    id: string;
    name: string;
    role: 'Admin' | 'Manager' | 'Staff';
}

export interface Booking {
    id: string;
    propertyId: string;
    roomId: string;
    guestId: string;
    checkIn: string; // ISO Date string
    checkOut: string; // ISO Date string
    status: BookingStatus;
    totalPrice: number;
    payments: Payment[];
    source: string;
    bookType?: 'BOOK_1' | 'BOOK_2';
}

export interface RevenueDataPoint {
    date: string;
    revenue: number;
    occupancy: number;
}

export interface Integration {
    id: string;
    name: string;
    category: IntegrationCategory;
    description: string;
    logoUrl: string;
    connected: boolean;
    credentials?: { [key: string]: string };
}

export interface AuditLog {
    id: string;
    timestamp: string; // ISO Date string
    userId: string;
    action: string;
    details: string;
}

// Super Admin Types
export interface SubscriptionPlan {
    name: 'Basic' | 'Pro' | 'Enterprise';
    monthlyRate: number;
    propertyLimit: number;
    userLimit: number;
}

export interface SaaS_Customer {
    id: string;
    name: string; // e.g., "Zenith Hospitality Group"
    status: 'Active' | 'Trial' | 'Cancelled';
    subscriptionPlanId: string;
    memberSince: string; // ISO Date
}

export interface SystemLog {
    id: string;
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR';
    service: string; // e.g., 'API', 'DATABASE', 'AUTH'
    message: string;
}
