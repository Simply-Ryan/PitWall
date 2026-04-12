/**
 * Weather API Integration
 * 
 * Integrates real-time weather data from external APIs
 * Supports multiple weather providers with fallbacks
 */

export interface WeatherData {
  timestamp: Date;
  temperature: number; // Celsius
  humidity: number; // 0-100%
  windSpeed: number; // km/h
  windDirection: number; // degrees
  condition: 'clear' | 'light_rain' | 'heavy_rain' | 'fog' | 'snow';
  visibility: number; // meters
  pressure: number; // hPa
  source: 'openweathermap' | 'weather_api' | 'cached' | 'simulated';
}

export interface TrackWeatherForecast {
  current: WeatherData;
  forecast: Array<{
    lapEstimate: number;
    weather: WeatherData;
  }>;
  changeAlert: string | null;
}

export class WeatherIntegration {
  private openWeatherKey?: string;
  private weatherApiKey?: string;
  private cache: Map<string, { data: WeatherData; timestamp: number }> = new Map();
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes

  constructor(
    openWeatherKey?: string,
    weatherApiKey?: string,
  ) {
    this.openWeatherKey = openWeatherKey;
    this.weatherApiKey = weatherApiKey;
  }

  /**
   * Get current weather for a track
   */
  async getCurrentWeather(
    trackName: string,
    latitude: number,
    longitude: number,
  ): Promise<WeatherData> {
    // Check cache first
    const cacheKey = `${trackName}-current`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      // Try OpenWeatherMap first
      if (this.openWeatherKey) {
        const data = await this.fetchOpenWeatherMap(latitude, longitude);
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
      }

      // Try Weather API
      if (this.weatherApiKey) {
        const data = await this.fetchWeatherApi(latitude, longitude);
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
      }

      // Fallback to simulated data
      return this.generateSimulatedWeather();
    } catch (error) {
      console.warn('Weather API error:', error);
      return this.generateSimulatedWeather();
    }
  }

  /**
   * Get weather forecast for race duration
   */
  async getWeatherForecast(
    trackName: string,
    latitude: number,
    longitude: number,
    estimatedRaceLaps: number,
    avgLapTimeSeconds: number,
  ): Promise<TrackWeatherForecast> {
    const current = await this.getCurrentWeather(trackName, latitude, longitude);

    // Estimate race duration
    const raceDurationSeconds = estimatedRaceLaps * avgLapTimeSeconds;
    const raceDurationHours = raceDurationSeconds / 3600;

    // Generate forecast intervals (every 10% of race)
    const forecastIntervals = 5;
    const forecast = [];

    for (let i = 1; i <= forecastIntervals; i++) {
      const progressPercent = (i / forecastIntervals) * 100;
      const lapEstimate = Math.floor((i / forecastIntervals) * estimatedRaceLaps);

      // Simple weather evolution model
      const weather = this.evolvingWeather(current, progressPercent, raceDurationHours);

      forecast.push({
        lapEstimate,
        weather,
      });
    }

    // Detect weather changes
    const changeAlert = this.detectWeatherChange(forecast);

    return {
      current,
      forecast,
      changeAlert,
    };
  }

  /**
   * Fetch from OpenWeatherMap API
   */
  private async fetchOpenWeatherMap(
    latitude: number,
    longitude: number,
  ): Promise<WeatherData> {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${this.openWeatherKey}&units=metric`;

    const response = await fetch(url);
    const data = await response.json();

    return {
      timestamp: new Date(),
      temperature: data.main.temp,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed * 3.6, // m/s to km/h
      windDirection: data.wind.deg || 0,
      condition: this.mapOpenWeatherCondition(data.weather[0].main),
      visibility: data.visibility,
      pressure: data.main.pressure,
      source: 'openweathermap',
    };
  }

  /**
   * Fetch from Weather API
   */
  private async fetchWeatherApi(
    latitude: number,
    longitude: number,
  ): Promise<WeatherData> {
    const url = `https://api.weatherapi.com/v1/current.json?key=${this.weatherApiKey}&q=${latitude},${longitude}`;

    const response = await fetch(url);
    const data = await response.json();

    return {
      timestamp: new Date(),
      temperature: data.current.temp_c,
      humidity: data.current.humidity,
      windSpeed: data.current.wind_kph,
      windDirection: data.current.wind_degree,
      condition: this.mapWeatherApiCondition(data.current.condition.code),
      visibility: data.current.vis_km * 1000,
      pressure: data.current.pressure_mb,
      source: 'weather_api',
    };
  }

  /**
   * Generate simulated weather for testing
   */
  private generateSimulatedWeather(): WeatherData {
    const conditions: Array<'clear' | 'light_rain' | 'heavy_rain' | 'fog' | 'snow'> = [
      'clear',
      'light_rain',
      'heavy_rain',
    ];

    return {
      timestamp: new Date(),
      temperature: 15 + Math.random() * 20, // 15-35°C
      humidity: 30 + Math.random() * 70, // 30-100%
      windSpeed: Math.random() * 30, // 0-30 km/h
      windDirection: Math.random() * 360,
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      visibility: 5000 + Math.random() * 5000,
      pressure: 1013 + Math.random() * 20,
      source: 'simulated',
    };
  }

  /**
   * Model weather evolution during race
   */
  private evolvingWeather(
    baseWeather: WeatherData,
    progressPercent: number,
    raceDurationHours: number,
  ): WeatherData {
    // Simple model: weather gradually changes
    const tempChange = (progressPercent / 100) * raceDurationHours * 2; // ±2°C per hour
    const tempVariation = (Math.random() - 0.5) * 4;

    let condition = baseWeather.condition;

    // Small chance of weather change based on progress
    if (Math.random() < progressPercent / 100 * 0.3) {
      // 30% chance by end of race
      const conditions: Array<'clear' | 'light_rain' | 'heavy_rain' | 'fog' | 'snow'> = [
        'clear',
        'light_rain',
        'heavy_rain',
      ];
      condition = conditions[Math.floor(Math.random() * conditions.length)];
    }

    return {
      timestamp: new Date(Date.now() + raceDurationHours * (progressPercent / 100) * 3600000),
      temperature: Math.max(-10, Math.min(50, baseWeather.temperature + tempChange + tempVariation)),
      humidity: Math.max(0, Math.min(100, baseWeather.humidity + (Math.random() - 0.5) * 20)),
      windSpeed: Math.max(0, baseWeather.windSpeed + (Math.random() - 0.5) * 5),
      windDirection: (baseWeather.windDirection + Math.random() * 30) % 360,
      condition,
      visibility: condition === 'fog'
        ? Math.min(baseWeather.visibility, 1000)
        : baseWeather.visibility,
      pressure: baseWeather.pressure + (Math.random() - 0.5) * 3,
      source: 'simulated',
    };
  }

  /**
   * Map OpenWeatherMap conditions to our format
   */
  private mapOpenWeatherCondition(
    condition: string,
  ): 'clear' | 'light_rain' | 'heavy_rain' | 'fog' | 'snow' {
    const lower = condition.toLowerCase();

    if (lower.includes('clear') || lower.includes('sunny')) return 'clear';
    if (lower.includes('fog') || lower.includes('mist')) return 'fog';
    if (lower.includes('rain')) {
      return lower.includes('light') ? 'light_rain' : 'heavy_rain';
    }
    if (lower.includes('snow')) return 'snow';

    return 'clear';
  }

  /**
   * Map WeatherAPI conditions to our format
   */
  private mapWeatherApiCondition(
    code: number,
  ): 'clear' | 'light_rain' | 'heavy_rain' | 'fog' | 'snow' {
    // WeatherAPI codes
    if (code === 1000) return 'clear';
    if (code === 1003 || code === 1006 || code === 1009) return 'clear';
    if (code === 1030 || code === 1135 || code === 1147) return 'fog';
    if (code >= 1063 && code <= 1087) return 'light_rain'; // Drizzle/Rain
    if (code >= 1150 && code <= 1258) {
      return code >= 1243 ? 'heavy_rain' : 'light_rain';
    }
    if (code >= 1261 || code >= 1273) return 'snow';

    return 'clear';
  }

  /**
   * Detect significant weather changes
   */
  private detectWeatherChange(forecast: TrackWeatherForecast['forecast']): string | null {
    if (forecast.length < 2) return null;

    const current = forecast[0].weather;
    const later = forecast[forecast.length - 1].weather;

    // Check for major condition change
    if (current.condition !== later.condition) {
      const change = `${current.condition} → ${later.condition}`;
      return `Weather changing during race: ${change}`;
    }

    // Check for significant temperature change
    if (Math.abs(later.temperature - current.temperature) > 10) {
      return `Significant temperature change: ${current.temperature.toFixed(0)}°C → ${later.temperature.toFixed(0)}°C`;
    }

    // Check for wind increase
    if (later.windSpeed > current.windSpeed * 1.5) {
      return `Wind expected to increase significantly`;
    }

    return null;
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}
