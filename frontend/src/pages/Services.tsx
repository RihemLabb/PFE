import { useEffect, useState } from 'react';
import { getServices } from '../api/servicesApi';

interface Service {
  _id: string;
  name: string;
  description: string;
  avgDuration: number;
  slotDuration: number;
  maxCapacityPerSlot: number;
  isActive: boolean;
}

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getServices();
        setServices(data);
      } catch (error) {
        console.error('Failed to fetch services', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-gray-500">Loading services...</div>;

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold text-gray-800">Services</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <div key={service._id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <h3 className="text-xl font-semibold text-blue-600 mb-2">{service.name}</h3>
            <p className="text-gray-600 text-sm mb-4">{service.description}</p>
            <div className="flex justify-between text-sm text-gray-500 border-t pt-4">
              <span>Duration: <b>{service.avgDuration} min</b></span>
              <span>Slot: <b>{service.slotDuration} min</b></span>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Capacity per slot: <b>{service.maxCapacityPerSlot}</b>
            </div>
            <div className="mt-4">
              <span className={`px-2 py-1 text-xs rounded-full ${service.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {service.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}