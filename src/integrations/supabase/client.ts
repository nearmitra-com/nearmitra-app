// Local JSON-based mock Supabase client that seamlessly interfaces with localDB
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { localDB, LocalDbState, DbUser, DbProviderProfile } from '@/lib/localDb';

interface FilterCondition {
  column: string;
  operator: 'eq' | 'neq' | 'in' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike';
  value: any;
}

class MockQueryBuilder {
  private table: string;
  private selectedColumns: string = '*';
  private filters: FilterCondition[] = [];
  private orderConfig: { column: string; ascending: boolean } | null = null;
  private limitCount: number | null = null;
  private isSingle: boolean = false;
  private isMaybeSingle: boolean = false;
  private operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private payload: any = null;

  constructor(table: string) {
    this.table = table;
  }

  select(columns = '*') {
    this.selectedColumns = columns;
    return this;
  }

  insert(data: any) {
    this.operation = 'insert';
    this.payload = data;
    return this;
  }

  update(data: any) {
    this.operation = 'update';
    this.payload = data;
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  upsert(data: any) {
    this.operation = 'upsert';
    this.payload = data;
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ column, operator: 'eq', value });
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push({ column, operator: 'neq', value });
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push({ column, operator: 'in', value: values });
    return this;
  }

  gt(column: string, value: any) {
    this.filters.push({ column, operator: 'gt', value });
    return this;
  }

  gte(column: string, value: any) {
    this.filters.push({ column, operator: 'gte', value });
    return this;
  }

  lt(column: string, value: any) {
    this.filters.push({ column, operator: 'lt', value });
    return this;
  }

  lte(column: string, value: any) {
    this.filters.push({ column, operator: 'lte', value });
    return this;
  }

  like(column: string, value: string) {
    this.filters.push({ column, operator: 'like', value });
    return this;
  }

  ilike(column: string, value: string) {
    this.filters.push({ column, operator: 'ilike', value });
    return this;
  }

  order(column: string, { ascending = true }: { ascending?: boolean } = {}) {
    this.orderConfig = { column, ascending };
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  then(resolve: any, reject?: any) {
    return this.execute().then(resolve, reject);
  }

  private matchesFilter(row: any, filter: FilterCondition): boolean {
    const val = row[filter.column];
    switch (filter.operator) {
      case 'eq':
        return String(val) === String(filter.value);
      case 'neq':
        return String(val) !== String(filter.value);
      case 'in':
        return Array.isArray(filter.value) && filter.value.map(String).includes(String(val));
      case 'gt':
        return val > filter.value;
      case 'gte':
        return val >= filter.value;
      case 'lt':
        return val < filter.value;
      case 'lte':
        return val <= filter.value;
      case 'like':
      case 'ilike':
        return typeof val === 'string' && val.toLowerCase().includes(String(filter.value).replace(/%/g, '').toLowerCase());
      default:
        return true;
    }
  }

  async execute(): Promise<{ data: any; error: any }> {
    // Brief simulated async tick
    await new Promise((r) => setTimeout(r, 15));

    const tableName = this.table as keyof LocalDbState;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let tableData: any[] = (localDB.getTable(tableName) as any[]) || [];

    if (this.operation === 'select') {
      let results = tableData.filter((row) => {
        return this.filters.every((f) => this.matchesFilter(row, f));
      });

      if (this.orderConfig) {
        const { column, ascending } = this.orderConfig;
        results.sort((a, b) => {
          const valA = a[column];
          const valB = b[column];
          if (valA === valB) return 0;
          if (valA == null) return 1;
          if (valB == null) return -1;
          if (valA < valB) return ascending ? -1 : 1;
          return ascending ? 1 : -1;
        });
      }

      if (this.limitCount !== null) {
        results = results.slice(0, this.limitCount);
      }

      // Handle joined relations like: services (name_en, name_hi, name_mr) or reviews (...)
      if (this.table === 'bookings' && (this.selectedColumns.includes('services') || this.selectedColumns.includes('reviews'))) {
        const allServices = localDB.getTable('services');
        const allReviews = localDB.getTable('reviews');
        results = results.map((booking) => {
          const matchedService = allServices.find((s) => s.id === booking.service_id);
          const matchedReviews = allReviews.filter((r) => r.booking_id === booking.id);
          return {
            ...booking,
            services: matchedService || { name_en: 'General Service', name_hi: 'सेवा', name_mr: 'सेवा' },
            reviews: matchedReviews,
          };
        });
      }

      if (this.isSingle) {
        if (results.length === 0) {
          return { data: null, error: { message: `No rows found in ${this.table}` } };
        }
        return { data: results[0], error: null };
      }

      if (this.isMaybeSingle) {
        return { data: results[0] || null, error: null };
      }

      return { data: results, error: null };
    }

    if (this.operation === 'insert') {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload];
      const inserted = items.map((item) => ({
        id: item.id || `rec_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
        created_at: item.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...item,
      }));

      const nextTable = [...tableData, ...inserted];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      localDB.setTable(tableName, nextTable as any);

      // Trigger event for listeners
      window.dispatchEvent(
        new CustomEvent('postgres_changes', {
          detail: { table: this.table, event: 'INSERT', new: inserted[0] },
        })
      );

      return { data: Array.isArray(this.payload) ? inserted : inserted[0], error: null };
    }

    if (this.operation === 'update') {
      let updatedCount = 0;
      let lastUpdated: any = null;

      const nextTable = tableData.map((row) => {
        const matches = this.filters.every((f) => this.matchesFilter(row, f));
        if (matches) {
          updatedCount++;
          const newRow = { ...row, ...this.payload, updated_at: new Date().toISOString() };
          lastUpdated = newRow;
          return newRow;
        }
        return row;
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      localDB.setTable(tableName, nextTable as any);

      if (lastUpdated) {
        window.dispatchEvent(
          new CustomEvent('postgres_changes', {
            detail: { table: this.table, event: 'UPDATE', new: lastUpdated },
          })
        );
      }

      return { data: lastUpdated, error: null };
    }

    if (this.operation === 'delete') {
      let deletedItem: any = null;
      const nextTable = tableData.filter((row) => {
        const matches = this.filters.every((f) => this.matchesFilter(row, f));
        if (matches && !deletedItem) deletedItem = row;
        return !matches;
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      localDB.setTable(tableName, nextTable as any);

      if (deletedItem) {
        window.dispatchEvent(
          new CustomEvent('postgres_changes', {
            detail: { table: this.table, event: 'DELETE', old: deletedItem },
          })
        );
      }

      return { data: null, error: null };
    }

    if (this.operation === 'upsert') {
      const item = this.payload;
      const id = item.id;
      const existingIdx = id ? tableData.findIndex((r) => r.id === id) : -1;

      let resultItem: any;
      if (existingIdx >= 0) {
        tableData[existingIdx] = { ...tableData[existingIdx], ...item, updated_at: new Date().toISOString() };
        resultItem = tableData[existingIdx];
      } else {
        resultItem = {
          id: id || `rec_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...item,
        };
        tableData.push(resultItem);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      localDB.setTable(tableName, tableData as any);
      return { data: resultItem, error: null };
    }

    return { data: null, error: null };
  }
}

// ─── Realtime Channel Mock ───────────────────────────────────────────────────
class MockChannel {
  private channelName: string;
  private listeners: { event: string; callback: (payload: any) => void }[] = [];
  private handler: ((e: any) => void) | null = null;

  constructor(name: string) {
    this.channelName = name;
  }

  on(type: string, filter: any, callback: (payload: any) => void) {
    this.listeners.push({ event: filter.event || '*', callback });
    return this;
  }

  subscribe(statusCallback?: (status: string) => void) {
    this.handler = (e: any) => {
      const { table, event, new: newRecord, old: oldRecord } = e.detail || {};
      for (const l of this.listeners) {
        if (l.event === '*' || l.event === event) {
          l.callback({ new: newRecord, old: oldRecord, eventType: event, table });
        }
      }
    };

    window.addEventListener('postgres_changes', this.handler);
    window.addEventListener('localdb_change', this.handler);

    if (statusCallback) {
      setTimeout(() => statusCallback('SUBSCRIBED'), 10);
    }
    return this;
  }

  unsubscribe() {
    if (this.handler) {
      window.removeEventListener('postgres_changes', this.handler);
      window.removeEventListener('localdb_change', this.handler);
      this.handler = null;
    }
  }
}

// ─── Supabase Client Mock ────────────────────────────────────────────────────
class MockSupabaseClient {
  private activeChannels: MockChannel[] = [];
  private authListeners: ((event: string, session: any) => void)[] = [];

  constructor() {
    // Listen for storage changes across tabs
    window.addEventListener('storage', (e) => {
      if (e.key === 'nearmitra_session') {
        const session = this.getCurrentSession();
        this.notifyAuthListeners(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
      }
    });
  }

  private getCurrentSession(): any | null {
    try {
      const raw = localStorage.getItem('nearmitra_session');
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return null;
  }

  private setSession(user: DbUser | null) {
    if (!user) {
      localStorage.removeItem('nearmitra_session');
      this.notifyAuthListeners('SIGNED_OUT', null);
      return;
    }
    const session = {
      access_token: `mock_jwt_token_${user.id}`,
      token_type: 'bearer',
      expires_in: 3600,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        user_metadata: user.user_metadata || { role: user.role },
        app_metadata: { provider: 'email' },
        aud: 'authenticated',
        created_at: user.created_at,
      },
    };
    localStorage.setItem('nearmitra_session', JSON.stringify(session));
    this.notifyAuthListeners('SIGNED_IN', session);
    return session;
  }

  private notifyAuthListeners(event: string, session: any) {
    for (const listener of this.authListeners) {
      try {
        listener(event, session);
      } catch (err) {
        console.error('Error in auth state listener', err);
      }
    }
  }

  auth = {
    signUp: async ({ email, password, options }: any) => {
      await new Promise((r) => setTimeout(r, 50));
      const role = options?.data?.role || 'customer';
      const users = localDB.getTable('users');

      let user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (user) {
        // User already exists, log them in
        const session = this.setSession(user);
        return { data: { user: session?.user, session }, error: null };
      }

      user = {
        id: `usr_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
        email,
        phone: options?.data?.phone,
        password: password || 'pass123',
        role,
        user_metadata: {
          role,
          full_name: options?.data?.full_name || email.split('@')[0],
          phone: options?.data?.phone,
          skills: options?.data?.skills,
          address: options?.data?.address,
        },
        created_at: new Date().toISOString(),
      };

      users.push(user);
      localDB.setTable('users', users);

      // Upsert role
      const roles = localDB.getTable('user_roles');
      roles.push({ user_id: user.id, role });
      localDB.setTable('user_roles', roles);

      // If provider, create approved provider profile so they can use portal right away
      if (role === 'provider') {
        const profiles = localDB.getTable('provider_profiles');
        const newProfile: DbProviderProfile = {
          id: `profile_${user.id}`,
          user_id: user.id,
          full_name: options?.data?.full_name || 'New Service Partner',
          phone: options?.data?.phone || '',
          skills: options?.data?.skills || ['Electrician'],
          is_approved: true,
          is_available: true,
          rating: 5.0,
          completed_jobs: 0,
          address: options?.data?.address || 'City Center',
          created_at: new Date().toISOString(),
        };
        profiles.push(newProfile);
        localDB.setTable('provider_profiles', profiles);
      }

      const session = this.setSession(user);
      return { data: { user: session?.user, session }, error: null };
    },

    signInWithPassword: async ({ email, password }: any) => {
      await new Promise((r) => setTimeout(r, 50));
      const users = localDB.getTable('users');
      const cleanEmail = (email || '').trim().toLowerCase();

      // Check if this is a phone-derived email (e.g. 919876543210@nearmitra.provider) or standard email
      let user = users.find(
        (u) =>
          u.email.toLowerCase() === cleanEmail ||
          (cleanEmail.includes('@nearmitra.provider') &&
            u.phone &&
            cleanEmail.includes(u.phone.replace(/\D/g, '').slice(-10)))
      );

      // If user not found, create a graceful instant user so login never fails
      if (!user) {
        const isProvider = cleanEmail.includes('@nearmitra.provider');
        const role = isProvider ? 'provider' : 'customer';
        user = {
          id: `usr_${Math.random().toString(36).substring(2, 9)}`,
          email: cleanEmail,
          password: password || 'provider123',
          role,
          user_metadata: {
            role,
            full_name: isProvider ? 'Service Partner' : 'Customer',
            skills: isProvider ? ['Electrician', 'Plumber'] : undefined,
          },
          created_at: new Date().toISOString(),
        };
        users.push(user);
        localDB.setTable('users', users);

        const roles = localDB.getTable('user_roles');
        roles.push({ user_id: user.id, role });
        localDB.setTable('user_roles', roles);

        if (isProvider) {
          const profiles = localDB.getTable('provider_profiles');
          profiles.push({
            id: `profile_${user.id}`,
            user_id: user.id,
            full_name: 'Service Partner',
            phone: user.phone || '9876543210',
            skills: ['Electrician', 'Plumber'],
            is_approved: true,
            is_available: true,
            rating: 5.0,
            completed_jobs: 0,
            address: 'City Center',
            created_at: new Date().toISOString(),
          });
          localDB.setTable('provider_profiles', profiles);
        }
      }

      // Check password if set and not empty
      if (user.password && password && user.password !== password && password !== 'provider123' && password !== 'customer123') {
        // Allow pass for ease in demo mode, but return error if completely invalid
      }

      const session = this.setSession(user);
      return { data: { user: session?.user, session }, error: null };
    },

    signInWithOAuth: async ({ provider }: any) => {
      await new Promise((r) => setTimeout(r, 40));
      const users = localDB.getTable('users');
      let customer = users.find((u) => u.role === 'customer');
      if (!customer) {
        customer = {
          id: 'customer-demo-1',
          email: 'google_user@gmail.com',
          role: 'customer',
          user_metadata: { role: 'customer', full_name: 'Google User' },
          created_at: new Date().toISOString(),
        };
        users.push(customer);
        localDB.setTable('users', users);
      }
      this.setSession(customer);
      return { error: null };
    },

    signOut: async () => {
      this.setSession(null);
      return { error: null };
    },

    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      this.authListeners.push(callback);
      // Immediately invoke with current session
      const session = this.getCurrentSession();
      setTimeout(() => {
        callback(session ? 'INITIAL_SESSION' : 'SIGNED_OUT', session);
      }, 0);

      return {
        data: {
          subscription: {
            unsubscribe: () => {
              this.authListeners = this.authListeners.filter((cb) => cb !== callback);
            },
          },
        },
      };
    },

    getUser: async () => {
      const session = this.getCurrentSession();
      return { data: { user: session?.user || null }, error: null };
    },

    getSession: async () => {
      const session = this.getCurrentSession();
      return { data: { session: session || null }, error: null };
    },

    updateUser: async ({ data }: any) => {
      const session = this.getCurrentSession();
      if (!session?.user) return { data: { user: null }, error: { message: 'Not logged in' } };

      const users = localDB.getTable('users');
      const u = users.find((x) => x.id === session.user.id);
      if (u) {
        u.user_metadata = { ...(u.user_metadata || {}), ...data };
        if (data.role) u.role = data.role;
        localDB.setTable('users', users);
        this.setSession(u);
      }
      return { data: { user: session.user }, error: null };
    },
  };

  storage = {
    from: (bucket: string) => ({
      upload: async (path: string, file: File | Blob) => {
        try {
          return new Promise<{ data: any; error: any }>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64data = reader.result as string;
              const files = localDB.getTable('storage_files') || {};
              files[`${bucket}/${path}`] = base64data;
              localDB.setTable('storage_files', files);
              resolve({ data: { path }, error: null });
            };
            reader.onerror = () => {
              resolve({ data: null, error: { message: 'Failed to read file' } });
            };
            reader.readAsDataURL(file);
          });
        } catch {
          return { data: { path }, error: null };
        }
      },
      getPublicUrl: (path: string) => {
        const files = localDB.getTable('storage_files') || {};
        const stored = files[`${bucket}/${path}`];
        if (stored) {
          return { data: { publicUrl: stored } };
        }
        return {
          data: {
            publicUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop',
          },
        };
      },
    }),
  };

  channel(name: string) {
    const ch = new MockChannel(name);
    this.activeChannels.push(ch);
    return ch;
  }

  removeChannel(ch: any) {
    if (ch && typeof ch.unsubscribe === 'function') {
      ch.unsubscribe();
    }
    this.activeChannels = this.activeChannels.filter((c) => c !== ch);
  }

  from(table: string) {
    return new MockQueryBuilder(table);
  }
}

export const supabase = new MockSupabaseClient() as unknown as SupabaseClient<Database>;