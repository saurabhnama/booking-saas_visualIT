/*
  # Booking SaaS Database Schema

  ## Overview
  Complete database schema for a professional appointment booking platform.
  Supports service providers, services, availability management, customer bookings,
  and calendar integrations.

  ## Tables Created

  ### 1. service_providers
  - `id` (uuid, primary key) - User ID from Supabase Auth
  - `email` (text, unique, required) - Provider's email address
  - `name` (text, required) - Provider's full name
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ### 2. services
  - `id` (uuid, primary key) - Service identifier
  - `name` (text, required) - Service name
  - `description` (text, optional) - Detailed service description
  - `duration` (integer, required) - Service duration in minutes
  - `price` (numeric, optional) - Service price
  - `provider_id` (uuid, required) - Reference to service_providers
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ### 3. availabilities
  - `id` (uuid, primary key) - Availability slot identifier
  - `day_of_week` (integer, required) - Day of week (0=Sunday, 6=Saturday)
  - `start_time` (text, required) - Start time in HH:mm format
  - `end_time` (text, required) - End time in HH:mm format
  - `provider_id` (uuid, required) - Reference to service_providers
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ### 4. blocked_times
  - `id` (uuid, primary key) - Blocked time identifier
  - `start_time` (timestamptz, required) - Block start timestamp
  - `end_time` (timestamptz, required) - Block end timestamp
  - `reason` (text, optional) - Reason for blocking time
  - `provider_id` (uuid, required) - Reference to service_providers
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ### 5. calendar_connections
  - `id` (uuid, primary key) - Connection identifier
  - `provider` (text, required) - Calendar provider (google/apple/outlook)
  - `access_token` (text, required) - OAuth access token
  - `refresh_token` (text, optional) - OAuth refresh token
  - `expires_at` (timestamptz, optional) - Token expiration time
  - `provider_id` (uuid, required) - Reference to service_providers
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ### 6. customers
  - `id` (uuid, primary key) - User ID from Supabase Auth
  - `email` (text, unique, required) - Customer's email address
  - `name` (text, optional) - Customer's full name
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ### 7. bookings
  - `id` (uuid, primary key) - Booking identifier
  - `start_time` (timestamptz, required) - Appointment start time
  - `end_time` (timestamptz, required) - Appointment end time
  - `status` (text, required) - Booking status (pending/confirmed/cancelled)
  - `service_id` (uuid, required) - Reference to services
  - `customer_id` (uuid, optional) - Reference to customers (for logged-in users)
  - `guest_email` (text, optional) - Guest email (for non-logged-in bookings)
  - `guest_name` (text, optional) - Guest name (for non-logged-in bookings)
  - `notes` (text, optional) - Additional booking notes
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ## Security

  ### Row Level Security (RLS)
  All tables have RLS enabled with restrictive policies.

  ### Service Providers Policies
  - Providers can view their own profile
  - Providers can update their own profile
  - Authenticated users can view all provider profiles (public directory)

  ### Services Policies
  - Anyone can view services (public directory)
  - Providers can insert their own services
  - Providers can update their own services
  - Providers can delete their own services

  ### Availabilities Policies
  - Anyone can view availabilities (for booking purposes)
  - Providers can manage their own availability schedules

  ### Blocked Times Policies
  - Anyone can view blocked times (for booking purposes)
  - Providers can manage their own blocked times

  ### Calendar Connections Policies
  - Providers can only view and manage their own calendar connections

  ### Customers Policies
  - Customers can view their own profile
  - Customers can update their own profile

  ### Bookings Policies
  - Service providers can view bookings for their services
  - Customers can view their own bookings
  - Anyone can create bookings (including guests)
  - Service providers can update booking status for their services
  - Customers can cancel their own bookings

  ## Indexes
  Performance indexes on foreign keys and frequently queried columns.
*/

-- Create service_providers table
CREATE TABLE IF NOT EXISTS service_providers (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  duration integer NOT NULL,
  price numeric(10,2),
  provider_id uuid NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create availabilities table
CREATE TABLE IF NOT EXISTS availabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time text NOT NULL,
  end_time text NOT NULL,
  provider_id uuid NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create blocked_times table
CREATE TABLE IF NOT EXISTS blocked_times (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  reason text,
  provider_id uuid NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create calendar_connections table
CREATE TABLE IF NOT EXISTS calendar_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  access_token text NOT NULL,
  refresh_token text,
  expires_at timestamptz,
  provider_id uuid NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  guest_email text,
  guest_name text,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_services_provider_id ON services(provider_id);
CREATE INDEX IF NOT EXISTS idx_availabilities_provider_id ON availabilities(provider_id);
CREATE INDEX IF NOT EXISTS idx_blocked_times_provider_id ON blocked_times(provider_id);
CREATE INDEX IF NOT EXISTS idx_calendar_connections_provider_id ON calendar_connections(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_start_time ON bookings(start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Enable Row Level Security on all tables
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE availabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Service Providers Policies
CREATE POLICY "Providers can view own profile"
  ON service_providers FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Providers can update own profile"
  ON service_providers FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Authenticated users can view all providers"
  ON service_providers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can view providers for public directory"
  ON service_providers FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Providers can insert own profile"
  ON service_providers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Services Policies
CREATE POLICY "Anyone can view services"
  ON services FOR SELECT
  USING (true);

CREATE POLICY "Providers can insert own services"
  ON services FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Providers can update own services"
  ON services FOR UPDATE
  TO authenticated
  USING (auth.uid() = provider_id)
  WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Providers can delete own services"
  ON services FOR DELETE
  TO authenticated
  USING (auth.uid() = provider_id);

-- Availabilities Policies
CREATE POLICY "Anyone can view availabilities"
  ON availabilities FOR SELECT
  USING (true);

CREATE POLICY "Providers can insert own availabilities"
  ON availabilities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Providers can update own availabilities"
  ON availabilities FOR UPDATE
  TO authenticated
  USING (auth.uid() = provider_id)
  WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Providers can delete own availabilities"
  ON availabilities FOR DELETE
  TO authenticated
  USING (auth.uid() = provider_id);

-- Blocked Times Policies
CREATE POLICY "Anyone can view blocked times"
  ON blocked_times FOR SELECT
  USING (true);

CREATE POLICY "Providers can insert own blocked times"
  ON blocked_times FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Providers can update own blocked times"
  ON blocked_times FOR UPDATE
  TO authenticated
  USING (auth.uid() = provider_id)
  WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Providers can delete own blocked times"
  ON blocked_times FOR DELETE
  TO authenticated
  USING (auth.uid() = provider_id);

-- Calendar Connections Policies
CREATE POLICY "Providers can view own calendar connections"
  ON calendar_connections FOR SELECT
  TO authenticated
  USING (auth.uid() = provider_id);

CREATE POLICY "Providers can insert own calendar connections"
  ON calendar_connections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Providers can update own calendar connections"
  ON calendar_connections FOR UPDATE
  TO authenticated
  USING (auth.uid() = provider_id)
  WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Providers can delete own calendar connections"
  ON calendar_connections FOR DELETE
  TO authenticated
  USING (auth.uid() = provider_id);

-- Customers Policies
CREATE POLICY "Customers can view own profile"
  ON customers FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Customers can update own profile"
  ON customers FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Customers can insert own profile"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Bookings Policies
CREATE POLICY "Providers can view bookings for their services"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM services
      WHERE services.id = bookings.service_id
      AND services.provider_id = auth.uid()
    )
  );

CREATE POLICY "Customers can view own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = customer_id);

CREATE POLICY "Anyone can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Providers can update booking status for their services"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM services
      WHERE services.id = bookings.service_id
      AND services.provider_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM services
      WHERE services.id = bookings.service_id
      AND services.provider_id = auth.uid()
    )
  );

CREATE POLICY "Customers can update own bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);
