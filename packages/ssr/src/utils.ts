import { SSR_ATTRIBUTE, ssrAttrValues } from "@sables/framework";

export function shouldHydrate() {
  return (
    typeof document == "object" &&
    !!document.querySelector(
      `[${SSR_ATTRIBUTE}="${ssrAttrValues.SHOULD_HYDRATE}"]`
    )
  );
}
