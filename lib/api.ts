import type {
  AuthUser,
  BookingItem,
  CreateTripPayload,
  ExcelImportResponse,
  LoginResponse,
  MessageResponse,
  OfficeSignupPayload,
  ReviewBookingPayload,
  ServiceItem,
  SignupResponse,
  TripItem,
  UpdateTripPayload,
} from './types';

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
).replace(/\/$/, '');

export function resolveMediaUrl(path?: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function apiRequest<T>(
  path: string,
  options: RequestInit & { token?: string; isFormData?: boolean } = {}
): Promise<T> {
  const { token, headers, isFormData, ...rest } = options;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch {
    throw new ApiError(
      'تعذر الاتصال بالخادم. تأكد من تشغيل خادم الـ API (reservation_system) على المنفذ الصحيح.',
      0
    );
  }

  let data: Record<string, unknown> | null = null;
  try {
    data = (await response.json()) as Record<string, unknown>;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const rawMessage = data?.message;
    const message = Array.isArray(rawMessage)
      ? String(rawMessage[0])
      : typeof rawMessage === 'string'
        ? rawMessage
        : 'حدث خطأ أثناء الاتصال بالخادم.';
    throw new ApiError(message, response.status);
  }

  return data as T;
}

export const authApi = {
  checkPhone(phone: string) {
    return apiRequest<{ available: boolean; message: string }>('/users/check-phone', {
      method: 'POST',
      body: JSON.stringify({ phone: phone.trim() }),
    });
  },

  checkEmail(email: string) {
    return apiRequest<{ available: boolean; message: string }>('/users/check-email', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim() }),
    });
  },

  login(identifier: string, password: string) {
    return apiRequest<LoginResponse>('/users/login', {
      method: 'POST',
      body: JSON.stringify({
        identifier: identifier.trim(),
        password,
      }),
    });
  },

  signupOffice(payload: OfficeSignupPayload) {
    const body: Record<string, string> = {
      fullName: payload.fullName.trim(),
      phone: payload.phone.trim(),
      password: payload.password,
      role: 'office',
      officeName: payload.officeName.trim(),
    };
    if (payload.email?.trim()) body.email = payload.email.trim();
    if (payload.commercialRegistration?.trim()) {
      body.commercialRegistration = payload.commercialRegistration.trim();
    }
    if (payload.city?.trim()) body.city = payload.city.trim();
    if (payload.address?.trim()) body.address = payload.address.trim();

    return apiRequest<SignupResponse>('/users/signup', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  verifyOtp(identifier: string, otpCode: string) {
    return apiRequest<MessageResponse>('/users/verify-otp', {
      method: 'POST',
      body: JSON.stringify({
        identifier: identifier.trim(),
        otpCode: otpCode.trim(),
      }),
    });
  },

  resendOtp(identifier: string) {
    return apiRequest<MessageResponse>('/users/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ identifier: identifier.trim() }),
    });
  },

  forgotPassword(identifier: string) {
    return apiRequest<MessageResponse>('/users/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ identifier: identifier.trim() }),
    });
  },

  resetPassword(identifier: string, otpCode: string, newPassword: string) {
    return apiRequest<MessageResponse>('/users/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        identifier: identifier.trim(),
        otpCode: otpCode.trim(),
        newPassword,
      }),
    });
  },

  getProfile(token: string) {
    return apiRequest<AuthUser>('/users/me', {
      method: 'GET',
      token,
    });
  },
};

export const servicesApi = {
  getAll() {
    return apiRequest<ServiceItem[]>('/services');
  },

  getMyServices(token: string) {
    return apiRequest<ServiceItem[]>('/services/office/my-services', {
      method: 'GET',
      token,
    });
  },

  joinService(token: string, serviceId: string) {
    return apiRequest<MessageResponse>(`/services/${serviceId}/join`, {
      method: 'POST',
      token,
    });
  },

  leaveService(token: string, serviceId: string) {
    return apiRequest<MessageResponse>(`/services/${serviceId}/leave`, {
      method: 'DELETE',
      token,
    });
  },

  getOfficesByService(serviceId: string) {
    return apiRequest<AuthUser[]>(`/services/${serviceId}/offices`);
  },
};

export const tripsApi = {
  getMyTrips(token: string) {
    return apiRequest<TripItem[]>('/trips/office/my-trips', {
      method: 'GET',
      token,
    });
  },

  getMyDrafts(token: string) {
    return apiRequest<TripItem[]>('/trips/office/drafts', {
      method: 'GET',
      token,
    });
  },

  getById(id: string) {
    return apiRequest<TripItem>(`/trips/${id}`);
  },

  create(token: string, payload: CreateTripPayload) {
    return apiRequest<TripItem>('/trips', {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    });
  },

  update(token: string, id: string, payload: UpdateTripPayload) {
    return apiRequest<TripItem>(`/trips/${id}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(payload),
    });
  },

  remove(token: string, id: string) {
    return apiRequest<MessageResponse>(`/trips/${id}`, {
      method: 'DELETE',
      token,
    });
  },

  publishDraft(token: string, id: string) {
    return apiRequest<{ message: string; trip: TripItem }>(`/trips/${id}/publish`, {
      method: 'PATCH',
      token,
    });
  },

  publishBulk(token: string, tripIds?: string[]) {
    return apiRequest<{ message: string; publishedCount: number }>(
      '/trips/office/publish-bulk',
      {
        method: 'POST',
        token,
        body: JSON.stringify(tripIds && tripIds.length > 0 ? { tripIds } : {}),
      }
    );
  },

  importExcel(
    token: string,
    file: File,
    options?: { serviceId?: string; defaultSeats?: number }
  ) {
    const formData = new FormData();
    formData.append('file', file);
    if (options?.serviceId) formData.append('serviceId', options.serviceId);
    if (options?.defaultSeats) {
      formData.append('defaultSeats', String(options.defaultSeats));
    }

    return apiRequest<ExcelImportResponse>('/trips/import-excel', {
      method: 'POST',
      token,
      isFormData: true,
      body: formData,
    });
  },

  getSampleExcelUrl() {
    return `${API_BASE_URL}/trips/sample-excel`;
  },
};

export const bookingsApi = {
  getOfficeBookings(token: string) {
    return apiRequest<BookingItem[]>('/bookings/office/my-trips-bookings', {
      method: 'GET',
      token,
    });
  },

  getById(token: string, id: string) {
    return apiRequest<BookingItem>(`/bookings/${id}`, {
      method: 'GET',
      token,
    });
  },

  reviewBooking(token: string, id: string, payload: ReviewBookingPayload) {
    return apiRequest<BookingItem>(`/bookings/${id}/review`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(payload),
    });
  },
};
