import styled from "@emotion/styled";
import { Darkmode } from "./Darkmode";

export const TextButton = styled.button({
  background: "white",
  border: "3px solid darkred",
  boxShadow: "2px 2px 0 0 orange",
  padding: "6px 8px",
  borderRadius: 4,
  fontSize: 16,
  ":active": {
    transform: "translateX(2px) translateY(2px)",
    boxShadow: "none",
  },
  [Darkmode]: {
    background: "black",
    color: "white",
    border: "3px solid orange",
    boxShadow: "2px 2px 0 0 darkred",
  },
});
