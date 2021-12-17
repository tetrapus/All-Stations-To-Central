import { Route } from "data/Game";
import React from "react";

interface NavigationEvents {
  onHighlight: (route?: Route) => void;
  onUnhighlight: (route?: Route) => void;
}

export const NavigationContext = React.createContext<NavigationEvents>({
  onHighlight: () => undefined,
  onUnhighlight: () => undefined,
});
