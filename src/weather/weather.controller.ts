import { Controller, Get, Query, ValidationPipe } from '@nestjs/common';
import { WeatherService } from './weather.service';
import { GetWeatherDto, WeatherResponse } from './dto/weather.dto';

@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get('current')
  async getCurrentWeather(
    @Query(new ValidationPipe({ transform: true })) dto: GetWeatherDto,
  ): Promise<WeatherResponse> {
    return this.weatherService.getCurrentWeather(dto);
  }

  @Get('forecast')
  async getWeatherForecast(
    @Query(new ValidationPipe({ transform: true })) dto: GetWeatherDto,
  ): Promise<WeatherResponse> {
    return this.weatherService.getWeatherForecast(dto);
  }
}
