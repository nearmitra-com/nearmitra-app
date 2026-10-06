-- Update service prices to match the existing website data
UPDATE public.services SET starting_price = 199 WHERE name_en = 'Electrician';
UPDATE public.services SET starting_price = 199 WHERE name_en = 'Plumber';
UPDATE public.services SET starting_price = 249 WHERE name_en = 'Carpenter';
UPDATE public.services SET starting_price = 299 WHERE name_en = 'Painter';
UPDATE public.services SET starting_price = 349 WHERE name_en = 'AC Repair';
UPDATE public.services SET starting_price = 499 WHERE name_en = 'Cleaning';
