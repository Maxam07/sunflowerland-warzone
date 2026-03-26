import { assign, createMachine, Interpreter, State } from "xstate";
import jwt_decode from "jwt-decode";
import { CONFIG } from "lib/config";
import { getUrl } from "features/portal/actions/loadPortal";
import {
  getMinigameSession,
  MinigameSessionResponse,
  postMinigameAction,
} from "features/portal/actions/minigameEconomy";
import { CHICKEN_RESCUE_CLIENT_ACTIONS } from "./chickenRescueClientActions";
import { emptySessionMinigame, normalizeMinigameFromApi } from "./minigameRuntimeHelpers";

function decodeToken(token: string): { farmId?: number } {
  const decoded = jwt_decode(token) as any;
  return { ...decoded, ...decoded.properties };
}

const getJWT = () => {
  return new URLSearchParams(window.location.search).get("jwt");
};

export type BootstrapContext = {
  id: number;
  jwt: string;
  farm: MinigameSessionResponse["farm"];
  minigame: MinigameSessionResponse["minigame"];
  actions: Record<string, unknown>;
};

export type BootstrapEvent = { type: "RETRY" };

export type BootstrapState = {
  value:
    | "initialising"
    | "unauthorised"
    | "loading"
    | "error"
    | "sessionReady";
  context: BootstrapContext;
};

export type BootstrapInterpreter = Interpreter<
  BootstrapContext,
  any,
  BootstrapEvent,
  BootstrapState
>;

export type BootstrapMachineState = State<
  BootstrapContext,
  BootstrapEvent,
  BootstrapState
>;

async function tryClaimFreeAttempts(
  portalId: string,
  token: string,
  minigame: MinigameSessionResponse["minigame"],
): Promise<MinigameSessionResponse["minigame"]> {
  try {
    const { minigame: next } = await postMinigameAction({
      portalId,
      token,
      action: "CLAIM_FREE_ATTEMPTS",
    });
    return normalizeMinigameFromApi(next);
  } catch {
    return minigame;
  }
}

export const portalBootstrapMachine = createMachine({
  id: "portalBootstrap",
  initial: "initialising",
  context: {
    id: 0,
    jwt: getJWT() ?? "",
    farm: { balance: "0" },
    minigame: emptySessionMinigame(),
    actions: {},
  },
  states: {
    initialising: {
      always: [
        {
          target: "unauthorised",
          // Only block when we would call the API but have no portal token.
          cond: (context) => !!getUrl() && !context.jwt,
        },
        { target: "loading" },
      ],
    },

    loading: {
      invoke: {
        src: async (context) => {
          if (!getUrl()) {
            const farm = { balance: "0" };
            return {
              farm,
              minigame: {
                ...emptySessionMinigame(),
                balances: { Attempt: 99, Cluckcoin: 10 },
              },
              actions: CHICKEN_RESCUE_CLIENT_ACTIONS as Record<string, unknown>,
              farmId: 0,
            };
          }

          const { farmId } = decodeToken(context.jwt as string);
          const portalId = CONFIG.PORTAL_APP;

          const session = await getMinigameSession({
            portalId,
            token: context.jwt as string,
          });

          let minigame = normalizeMinigameFromApi(session.minigame);
          minigame = await tryClaimFreeAttempts(
            portalId,
            context.jwt as string,
            minigame,
          );

          return {
            farm: session.farm,
            minigame,
            actions: session.actions,
            farmId,
          };
        },
        onDone: {
          target: "sessionReady",
          actions: assign({
            farm: (_c, e: { data: any }) => e.data.farm,
            minigame: (_c, e: { data: any }) =>
              normalizeMinigameFromApi(e.data.minigame),
            actions: (_c, e: { data: any }) => e.data.actions,
            id: (_c, e: { data: any }) => e.data.farmId,
          }) as any,
        },
        onError: {
          target: "error",
        },
      },
    },

    sessionReady: {},

    error: {
      on: {
        RETRY: { target: "initialising" },
      },
    },

    unauthorised: {},
  },
});
