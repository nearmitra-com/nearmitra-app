-- Create Provider User Manually (Robust Version)
-- Use this to bypass "Rate Limit Exceeded" errors

DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
  target_email text := 'provider_saksham@ nearmitra.com';
  target_password text := 'Saksham@10';
BEGIN
  -- 1. Create Identity in auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    target_email,
    crypt(target_password, gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"role": "provider", "full_name": "Saksham Provider", "phone": "9876543210"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  -- 2. Assign Role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new_user_id, 'provider');

  -- 3. Create Profile
  INSERT INTO public.provider_profiles (
    user_id, 
    full_name, 
    phone, 
    skills, 
    address, 
    is_available
  ) VALUES (
    new_user_id,
    'Saksham Provider',
    '9876543210',
    ARRAY['Electrician', 'Plumber'], -- Default skills
    'Mumbai, India',
    true
  );

END $$;
