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
import { retrieve } from '@genkit-ai/ai/retriever';
import { prompt } from '@genkit-ai/dotprompt';
import { defineFlow, run } from "@genkit-ai/flow";
import { z } from "zod";
import { placeRetriever } from '../retrievers/placeRetriever';
import { Destination, ItineraryGeneratorOutput, ItineraryRequest } from '../common/types';
import { planItenerary } from './shared/iteneraryManager';
import { defineSchema } from '@genkit-ai/core';
import { geocodeTool, weatherForecastTool } from '../tools';

export const ItineraryInput = defineSchema('ItineraryInput', ItineraryRequest);
export type ItineraryInput = z.infer<typeof ItineraryInput>;

export const ItineraryOutput = defineSchema('ItineraryOutput', z.array(z.object({
  place: z.string(),
  itineraryName: z.string(),
  startDate: z.string().describe('YYYY-MM-DD'),
  endDate: z.string().describe('YYYY-MM-DD'),
  tags: z.array(z.string()),
  itinerary: z.array(
    z.object({
      day: z.number(),
      date: z.string(),
      planForDay: z.array(
        z.object({
          activityRef: z.string()
            .describe('the reference value for the activity - this comes from the available activities JSON. If no value is present use a ref value of `restaurant`.'),
          activityTitle: z.string(),
          activityDesc: z.string(),
          photoUri: z.string().optional(),
          googleMapsUri: z.string().optional(),
          imgUrl: z.string().optional(),
        })
      )
    })
  ),
  itineraryImageUrl: z.string().optional(),
  placeRef: z.string().optional(),
})));
export type ItineraryOutput = z.infer<typeof ItineraryOutput>;

// export const generateImageDescriptions = async (imageUrls?: string[]) => {
//   if (!imageUrls || !imageUrls[0]) {
//     return '';
//   }
//   const imageDescriptionPrompt = await prompt('imageDescription');
//   const result = await imageDescriptionPrompt.generate({
//     input: { images: imageUrls },
//   });
//   return result.text();
// }

export const generateItinerary = async (input: ItineraryInput) => {
    const context = await retrieve({
      retriever: placeRetriever,
      query: {content: [
        {text: input.request}, 
        ...(input.images || []).map(url => ({media: {url}}))
      ]},
      options: {
        k: 3,
      },
    });

    const itinerariesPrompt = await prompt('itineraryGenerator');
    const response = await itinerariesPrompt.generate<typeof ItineraryInput, typeof ItineraryOutput>({
      input,
      output: {
        schema: ItineraryOutput,
      },
      context,
      tools: [geocodeTool, weatherForecastTool],
    });
    console.log(response.text());
    console.log(response.output());
    return {itineraries: response.output() || []};
  };

export const itineraryGenerator = defineFlow(
    {
      name: 'itineraryGenerator',
      inputSchema: ItineraryInput,
      outputSchema: z.object({itineraries:ItineraryOutput}),
    },
    generateItinerary
  );

export const itineraryGenerator2 = defineFlow(
    {
      name: 'itineraryGenerator2',
      inputSchema: ItineraryRequest,
      outputSchema: z.unknown(),
    },
    async (userInputs) => {
      console.log("RUNNING - itineraryGenerator2");

      // #region : 1 - Obtain the description of the image
      const imageDescription = await run('Decribe Image', async () => {

        if (!userInputs.images || userInputs.images.length === 0 || userInputs.images[0] == "") {
          return '';
        }

        const imageDescriptionPrompt = await prompt('imageDescription');
        const result = await imageDescriptionPrompt.generate({
          input: { images: userInputs.images },
        });

        return result.text();
      });
      // #endregion
      

      // #region : 2 - Suggest Destinations matching users input
      const possibleDestinations = await run('Suggest Destinations', async () => {

        // #region : Retriever
        const contextDestinations = await retrieve({
          retriever: placeRetriever,
          query: `${imageDescription} ${userInputs.request}`,
          options: {
            k: 3,
          },
        });
        //suggestDestinationsWithContextAgent
        // #endregion

        const suggestDestinationsAgentPrompt = await prompt('suggestDestinationsWithContextAgent');
        const result = await suggestDestinationsAgentPrompt.generate({
          input: { description: `${imageDescription} ${userInputs.request}` },
          context: contextDestinations
        });

        const { destinations } = result.output() as { destinations: Destination[] };

        // #region : Clean Up images
        destinations.forEach((dest) =>{
            const doc1 = contextDestinations.find((doc) => doc.toJSON().metadata!.ref === dest.ref)
            if(doc1){
              dest.imageUrl = doc1.toJSON().metadata!.imageUrl;
            }
        });
        // #endregion

        return destinations;
      });
      // #endregion


     // #region : 3 - Plan itineraries for each destination
      let destDetails: Promise<unknown>[] = [];

      possibleDestinations.forEach((dest) => {
        const loc0 = run(`Plan Itinerary for Destination: `+ dest.ref , (): Promise<unknown> => {
          return planItenerary(userInputs.request!, dest);
        });
        destDetails.push(loc0);
      });
      //#endregion


      // #region 4 - Merge eveything together and tide up data model
      const itineraries = await run('Finally Merge all Results into Itinerary', async () => {
        const results = await Promise.all(destDetails);
        const itineraries = { itineraries: [...(results as ItineraryGeneratorOutput[])] };
        return itineraries;
      });
      // #endregion
  
      return itineraries;
    },
  );