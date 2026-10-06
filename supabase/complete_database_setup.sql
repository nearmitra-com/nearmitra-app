-- COMPLETE DATABASE SETUP
-- Description: Resets and rebuilds the database schema with all fixes and seed data.
-- Run this script in the Supabase SQL Editor.

-- Enable PGCrypto for password hashing if needed
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Clean up existing objects (Order matters!)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.provider_profiles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;

-- 2. Define Types
CREATE TYPE public.app_role AS ENUM ('admin', 'provider');

-- 3. Create Tables

-- user_roles: Links auth.users to roles
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- profiles: Basic user profile
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- provider_profiles: Extended profile for providers
CREATE TABLE public.provider_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    skills TEXT[] DEFAULT '{}',
    avatar_url TEXT,
    address TEXT,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.provider_profiles ENABLE ROW LEVEL SECURITY;

-- services: Available services
CREATE TABLE public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_en TEXT NOT NULL,
    name_hi TEXT NOT NULL,
    name_mr TEXT NOT NULL,
    icon TEXT NOT NULL,
    starting_price INTEGER NOT NULL DEFAULT 199,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- bookings: Service bookings
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    service_id UUID REFERENCES public.services(id),
    address TEXT NOT NULL,
    description TEXT,
    preferred_time TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'completed', 'cancelled')),
    assigned_provider_id UUID REFERENCES public.provider_profiles(id),
    payment_amount INTEGER DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 4. Helper Functions

-- has_role: Check if a user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- update_updated_at_column: Automatically update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- handle_new_user: Trigger to create roles and profiles on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role public.app_role;
  v_skills text[];
BEGIN
  -- Extract role from metadata
  IF new.raw_user_meta_data->>'role' IS NOT NULL THEN
    v_role := (new.raw_user_meta_data->>'role')::public.app_role;
  ELSE 
    -- Default to NULL or handle gracefully.
    -- If no role is specified, we might want to do nothing or default to customer (if we had a customer role)
    -- For now, if no role, we just return.
    RETURN new; 
  END IF;

  -- Insert into user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, v_role);

  -- If role is provider, insert into provider_profiles
  IF v_role = 'provider' THEN
    SELECT ARRAY(
      SELECT jsonb_array_elements_text(
        COALESCE(new.raw_user_meta_data->'skills', '[]'::jsonb)
      )
    ) INTO v_skills;

    INSERT INTO public.provider_profiles (
      user_id,
      full_name,
      phone,
      skills,
      address,
      created_at,
      updated_at
    ) VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'full_name', ''),
      COALESCE(new.raw_user_meta_data->>'phone', ''),
      v_skills,
      new.raw_user_meta_data->>'address',
      now(),
      now()
    );
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Triggers

-- Auth Trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Timestamp Triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_provider_profiles_updated_at BEFORE UPDATE ON public.provider_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. RLS Policies

-- user_roles Policies
-- FIX: Avoid recursion by only allowing users to view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- profiles Policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- provider_profiles Policies
CREATE POLICY "Providers can view their own profile"
ON public.provider_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Providers can update their own profile"
ON public.provider_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Providers can insert their own profile"
ON public.provider_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all provider profiles"
ON public.provider_profiles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- services Policies
CREATE POLICY "Anyone can view active services"
ON public.services FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage services"
ON public.services FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- bookings Policies
CREATE POLICY "Anyone can create bookings"
ON public.bookings FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all bookings"
ON public.bookings FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all bookings"
ON public.bookings FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Providers can view their assigned bookings"
ON public.bookings FOR SELECT
USING (
    assigned_provider_id IN (
        SELECT id FROM public.provider_profiles WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Providers can update their assigned bookings"
ON public.bookings FOR UPDATE
USING (
    assigned_provider_id IN (
        SELECT id FROM public.provider_profiles WHERE user_id = auth.uid()
    )
);

-- 7. Seed Data

INSERT INTO public.services (name_en, name_hi, name_mr, icon, starting_price) VALUES
('Electrician', 'इलेक्ट्रीशियन', 'इलेक्ट्रिशियन', 'Zap', 199),
('Plumber', 'प्लंबर', 'प्लंबर', 'Droplets', 249),
('Carpenter', 'कारपेंटर', 'सुतार', 'Hammer', 299),
('Painter', 'पेंटर', 'रंगारी', 'Paintbrush', 499),
('AC Repair', 'एसी की मरम्मत', 'एसी दुरुस्ती', 'Wind', 599),
('Cleaning', 'सफाई', 'साफसफाई', 'Sparkles', 399);

-- 8. (Optional) Create Test Admin User (Only for development)
-- You can uncomment this block if you want to create a default admin user.
/*
DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
  target_email text := 'admin@ nearmitra.com';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = target_email) THEN
    INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
    VALUES (
      new_user_id, 
      'authenticated', 
      'authenticated', 
      target_email, 
      crypt('Admin@123', gen_salt('bf')), 
      now(),
      '{"role": "admin"}'
    );
    INSERT INTO public.user_roles (user_id, role) VALUES (new_user_id, 'admin');
  END IF;
END $$;
*/
