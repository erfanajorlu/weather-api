import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { RedisService } from 'src/redis/redis.service';
import { GetWeatherDto, WeatherResponse } from './dto/weather.dto';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WeatherService {
  private baseUrl: string;
  private apiKey: string;
  private readonly cachePrefix = 'weather:';
  private readonly cacheTtl = 3600;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private redisService: RedisService,
  ) {
    this.baseUrl = this.configService.get('weather.baseUrl')!;
    this.apiKey = this.configService.get('weather.apiKey')!;

    if (!this.apiKey) {
      throw new Error('Weather API key is required');
    }
  }

  async getCurrentWeather(dto: GetWeatherDto): Promise<WeatherResponse> {
    const cacheKey = this.generateCacheKey('current', dto);

    const cachedData = await this.getCachedWeather(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Fetch from API
    const url = this.buildApiUrl(dto.location, dto.date, dto.unitGroup);
    const weatherData = await this.fetchWeatherData(url);

    // Cache the result
    await this.cacheWeatherData(cacheKey, weatherData);

    return weatherData;
  }

  async getWeatherForecast(dto: GetWeatherDto): Promise<WeatherResponse> {
    const cacheKey = this.generateCacheKey('forecast', dto);

    // Try to get from cache first
    const cachedData = await this.getCachedWeather(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // For forecast, we'll get next 7 days
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    const url = this.buildApiUrl(
      dto.location,
      dto.date || new Date().toISOString().split('T')[0],
      dto.unitGroup,
      endDate.toISOString().split('T')[0],
    );

    const weatherData = await this.fetchWeatherData(url);

    // Cache the result
    await this.cacheWeatherData(cacheKey, weatherData);

    return weatherData;
  }

  private buildApiUrl(
    location: string,
    startDate?: string,
    unitGroup = 'metric',
    endDate?: string,
  ): string {
    let url = `${this.baseUrl}/${encodeURIComponent(location)}`;

    if (startDate) {
      url += `/${startDate}`;
      if (endDate) {
        url += `/${endDate}`;
      }
    }

    const params = new URLSearchParams({
      key: this.apiKey,
      unitGroup,
      include: 'current,days',
      elements:
        'datetime,temp,tempmax,tempmin,humidity,conditions,description,icon,windspeed,winddir,pressure,visibility,uvindex,sunrise,sunset',
    });

    return `${url}?${params.toString()}`;
  }

  private async fetchWeatherData(url: string): Promise<WeatherResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<WeatherResponse>(url, {
          timeout: 10000,
          headers: {
            'User-Agent': 'NestJS Weather API Wrapper',
          },
        }),
      );

      return response.data;
    } catch (error: unknown) {
      console.log(error);
      if (error && typeof error === 'object' && 'response' in error) {
        const errorResponse = error.response as {
          status: number;
          data?: { message?: string };
        };

        const status = errorResponse.status;
        const message = errorResponse.data?.message || 'Weather API error';

        if (status === 400) {
          throw new BadRequestException(`Invalid request: ${message}`);
        } else if (status === 401) {
          throw new HttpException('Invalid API key', HttpStatus.UNAUTHORIZED);
        } else if (status === 429) {
          throw new HttpException(
            'Rate limit exceeded',
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
      }

      throw new HttpException(
        'Failed to fetch weather data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private generateCacheKey(type: string, dto: GetWeatherDto): string {
    const { location, date, unitGroup } = dto;
    return `${this.cachePrefix}${type}:${location}:${date || 'current'}:${unitGroup || 'metric'}`;
  }

  private async getCachedWeather(key: string): Promise<WeatherResponse | null> {
    try {
      const cached = await this.redisService.get(key);
      if (!cached) return null;

      // Add type safety
      const parsed = JSON.parse(cached) as WeatherResponse;
      return parsed;
    } catch (error) {
      console.error('Cache read error:', error);
      return null;
    }
  }

  private async cacheWeatherData(
    key: string,
    data: WeatherResponse,
  ): Promise<void> {
    try {
      await this.redisService.set(key, JSON.stringify(data), this.cacheTtl);
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }
}
