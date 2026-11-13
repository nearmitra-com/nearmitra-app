-- 20260220000000_enable_postgis_and_nearby_providers.sql
-- Enables PostGIS and implements the hyper-local radius query for NearMitra

-- 1. Enable PostGIS Extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Add spatial columns to provider_profiles if not exists
ALTER TABLE public.provider_profiles 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS service_radius_km INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS location GEOGRAPHY(POINT, 4326),
ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS hourly_rate INTEGER DEFAULT 249;

-- 3. Create spatial index for fast geo queries
CREATE INDEX IF NOT EXISTS idx_provider_profiles_location ON public.provider_profiles USING GIST(location);

-- 4. Trigger to auto-sync the GEOGRAPHY point whenever latitude or longitude changes
CREATE OR REPLACE FUNCTION public.sync_provider_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  ELSE
    NEW.location = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_provider_location ON public.provider_profiles;
CREATE TRIGGER trg_sync_provider_location
BEFORE INSERT OR UPDATE OF latitude, longitude ON public.provider_profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_provider_location();

-- 5. Stored Procedure (RPC) to fetch nearby verified providers sorted by distance
CREATE OR REPLACE FUNCTION public.get_nearby_providers(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_meters DOUBLE PRECISION DEFAULT 15000,
  selected_service TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  full_name TEXT,
  phone TEXT,
  skills TEXT[],
  avatar_url TEXT,
  rating NUMERIC,
  completed_jobs INTEGER,
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  service_radius_km INTEGER,
  hourly_rate INTEGER,
  experience_years INTEGER,
  is_available BOOLEAN,
  distance_km DOUBLE PRECISION
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.user_id,
    p.full_name,
    p.phone,
    p.skills,
    p.avatar_url,
    p.rating,
    p.completed_jobs,
    p.address,
    p.latitude,
    p.longitude,
    p.service_radius_km,
    p.hourly_rate,
    p.experience_years,
    p.is_available,
    ROUND((ST_Distance(p.location, ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography) / 1000)::numeric, 1)::DOUBLE PRECISION as distance_km
  FROM public.provider_profiles p
  WHERE (p.is_available IS TRUE OR p.is_available IS NULL)
    AND (p.is_approved IS TRUE OR p.is_approved IS NULL)
    AND p.location IS NOT NULL
    AND ST_DWithin(
      p.location, 
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography, 
      radius_meters
    )
    AND (
      selected_service IS NULL 
      OR selected_service = '' 
      OR selected_service = 'all'
      OR selected_service = ANY(p.skills)
      OR EXISTS (
        SELECT 1 FROM unnest(p.skills) s 
        WHERE lower(s) LIKE '%' || lower(selected_service) || '%'
      )
    )
  ORDER BY distance_km ASC;
$$;
