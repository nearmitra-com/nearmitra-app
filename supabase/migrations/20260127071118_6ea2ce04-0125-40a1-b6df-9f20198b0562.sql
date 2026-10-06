-- Add payment_amount column to bookings table
ALTER TABLE public.bookings 
ADD COLUMN payment_amount integer DEFAULT NULL;