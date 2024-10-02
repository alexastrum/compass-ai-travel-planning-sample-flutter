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

export const GeocodeInput = z.object({ q: z.string().describe('Place name, address, or description') });
export type GeocodeInput = z.infer<typeof GeocodeInput>;

export const GeocodeOutput = z.array(z.object({
  lon: z.string(), 
  lat: z.string(), 
  licence: z.string(),
}));
export type GeocodeOutput = z.infer<typeof GeocodeOutput>;

export const fetchGeocode = async (input: GeocodeInput): Promise<GeocodeOutput> => {
    const defaultParams = {
        format: 'json',
        limit: '1',
    };
    const paramsObj: Record<string, string> = {...defaultParams, ...input};
    const searchParams = new URLSearchParams(paramsObj);
    const url = `https://nominatim.openstreetmap.org/search?${searchParams.toString()}`;

    const response = await fetch(url, {
        headers: {
            // As requested by https://operations.osmfoundation.org/policies/nominatim/
            // please limit usage to <1 request per second and provide an user agent
            'User-Agent': 'genkit/tools/sample/fetchGeocode',
        },
    });

    const jsonResponse = await response.json();
    return GeocodeOutput.parse(jsonResponse);
};

export const geocodeTool = defineTool(
    {  
      name: 'geocodeTool',
      description: `Used for converting a place name to (lon,lat) coordinates.
      Only use if unsure about the location of a provided place.`,
      inputSchema: GeocodeInput,
      outputSchema: GeocodeOutput,
    },
    fetchGeocode
  );
