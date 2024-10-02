/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { defineTool } from "@genkit-ai/ai/tool";
import { z } from "zod";

export const WeatherForecastInput = z.object({longitude: z.string(), latitude: z.string()});
export type WeatherForecastInput = z.infer<typeof WeatherForecastInput>;

// All the fields have intuitive names, so we'll just pass through the entire object to the LLM.
export const WeatherForecastOutput = z.object({}).passthrough();
export type WeatherForecastOutput = z.infer<typeof WeatherForecastOutput>;

export const fetchWeatherForecast = async (input: WeatherForecastInput): Promise<WeatherForecastOutput> => {
    const apiKey = process.env.OPEN_METEO_APIKEY;
    if (!apiKey) {
        console.warn('Missing OPEN_METEO_APIKEY, using the free version of the API')
    }
    const defaultParams = {
        daily: 'temperature_2m_max,temperature_2m_min,rain_sum,wind_speed_10m_max',
        forecast_days: '16',
    };
    const paramsObj: Record<string, string> = {...defaultParams, ...input};
    const searchParams = new URLSearchParams(paramsObj);
    const url = (apiKey ? 
        `https://customer-api.open-meteo.com/v1/forecast?apikey=${apiKey}&` : 
        'https://api.open-meteo.com/v1/forecast?'
    ) + searchParams.toString();

    const response = await fetch(url, {
        headers: {
            'User-Agent': 'genkit/tools/sample/fetchWeatherForecast',
        },
    });

    const jsonResponse = await response.json();
    return WeatherForecastOutput.parse(jsonResponse);
};

export const weatherForecastTool = defineTool(
    {  
      name: 'weatherForecastTool',
      description: `Used for fetching current timestamp and weather forecast data for a given location.
      Returns weather date for the next 16 days.`,
      inputSchema: WeatherForecastInput,
      outputSchema: WeatherForecastOutput,
    },
    fetchWeatherForecast
  );
