'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import Header from '@/components/header';

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number | null;
}

interface Booking {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  guest_name: string | null;
  guest_email: string | null;
  services: {
    name: string;
  };
  customers: {
    name: string;
    email: string;
  } | null;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isProvider, setIsProvider] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    duration: 30,
    price: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      checkUserType();
      loadData();
    }
  }, [user]);

  const checkUserType = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('service_providers')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    setIsProvider(!!data);
  };

  const loadData = async () => {
    if (!user) return;

    const { data: providerData } = await supabase
      .from('service_providers')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (providerData) {
      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false });

      setServices(servicesData || []);

      const { data: bookingsData } = await supabase
        .from('bookings')
        .select(`
          *,
          services(name),
          customers(name, email)
        `)
        .in('service_id', (servicesData || []).map(s => s.id))
        .order('start_time', { ascending: true });

      setBookings(bookingsData || []);
    } else {
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select(`
          *,
          services(name),
          customers(name, email)
        `)
        .eq('customer_id', user.id)
        .order('start_time', { ascending: true });

      setBookings(bookingsData || []);
    }

    setLoading(false);
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { error } = await supabase.from('services').insert({
      name: newService.name,
      description: newService.description || null,
      duration: newService.duration,
      price: newService.price ? parseFloat(newService.price) : null,
      provider_id: user.id,
    });

    if (!error) {
      setNewService({ name: '', description: '', duration: 30, price: '' });
      setShowServiceForm(false);
      loadData();
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId);

    if (!error) {
      loadData();
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {isProvider ? 'Provider Dashboard' : 'My Bookings'}
        </h1>

        {isProvider && (
          <>
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">My Services</h2>
                <button
                  onClick={() => setShowServiceForm(!showServiceForm)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  {showServiceForm ? 'Cancel' : 'Add Service'}
                </button>
              </div>

              {showServiceForm && (
                <form onSubmit={handleCreateService} className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Service Name
                      </label>
                      <input
                        type="text"
                        value={newService.name}
                        onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        placeholder="e.g., 30-min Consultation"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={newService.price}
                        onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        placeholder="50.00"
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newService.description}
                      onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      rows={3}
                      placeholder="Describe your service..."
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={newService.duration}
                      onChange={(e) => setNewService({ ...newService, duration: parseInt(e.target.value) })}
                      required
                      min="15"
                      step="15"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Create Service
                  </button>
                </form>
              )}

              {services.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  No services yet. Add your first service to get started.
                </p>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {services.map((service) => (
                    <div key={service.id} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-bold text-gray-900 mb-1">{service.name}</h3>
                      {service.description && (
                        <p className="text-gray-600 text-sm mb-2">{service.description}</p>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{service.duration} min</span>
                        {service.price && (
                          <span className="font-semibold text-blue-600">
                            ${service.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            {isProvider ? 'Upcoming Bookings' : 'My Appointments'}
          </h2>

          {bookings.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No bookings yet.</p>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-1">
                        {booking.services?.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-2">
                        {booking.customers?.name || booking.guest_name} ({booking.customers?.email || booking.guest_email})
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{new Date(booking.start_time).toLocaleDateString()}</span>
                        <span>{new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                          booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                    {isProvider && booking.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => handleUpdateBookingStatus(booking.id, 'cancelled')}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
