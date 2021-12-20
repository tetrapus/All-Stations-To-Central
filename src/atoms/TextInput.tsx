import styled from "@emotion/styled";
import React from "react";
import { Darkmode } from "./Darkmode";

export const TextInputComponent = styled.input`
  margin: 8px 4px;
  height: 24px;
  border-radius: 0;
  border: none;
  border-bottom: 1px solid #aaa;
  padding: 8px 4px 0px 4px;
  font-size: 14px;
  &:focus {
    border-bottom: 1px solid #55050b;
  }
  &:focus-visible {
    outline: none;
  }
  ${Darkmode} {
    background: black;
    color: white;
    border-bottom: 1px solid #333;

    &:focus {
      border-bottom: 1px solid orange;
    }
  }
`;

export function TextInput(
  props: React.ComponentProps<typeof TextInputComponent>
) {
  return (
    <div css={{ position: "relative" }}>
      <TextInputComponent {...props}></TextInputComponent>
      {props.value && props.placeholder && (
        <div
          css={{
            position: "absolute",
            top: 8,
            left: 8,
            fontSize: 10,
            color: "grey",
          }}
        >
          {props.placeholder}
        </div>
      )}
    </div>
  );
}
