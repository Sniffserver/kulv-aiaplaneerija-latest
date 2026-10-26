import React, { useEffect, useState } from 'react';
import { useGarden } from '../context/GardenContext';
import { Cloud, Thermometer, Droplets, RefreshCw } from 'lucide-react';

interface WeatherData {
  main: { temp: number; humidity: number };
  weather: { description: string; icon: string }[];
  name: string;
}

export const WeatherOverview: React.FC = () => {
  const { settings, weather: gardenWeather } = useGarden();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async () => {
    if (!settings.lat || !settings.lng) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/weather?lat=${settings.lat}&lon=${settings.lng}`);
      if (!response.ok) {
        if (gardenWeather) {
          setWeather({
            name: gardenWeather.locationName || 'Aed',
            main: {
              temp: gardenWeather.temperature,
              humidity: gardenWeather.relativeHumidity ?? 65
            },
            weather: [
              {
                description: gardenWeather.weatherDescription,
                icon: gardenWeather.icon
              }
            ]
          });
          return;
        }
        throw new Error('Failed to fetch weather');
      }
      const data = await response.json();
      setWeather(data);
    } catch {
      if (gardenWeather) {
        setWeather({
          name: gardenWeather.locationName || 'Aed',
          main: {
            temp: gardenWeather.temperature,
            humidity: gardenWeather.relativeHumidity ?? 65
          },
          weather: [
            {
              description: gardenWeather.weatherDescription,
              icon: gardenWeather.icon
            }
          ]
        });
      } else {
        setError('Could not load weather');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, [settings.lat, settings.lng]);

  if (error) return <div className="p-4 bg-red-100 rounded-lg text-red-800">{error}</div>;
  if (!weather) return <div className="p-4">Loading weather...</div>;

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{weather.name}</h3>
        <button onClick={fetchWeather} disabled={loading} className="p-1 rounded hover:bg-gray-100" title="Värskenda">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-4xl font-bold">{Math.round(weather.main.temp)}°C</div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1 text-gray-600">
            <Cloud size={16} /> {weather.weather[0]?.description}
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <Droplets size={16} /> {weather.main.humidity}% Õhuniiskus
          </div>
        </div>
      </div>
    </div>
  );
};
