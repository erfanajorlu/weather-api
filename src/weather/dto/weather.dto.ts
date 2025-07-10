import { IsString, IsOptional, IsDateString } from 'class-validator';

export class GetWeatherDto {
  @IsString()
  location: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  unitGroup?: 'metric' | 'us' | 'uk';
}

export interface WeatherResponse {
  location: string;
  resolvedAddress: string;
  timezone: string;
  days: DayWeather[];
  currentConditions?: CurrentConditions;
}

export interface DayWeather {
  datetime: string;
  temp: number;
  tempmax: number;
  tempmin: number;
  humidity: number;
  conditions: string;
  description: string;
  icon: string;
  windspeed: number;
  winddir: number;
  pressure: number;
  visibility: number;
  uvindex: number;
  sunrise: string;
  sunset: string;
}

export interface CurrentConditions {
  datetime: string;
  temp: number;
  humidity: number;
  conditions: string;
  icon: string;
  windspeed: number;
  winddir: number;
  pressure: number;
  visibility: number;
  uvindex: number;
}
