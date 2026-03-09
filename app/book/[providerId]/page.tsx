'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import Header from '@/components/header';
import { addMinutes, format, parseISO, startOfDay, addDays } from 'date-fns';

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number | null;
}

interface Provider {
  id: string;
  name: string;
  email: string;
}

export default function BookingPage() {
  const params = useParams();
  const providerId = params.providerId as string;
  const router = useRouter();
  const { user } = useAuth();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadProviderData();
  }, [providerId]);

  const loadProviderData = async () => {
    const { data: providerData } = await supabase
      .from('service_providers')
      .select('*')
      .eq('id', providerId)
      .maybeSingle();

    const { data: servicesData } = await supabase
      .from('services')
      .select('*')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false });

    setProvider(providerData);
    setServices(servicesData || []);
    if (servicesData && servicesData.length > 0) {
      setSelectedService(servicesData[0]);
    }
    setLoading(false);
  };

  const generateTimeSlots = () => {
    const slots = [];
    const start = 9;
    const end = 17;

    for (let hour = start; hour < end; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (!selectedService || !selectedTime) {
      setError('Please select a service and time');
      setSubmitting(false);
      return;
    }

    if (!user && (!guestName || !guestEmail)) {
      setError('Please provide your name and email');
      setSubmitting(false);
      return;
    }

    const [hours, minutes] = selectedTime.split(':');
    const startTime = new Date(selectedDate);
    startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    const endTime = addMinutes(startTime, selectedService.duration);

    const bookingData: any = {
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      status: 'pending',
      service_id: selectedService.id,
      notes: notes || null,
    };

    if (user) {
      bookingData.customer_id = user.id;
    } else {
      bookingData.guest_name = guestName;
      bookingData.guest_email = guestEmail;
    }

    const { error: bookingError } = await supabase
      .from('bookings')
      .insert(bookingData);

    if (bookingError) {
      setError(bookingError.message);
      setSubmitting(false);
    } else {
      setSuccess(true);
      setTimeout(() => {
        if (user) {
          router.push('/dashboard');
        } else {
          router.push('/');
        }
      }, 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Provider not found</h1>
          <Link href="/providers" className="text-blue-600 hover:text-blue-700">
            Browse all providers
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-20">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
            <p className="text-gray-600">
              Your appointment request has been sent. The provider will confirm shortly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const timeSlots = generateTimeSlots();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Book with {provider.name}
          </h1>
          <p className="text-gray-600">{provider.email}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Service
            </label>
            <div className="grid gap-3">
              {services.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => setSelectedService(service)}
                  className={`p-4 border-2 rounded-lg text-left transition ${
                    selectedService?.id === service.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">{service.name}</h3>
                      {service.description && (
                        <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-sm text-gray-600 mt-2">
                        <span>{service.duration} min</span>
                        {service.price && (
                          <span className="font-semibold text-blue-600">
                            ${service.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
              Select Date
            </label>
            <input
              id="date"
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={(e) => setSelectedDate(parseISO(e.target.value))}
              min={format(new Date(), 'yyyy-MM-dd')}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Time
            </label>
            <div className="grid grid-cols-4 gap-2">
              {timeSlots.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => setSelectedTime(time)}
                  className={`py-2 px-3 border rounded-lg text-sm transition ${
                    selectedTime === time
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          {!user && (
            <>
              <div className="mb-4">
                <label htmlFor="guestName" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name
                </label>
                <input
                  id="guestName"
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div className="mb-6">
                <label htmlFor="guestEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Email
                </label>
                <input
                  id="guestEmail"
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>
            </>
          )}

          <div className="mb-6">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="Any special requirements or questions..."
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Booking...' : 'Confirm Booking'}
          </button>
        </form>
      </div>
    </div>
  );
}
