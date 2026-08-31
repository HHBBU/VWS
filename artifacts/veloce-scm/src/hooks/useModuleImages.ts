import { MODULE_IMAGES } from "@/config/moduleImages";
import { useGetImageConfig, type ImageConfigOverrides } from "@workspace/api-client-react";

function mergeImages(overrides: ImageConfigOverrides): typeof MODULE_IMAGES {
  if (!overrides || Object.keys(overrides).length === 0) return MODULE_IMAGES;
  const result = JSON.parse(JSON.stringify(MODULE_IMAGES)) as typeof MODULE_IMAGES;
  for (const [mod, keys] of Object.entries(overrides)) {
    for (const [key, vals] of Object.entries(keys)) {
      const m = result[mod as keyof typeof result] as Record<string, { src: string; alt: string; caption: string }>;
      if (m?.[key]) Object.assign(m[key], vals);
    }
  }
  return result;
}

export function useModuleImages(): typeof MODULE_IMAGES {
  const { data: overrides } = useGetImageConfig();
  return mergeImages((overrides as ImageConfigOverrides) ?? {});
}
