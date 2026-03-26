import React from "react";
import { BrowserRouter } from "react-router-dom";

import { PortalProvider } from "./lib/PortalProvider";
import { ChickenRescueRoutes } from "./ChickenRescueRoutes";

export const ChickenRescueApp: React.FC = () => {
  return (
    <BrowserRouter>
      <PortalProvider>
        <ChickenRescueRoutes />
      </PortalProvider>
    </BrowserRouter>
  );
};
