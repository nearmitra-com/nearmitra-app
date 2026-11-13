// Local JSON-based Database Engine for LocalFix
// Replaces Supabase with a robust localStorage + in-memory store

export interface DbService {
  id: string;
  name_en: string;
  name_hi: string;
  name_mr: string;
  starting_price: number;
  is_active: boolean;
  description: string;
  category?: string;
  image?: string;
}

export interface DbUser {
  id: string;
  email: string;
  phone?: string;
  password?: string;
  role: 'admin' | 'provider' | 'customer';
  user_metadata?: Record<string, unknown>;
  created_at: string;
}

export interface DbProviderProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  skills: string[];
  is_approved: boolean;
  is_available: boolean;
  rating: number;
  completed_jobs: number;
  address: string;
  latitude?: number;
  longitude?: number;
  service_radius_km?: number;
  experience_years?: number;
  hourly_rate?: number;
  avatar_url?: string;
  created_at: string;
}

export interface DbBooking {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  service_id: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
  preferred_time?: string | null;
  status: 'pending' | 'pending_provider' | 'accepted' | 'in_progress' | 'reached_site' | 'completed' | 'cancelled' | 'rejected';
  assigned_provider_id?: string | null;
  payment_amount?: number | null;
  reached_site?: boolean;
  before_photo_url?: string | null;
  after_photo_url?: string | null;
  image_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbReview {
  id: string;
  booking_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface DbNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'booking' | 'approval';
  is_read: boolean;
  link?: string;
  created_at: string;
}

export interface DbPhoneOtp {
  id: string;
  phone: string;
  otp: string;
  verified: boolean;
  expires_at: string;
  created_at: string;
}

export interface LocalDbState {
  services: DbService[];
  users: DbUser[];
  provider_profiles: DbProviderProfile[];
  user_roles: { id?: string; user_id: string; role: string }[];
  bookings: DbBooking[];
  reviews: DbReview[];
  notifications: DbNotification[];
  phone_otps: DbPhoneOtp[];
  storage_files: Record<string, string>; // path -> base64/url
}

const STORAGE_KEY = 'nearmitra_mock_database_v2';

export const INITIAL_SERVICES: DbService[] = [
  {
    id: 'serv-electrician',
    name_en: 'Electrician',
    name_hi: 'इलेक्ट्रीशियन',
    name_mr: 'इलेक्ट्रिशियन',
    starting_price: 199,
    is_active: true,
    description: 'Wiring, switch repair, fan installation & repairs',
    category: 'electrician',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'serv-plumber',
    name_en: 'Plumber',
    name_hi: 'प्लंबर',
    name_mr: 'प्लंबर',
    starting_price: 199,
    is_active: true,
    description: 'Tap repair, pipe leaks, bathroom fittings',
    category: 'plumber',
    image: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'serv-carpenter',
    name_en: 'Carpenter',
    name_hi: 'बढ़ई',
    name_mr: 'सुतार',
    starting_price: 249,
    is_active: true,
    description: 'Furniture repair, door lock installation, woodwork',
    category: 'carpenter',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'serv-painter',
    name_en: 'Painter',
    name_hi: 'पेंटर',
    name_mr: 'रंगारी',
    starting_price: 299,
    is_active: true,
    description: 'Wall painting, touch up, waterproofing',
    category: 'painter',
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'serv-ac',
    name_en: 'AC Repair & Service',
    name_hi: 'एसी रिपेयर',
    name_mr: 'एसी दुरुस्ती',
    starting_price: 349,
    is_active: true,
    description: 'Filter cleaning, cooling fix, gas refill',
    category: 'acRepair',
    image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'serv-cleaning',
    name_en: 'Deep Cleaning',
    name_hi: 'डीप क्लीनिंग',
    name_mr: 'खोल स्वच्छता',
    starting_price: 499,
    is_active: true,
    description: 'Kitchen, bathroom and full home deep clean',
    category: 'cleaning',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'serv-maid',
    name_en: 'House Maid',
    name_hi: 'घरेलू सहायिका',
    name_mr: 'घरकामगार',
    starting_price: 299,
    is_active: true,
    description: 'Daily home chores, cooking, cleaning & dusting assistance',
    category: 'houseMaid',
    image: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=600&auto=format&fit=crop&q=80',
  },
];

export const INITIAL_USERS: DbUser[] = [
  {
    id: 'provider-demo-1',
    email: '919876543210@nearmitra.provider',
    phone: '9876543210',
    password: 'provider123',
    role: 'provider',
    user_metadata: {
      role: 'provider',
      full_name: 'Ramesh Sharma',
      phone: '9876543210',
      skills: ['Electrician', 'AC Repair & Service'],
      address: 'Shop 4, Market Road, Sector 12, Mumbai',
    },
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'provider-demo-2',
    email: '919876543211@nearmitra.provider',
    phone: '9876543211',
    password: 'provider123',
    role: 'provider',
    user_metadata: {
      role: 'provider',
      full_name: 'Suresh Patil',
      phone: '9876543211',
      skills: ['Plumber', 'Carpenter'],
      address: 'Near Metro Station, Line 2, Pune',
    },
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'customer-demo-1',
    email: 'customer@nearmitra.com',
    phone: '9822012345',
    password: 'customer123',
    role: 'customer',
    user_metadata: {
      role: 'customer',
      full_name: 'Pooja Verma',
      phone: '9822012345',
    },
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'admin-demo-1',
    email: 'admin@nearmitra.com',
    password: 'admin123',
    role: 'admin',
    user_metadata: {
      role: 'admin',
      full_name: 'Admin Manager',
    },
    created_at: '2026-01-01T00:00:00.000Z',
  },
];

export const INITIAL_PROFILES: DbProviderProfile[] = [
  {
    id: 'profile-provider-1',
    user_id: 'provider-demo-1',
    full_name: 'Ramesh Sharma',
    phone: '9876543210',
    skills: ['Electrician', 'AC Repair & Service'],
    is_approved: true,
    is_available: true,
    rating: 4.9,
    completed_jobs: 142,
    address: 'Shop 4, Linking Road, Bandra West, Mumbai',
    latitude: 19.0596,
    longitude: 72.8295,
    service_radius_km: 15,
    experience_years: 6,
    hourly_rate: 299,
    avatar_url: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'profile-provider-2',
    user_id: 'provider-demo-2',
    full_name: 'Suresh Patil',
    phone: '9876543211',
    skills: ['Plumber', 'Carpenter'],
    is_approved: true,
    is_available: true,
    rating: 4.8,
    completed_jobs: 98,
    address: 'Veera Desai Road, Andheri West, Mumbai',
    latitude: 19.1363,
    longitude: 72.8277,
    service_radius_km: 12,
    experience_years: 5,
    hourly_rate: 249,
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'profile-provider-3',
    user_id: 'provider-demo-3',
    full_name: 'Amit Kumar Gupta',
    phone: '9876543212',
    skills: ['AC Repair & Service', 'Electrician'],
    is_approved: true,
    is_available: true,
    rating: 4.95,
    completed_jobs: 215,
    address: 'Hiranandani Gardens, Powai, Mumbai',
    latitude: 19.1176,
    longitude: 72.9060,
    service_radius_km: 18,
    experience_years: 8,
    hourly_rate: 349,
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    created_at: '2026-01-02T00:00:00.000Z',
  },
  {
    id: 'profile-provider-4',
    user_id: 'provider-demo-4',
    full_name: 'Anita Shinde',
    phone: '9876543213',
    skills: ['House Maid', 'Deep Cleaning'],
    is_approved: true,
    is_available: true,
    rating: 4.85,
    completed_jobs: 178,
    address: 'Prabhadevi, Dadar, Mumbai',
    latitude: 19.0178,
    longitude: 72.8478,
    service_radius_km: 10,
    experience_years: 4,
    hourly_rate: 199,
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    created_at: '2026-01-03T00:00:00.000Z',
  },
  {
    id: 'profile-provider-5',
    user_id: 'provider-demo-5',
    full_name: 'Rajesh Verma',
    phone: '9876543214',
    skills: ['Painter', 'Carpenter'],
    is_approved: true,
    is_available: true,
    rating: 4.7,
    completed_jobs: 84,
    address: 'Kurla Complex, BKC, Mumbai',
    latitude: 19.0680,
    longitude: 72.8687,
    service_radius_km: 15,
    experience_years: 7,
    hourly_rate: 279,
    avatar_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    created_at: '2026-01-04T00:00:00.000Z',
  },
  {
    id: 'profile-provider-6',
    user_id: 'provider-demo-6',
    full_name: 'Vikram Kamble',
    phone: '9876543215',
    skills: ['Plumber', 'Electrician'],
    is_approved: true,
    is_available: true,
    rating: 4.9,
    completed_jobs: 130,
    address: 'Gokhale Road, Thane West, Maharashtra',
    latitude: 19.2183,
    longitude: 72.9781,
    service_radius_km: 20,
    experience_years: 6,
    hourly_rate: 249,
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    created_at: '2026-01-05T00:00:00.000Z',
  },
  {
    id: 'profile-provider-7',
    user_id: 'provider-demo-7',
    full_name: 'Ganesh Deshmukh',
    phone: '9876543216',
    skills: ['Electrician', 'Plumber'],
    is_approved: true,
    is_available: true,
    rating: 4.88,
    completed_jobs: 112,
    address: 'FC Road, Shivajinagar, Pune',
    latitude: 18.5314,
    longitude: 73.8446,
    service_radius_km: 15,
    experience_years: 5,
    hourly_rate: 229,
    avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    created_at: '2026-01-06T00:00:00.000Z',
  },
  {
    id: 'profile-provider-8',
    user_id: 'provider-demo-8',
    full_name: 'Sunil Jadhav',
    phone: '9876543217',
    skills: ['AC Repair & Service', 'Deep Cleaning'],
    is_approved: true,
    is_available: true,
    rating: 4.92,
    completed_jobs: 164,
    address: 'Phase 1, Hinjewadi IT Park, Pune',
    latitude: 18.5913,
    longitude: 73.7389,
    service_radius_km: 18,
    experience_years: 7,
    hourly_rate: 329,
    avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    created_at: '2026-01-07T00:00:00.000Z',
  },
];

export const INITIAL_BOOKINGS: DbBooking[] = [
  {
    id: 'bk-101',
    customer_id: 'customer-demo-1',
    customer_name: 'Pooja Verma',
    customer_phone: '9822012345',
    service_id: 'serv-electrician',
    status: 'pending_provider',
    address: 'Flat 402, Green Valley Apartments, Mumbai',
    latitude: 19.0657,
    longitude: 72.8687,
    assigned_provider_id: 'profile-provider-1',
    description: 'Switch sparking and ceiling fan making humming noise',
    preferred_time: 'Tomorrow 10:00 AM',
    payment_amount: 199,
    reached_site: false,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'bk-102',
    customer_id: 'customer-demo-1',
    customer_name: 'Pooja Verma',
    customer_phone: '9822012345',
    service_id: 'serv-ac',
    status: 'in_progress',
    address: 'Flat 402, Green Valley Apartments, Mumbai',
    latitude: 19.0657,
    longitude: 72.8687,
    assigned_provider_id: 'profile-provider-1',
    description: 'AC cooling issue and filter cleaning in bedroom',
    preferred_time: 'Today 2:00 PM',
    payment_amount: 349,
    reached_site: true,
    before_photo_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'bk-103',
    customer_id: 'customer-demo-1',
    customer_name: 'Pooja Verma',
    customer_phone: '9822012345',
    service_id: 'serv-plumber',
    status: 'completed',
    address: 'Flat 402, Green Valley Apartments, Mumbai',
    latitude: 19.0657,
    longitude: 72.8687,
    assigned_provider_id: 'profile-provider-2',
    description: 'Kitchen sink pipe blockage and tap leakage',
    preferred_time: 'Yesterday 11:00 AM',
    payment_amount: 299,
    reached_site: true,
    before_photo_url: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=500&auto=format&fit=crop',
    after_photo_url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop',
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 46).toISOString(),
  },
];

export const INITIAL_REVIEWS: DbReview[] = [
  {
    id: 'rev-1',
    booking_id: 'bk-103',
    rating: 5,
    comment: 'Super fast and clean plumbing work! Very polite provider.',
    created_at: new Date(Date.now() - 3600000 * 45).toISOString(),
  },
];

export const INITIAL_NOTIFICATIONS: DbNotification[] = [
  {
    id: 'notif-1',
    user_id: 'customer-demo-1',
    title: 'Booking Received',
    message: 'Your booking for Electrician has been submitted successfully!',
    type: 'success',
    link: '/track',
    is_read: false,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'notif-2',
    user_id: 'provider-demo-1',
    title: 'New Job Assigned',
    message: 'You have a new booking request for Electrician in Mumbai.',
    type: 'booking',
    link: '/provider',
    is_read: false,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

class LocalDatabase {
  private state: LocalDbState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): LocalDbState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Ensure all required arrays are present and have services
        if (parsed.services && parsed.services.length > 0) {
          // Ensure providers have coordinates and merge new demo providers
          if (parsed.provider_profiles && Array.isArray(parsed.provider_profiles)) {
            parsed.provider_profiles = parsed.provider_profiles.map((p: DbProviderProfile) => {
              const initMatch = INITIAL_PROFILES.find((ip) => ip.id === p.id);
              if (p.latitude === undefined || p.latitude === null) {
                if (initMatch) {
                  return { ...p, latitude: initMatch.latitude, longitude: initMatch.longitude, service_radius_km: initMatch.service_radius_km || 15 };
                }
                return { ...p, latitude: 19.0760, longitude: 72.8777, service_radius_km: 15 };
              }
              return p;
            });

            // Merge any missing initial profiles
            const existingIds = new Set(parsed.provider_profiles.map((p: DbProviderProfile) => p.id));
            for (const initP of INITIAL_PROFILES) {
              if (!existingIds.has(initP.id)) {
                parsed.provider_profiles.push(initP);
              }
            }
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse local database state, re-initializing', e);
    }

    const defaultState: LocalDbState = {
      services: INITIAL_SERVICES,
      users: INITIAL_USERS,
      provider_profiles: INITIAL_PROFILES,
      user_roles: [
        { user_id: 'provider-demo-1', role: 'provider' },
        { user_id: 'provider-demo-2', role: 'provider' },
        { user_id: 'customer-demo-1', role: 'customer' },
        { user_id: 'admin-demo-1', role: 'admin' },
      ],
      bookings: INITIAL_BOOKINGS,
      reviews: INITIAL_REVIEWS,
      notifications: INITIAL_NOTIFICATIONS,
      phone_otps: [],
      storage_files: {},
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState));
    } catch {
      // storage quota or private mode
    }

    return defaultState;
  }

  public save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      // Notify listeners in same window
      window.dispatchEvent(new CustomEvent('localdb_change', { detail: { state: this.state } }));
    } catch (e) {
      console.warn('Error saving local database', e);
    }
  }

  public getTable<K extends keyof LocalDbState>(table: K): LocalDbState[K] {
    // Reload state in case another tab or process changed it
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.state = JSON.parse(raw);
      }
    } catch { /* ignore */ }

    // If table doesn't exist, ensure array
    if (!this.state[table]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.state as any)[table] = [];
    }
    return this.state[table];
  }

  public setTable<K extends keyof LocalDbState>(table: K, data: LocalDbState[K]): void {
    this.state[table] = data;
    this.save();
  }

  public resetToDefaults(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.state = this.loadState();
    this.save();
  }
}

export const localDB = new LocalDatabase();
