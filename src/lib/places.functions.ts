import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { searchPlaces } from "./geocode.server";

const Query = z.object({ q: z.string().min(2).max(120) });

export interface CityOption {
  label: string;
  lat: number;
  lon: number;
}

export const searchCities = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Query.parse(input))
  .handler(async ({ data }): Promise<CityOption[]> => {
    return searchPlaces(data.q);
  });
