
-- PART 1: Modify Tables
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES auth.users(id);

-- PART 2: Update Bookings Policies
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Customers can create their own bookings" ON public.bookings;

CREATE POLICY "Customers can create their own bookings" 
ON public.bookings FOR INSERT 
WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Customers can view their own bookings" ON public.bookings;

CREATE POLICY "Customers can view their own bookings" 
ON public.bookings FOR SELECT 
USING (auth.uid() = customer_id);

-- PART 3: Update Reviews Policies
DROP POLICY IF EXISTS "Public can view reviews" ON public.reviews;
DROP POLICY IF EXISTS "Public can insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Customers can insert reviews for their own bookings" ON public.reviews;

CREATE POLICY "Public can view reviews" 
ON public.reviews FOR SELECT 
USING (true);

CREATE POLICY "Customers can insert reviews for their own bookings" 
ON public.reviews FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.bookings b 
        WHERE b.id = booking_id 
        AND b.customer_id = auth.uid() 
        AND b.status = 'completed'
    )
);
