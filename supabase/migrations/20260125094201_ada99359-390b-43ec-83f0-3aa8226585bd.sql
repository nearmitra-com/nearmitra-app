-- Allow users to insert their own role during registration, but only as 'provider' (not admin)
CREATE POLICY "Users can register as providers"
ON public.user_roles
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND role = 'provider'::app_role
);

-- Also allow users to insert their own provider profile during registration
CREATE POLICY "Anyone can insert their own provider profile"
ON public.provider_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);