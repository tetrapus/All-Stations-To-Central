import { css } from "@emotion/core";
import styled from "@emotion/styled";
import { Darkmode } from "./Darkmode";

export const CardStyle = css({
  borderRadius: 3,
  boxShadow: "grey 1px 1px 3px",
  background: "white",
  [Darkmode]: {
    background: "black",
    boxShadow: "none",
    border: "1px solid #333",
  },
});

export const Card = styled.div`
  ${CardStyle}
`;
