-- Combined Migration for  NearMitra Connect
-- 1. Base Schema
CREATE TYPE public.app_role AS ENUM ('admin', 'provider');

CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

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

CREATE POLICY "Anyone can view active services"
ON public.services FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage services"
ON public.services FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

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
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

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

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_provider_profiles_updated_at
BEFORE UPDATE ON public.provider_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.services (name_en, name_hi, name_mr, icon, starting_price) VALUES
('Electrician', 'इलेक्ट्रीशियन', 'इलेक्ट्रिशियन', 'Zap', 199),
('Plumber', 'प्लंबर', 'प्लंबर', 'Droplets', 249),
('Carpenter', 'कारपेंटर', 'सुतार', 'Hammer', 299),
('Painter', 'पेंटर', 'रंगारी', 'Paintbrush', 499);

-- 2. Registration Policies Update
CREATE POLICY "Users can register as providers"
ON public.user_roles
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND role = 'provider'::app_role
);

CREATE POLICY "Anyone can insert their own provider profile"
ON public.provider_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 3. Payment Column Update
ALTER TABLE public.bookings 
ADD COLUMN payment_amount integer DEFAULT NULL;
