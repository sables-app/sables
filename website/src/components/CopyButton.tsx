import { withProps } from "@sables/framework";

import copyToClipboard from "copy-to-clipboard";
import {
  ComponentPropsWithoutRef,
  ReactNode,
  useCallback,
  useState,
} from "react";

import { Tooltip } from "@chakra-ui/react";
import { ThickButton } from "./ThickButton.js";

const CopyTooltip = withProps(Tooltip, {
  backgroundColor: "dark.100",
  // The `Tooltip` component requires `children` to be set
  children: null,
  color: "tan.300",
  fontSize: "xs",
  hasArrow: true,
  placement: "top",
});

export function CopyButton({
  buttonTitle = "Copy text to clipboard",
  children = "Copy",
  text,
  tooltipLabel = "Text copied",
  ...buttonProps
}: {
  buttonTitle?: string;
  children?: ReactNode;
  text: string;
  tooltipLabel?: ReactNode;
} & ComponentPropsWithoutRef<typeof ThickButton>) {
  const [showTooltip, setShowTooltip] = useState(false);
  const handleClick = useCallback(() => {
    copyToClipboard(text);
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 2000);
  }, [text]);

  return (
    <CopyTooltip isOpen={showTooltip} label={tooltipLabel}>
      <ThickButton onClick={handleClick} title={buttonTitle} {...buttonProps}>
        {children}
      </ThickButton>
    </CopyTooltip>
  );
}
