import styled from "@emotion/styled";
import { Breakpoint } from "atoms/Breakpoint";
import { TextButton } from "atoms/TextButton";

export const BuildButton = styled(TextButton)(
  {
    fontSize: 16,
    position: "absolute",
    top: 78,
    zIndex: 1,
    [Breakpoint.MOBILE]: {
      position: "initial",
    },
  },
  ({ disabled }) =>
    disabled
      ? {
          borderColor: "transparent",
          boxShadow: "none",
          color: "black",
        }
      : { cursor: "pointer" }
);
