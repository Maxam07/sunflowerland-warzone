import React from "react";
import { MemoryRouter } from "react-router-dom";

import { PortalProvider } from "lib/portal";
import { CHICKEN_RESCUE_CLIENT_ACTIONS } from "./lib/chickenRescueClientActions";
import { createChickenRescueOfflineMinigame } from "./lib/chickenRescueMachine";
import { ChickenRescueRoutes } from "./ChickenRescueRoutes";

/**
 * MemoryRouter keeps /home ↔ /game navigation off the real iframe URL
 * (`?jwt=`, `apiUrl=`, etc.). BrowserRouter was pushing `/game` onto
 * `window.location`, which can trigger a full document reload inside the iframe
 * depending on hosting / navigation handling.
 */
export const ChickenRescueApp: React.FC = () => {
  return (
    <MemoryRouter initialEntries={["/home"]}>
      <PortalProvider
        offlineActions={CHICKEN_RESCUE_CLIENT_ACTIONS}
        offlineMinigame={createChickenRescueOfflineMinigame}
      >
        <ChickenRescueRoutes />
      </PortalProvider>
    </MemoryRouter>
  );
};
