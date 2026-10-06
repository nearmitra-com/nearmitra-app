-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(booking_id)
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policies
-- Since we identify customers by phone number/booking ID without strict auth,
-- we allow public inserts for now (assuming anyone with the booking ID can review).
-- In a stricter app, we would use auth or OTP.
CREATE POLICY "Public can view reviews" 
ON public.reviews FOR SELECT 
USING (true);

CREATE POLICY "Public can insert reviews" 
ON public.reviews FOR INSERT 
WITH CHECK (true);
