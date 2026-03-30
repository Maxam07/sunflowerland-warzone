export type MinigameSessionResponse = {
  farm: {
    balance: string;
    bumpkin?: unknown;
  };
  minigame: {
    balances: Record<string, number>;
    producing: Record<
      string,
      {
        outputToken: string;
        startedAt: number;
        completesAt: number;
        requires?: string;
      }
    >;
    activity: number;
    dailyActivity: { date: string; count: number };
    /** Present when API returns the extended minigame payload. */
    dailyMinted?: { utcDay: string; minted: Record<string, number> };
  };
  actions: Record<string, unknown>;
};

export type MinigameActionResponse = {
  minigame: MinigameSessionResponse["minigame"];
  producingId?: string;
};

export type BootstrapContext = {
  id: number;
  jwt: string;
  farm: MinigameSessionResponse["farm"];
  minigame: MinigameSessionResponse["minigame"];
  actions: Record<string, unknown>;
};
