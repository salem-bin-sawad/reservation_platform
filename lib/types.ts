export type UserRole = 'user' | 'office' | 'admin';

export interface AuthUser {
  id: string;
  fullName: string;
  phone: string;
  email?: string | null;
  role: UserRole;
  officeName?: string | null;
  commercialRegistration?: string | null;
  city?: string | null;
  address?: string | null;
  isPhoneVerified?: boolean;
  isEmailVerified?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type TripStatus =
  | 'DRAFT'
  | 'UPCOMING'
  | 'STARTED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface TripItem {
  id: string;
  tripNumber: string;
  serviceId: string;
  service?: ServiceItem;
  officeId: string;
  office?: AuthUser;
  fromCity: string;
  toCity: string;
  route: string;
  departureDate: string;
  departureTime: string;
  originalPrice: number | string;
  discountedPrice?: number | string | null;
  currency: string;
  totalSeats: number;
  availableSeats: number;
  status: TripStatus;
  rating: number | string;
  ratingCount: number;
  driverName?: string | null;
  vehicleImage?: string | null;
  vehicleType?: string | null;
  passengerName?: string | null;
  issuedDate?: string | null;
  source?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type BookingStatus =
  | 'PENDING_PAYMENT'
  | 'PAYMENT_UNDER_REVIEW'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'CANCELLED';

export interface PassengerInfo {
  fullName: string;
  phone?: string;
  identityNumber?: string;
}

export interface BookingItem {
  id: string;
  bookingNumber: string;
  userId: string;
  user?: AuthUser;
  tripId: string;
  trip?: TripItem;
  seatsCount: number;
  seatNumbers?: string | null;
  passengers?: PassengerInfo[] | null;
  pricePerSeat: number | string;
  totalAmount: number | string;
  currency: string;
  paymentMethod: string;
  invoiceImage?: string | null;
  invoiceNumber?: string | null;
  paymentNotes?: string | null;
  paymentSentAt?: string | null;
  status: BookingStatus;
  rejectionReason?: string | null;
  confirmedAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface LoginResponse {
  message: string;
  accessToken: string;
  user: AuthUser;
}

export interface OfficeSignupPayload {
  fullName: string;
  phone: string;
  email?: string;
  password: string;
  officeName: string;
  commercialRegistration?: string;
  city?: string;
  address?: string;
}

export interface SignupResponse {
  message: string;
  user: AuthUser;
}

export interface MessageResponse {
  message: string;
  success?: boolean;
}

export interface CreateTripPayload {
  serviceId: string;
  fromCity: string;
  toCity: string;
  route: string;
  departureDate: string;
  departureTime: string;
  originalPrice: number;
  discountedPrice?: number;
  currency?: string;
  totalSeats: number;
  availableSeats?: number;
  status?: TripStatus;
  driverName?: string;
  vehicleImage?: string;
  vehicleType?: string;
  notes?: string;
}

export type UpdateTripPayload = Partial<Omit<CreateTripPayload, 'serviceId'>>;

export interface ExcelImportResponse {
  message: string;
  totalRows: number;
  importedCount: number;
  failedCount: number;
  draftTrips: TripItem[];
  errors: { row: number; error: string; data?: unknown }[];
}

export type ReviewAction = 'CONFIRM' | 'REJECT';

export interface ReviewBookingPayload {
  action: ReviewAction;
  rejectionReason?: string;
}
