import { ComponentPropsWithoutRef, forwardRef } from "react";

import { Button } from "../../deps.js";

// TODO - update `withProps` to support `forwardRef`, rewrite to use `withProps`
export const ThickButton = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<typeof Button>
>(function CopyButtonPresenter(props, ref) {
  const baseProps: typeof props = {
    background: "blue.200",
    borderRadius: "0.25rem",
    boxShadow: "inset 0 -2px 4px #71bddc, 0 0 2px #286582, 0 4px 0 #3a7697",
    color: "#fff",
    display: "inline-block",
    fontFamily: "Noto Sans",
    fontSize: "xs",
    fontWeight: 400,
    height: "auto",
    padding: "2",
    textTransform: "uppercase",
    transitionDuration: "100ms",
    transitionProperty: "transform, box-shadow",
    type: "button",
    _hover: {
      background: "blue.200",
    },
    _active: {
      transform: "translateY(4px)",
      boxShadow: "inset 0 -2px 4px #71bddc, 0 0 0 #286582, 0 0 0 #3a7697",
    },
  };

  return <Button {...baseProps} {...props} ref={ref} />;
});
