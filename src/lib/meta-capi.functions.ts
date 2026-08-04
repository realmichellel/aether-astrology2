import { createServerFn } from "@tanstack/react-start";
import { validateMetaCapiInput, type MetaCapiInput } from "./meta-capi.server";

/**
 * Meta Conversions API — server-side mirror of the browser pixel.
 * Deduplicated against the pixel through a shared event_id.
 */
export const sendMetaCapiEvent = createServerFn({ method: "POST" })
  .inputValidator((data: MetaCapiInput) => validateMetaCapiInput(data))
  .handler(async ({ data }) => {
    const { forwardMetaCapiEvent } = await import("./meta-capi.server");
    return forwardMetaCapiEvent(data);
  });
