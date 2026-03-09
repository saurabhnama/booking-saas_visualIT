'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Header from '@/components/header';

interface Provider {
  id: string;
  name: string;
  email: string;
  services: {
    id: string;
    name: string;
    description: string | null;
    duration: number;
    price: number | null;
  }[];
}

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    const { data } = await supabase
      .from('service_providers')
      .select(`
        *,
        services(*)
      `)
      .order('created_at', { ascending: false });

    setProviders((data as any) || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-600">Loading providers...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Service Providers</h1>
          <p className="text-gray-600">Browse available services and book appointments</p>
        </div>

        {providers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <p className="text-gray-600 mb-4">No service providers available yet.</p>
            <Link
              href="/signup"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Become a Provider
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map((provider) => (
              <div key={provider.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-xl">
                        {provider.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{provider.name}</h3>
                      <p className="text-sm text-gray-600">{provider.email}</p>
                    </div>
                  </div>

                  {provider.services && provider.services.length > 0 ? (
                    <>
                      <div className="space-y-3 mb-4">
                        {provider.services.slice(0, 2).map((service) => (
                          <div key={service.id} className="border-l-4 border-blue-600 pl-3">
                            <h4 className="font-semibold text-gray-900">{service.name}</h4>
                            {service.description && (
                              <p className="text-sm text-gray-600 line-clamp-2">{service.description}</p>
                            )}
                            <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                              <span>{service.duration} min</span>
                              {service.price && (
                                <span className="font-semibold text-blue-600">
                                  ${service.price.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      {provider.services.length > 2 && (
                        <p className="text-sm text-gray-600 mb-4">
                          +{provider.services.length - 2} more services
                        </p>
                      )}
                      <Link
                        href={`/book/${provider.id}`}
                        className="block w-full bg-blue-600 text-white text-center py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
                      >
                        Book Appointment
                      </Link>
                    </>
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-4">
                      No services available yet
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
