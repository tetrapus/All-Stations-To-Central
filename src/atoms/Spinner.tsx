import React from "react";
import { AnimatedIconButton } from "./AnimatedIconButton";
import icon from "animations/error.json";
import { keyframes } from "@emotion/core";

const fadeInOut = keyframes`
  0% {
    transform: scale(0) translateX(50%);
  }

  10% {
    transform: scale(0.3) translateX(40%);
  }

  20% {
      transform: scale(0.5) translateX(30%);
  }

  30% {
      transform: scale(0.6) translateX(20%);
  }

  40% {
    transform: scale(0.8)  translateX(10%);
  }

  50% {
    transform: scale(1) translateX(0%);
    opacity: 1;
  }

  90% {
    transform: scale(0.3) translateX(-40%);
  }

  100% {
    opacity: 0;
    transform: scale(0) translateX(-50%);
  }
`;

export function Spinner(
  props: JSX.IntrinsicAttributes &
    React.ClassAttributes<HTMLDivElement> &
    React.HTMLAttributes<HTMLDivElement> & { size?: number }
) {
  return (
    <div
      css={{
        margin: "auto",
        animation: `${fadeInOut} 2.5s infinite linear`,
        animationDelay: "0.75s",
        transform: "scale(0) translateX(50%)",
      }}
      {...props}
    >
      <AnimatedIconButton
        animation={icon}
        autoplay={true}
        iconSize={props.size || 128}
      />
    </div>
  );
}
