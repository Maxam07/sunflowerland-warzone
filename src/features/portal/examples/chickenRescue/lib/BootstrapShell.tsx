import React from "react";
import { useActor } from "@xstate/react";
import { Modal } from "components/ui/Modal";
import { Panel } from "components/ui/Panel";
import { Button } from "components/ui/Button";
import { Label } from "components/ui/Label";
import { Loading } from "features/auth/components/Loading";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import { CONFIG } from "lib/config";
import { goHome } from "./chickenRescueExit";
import type { BootstrapInterpreter } from "./portalBootstrapMachine";

export const BootstrapShell: React.FC<{
  bootstrapService: BootstrapInterpreter;
}> = ({ bootstrapService }) => {
  const [state] = useActor(bootstrapService);
  const { t } = useAppTranslation();

  if (state.matches("error")) {
    return (
      <Modal show>
        <Panel>
          <div className="p-2">
            <Label type="danger">{t("error")}</Label>
            <span className="text-sm my-2">{t("error.wentWrong")}</span>
          </div>
          <Button onClick={() => bootstrapService.send("RETRY")}>
            {t("retry")}
          </Button>
        </Panel>
      </Modal>
    );
  }

  if (state.matches("unauthorised")) {
    return (
      <Modal show>
        <Panel>
          <div className="p-2">
            <Label type="danger">{t("error")}</Label>
            <span className="text-sm my-2">{t("session.expired")}</span>
          </div>
          <Button onClick={() => goHome()}>{t("close")}</Button>
        </Panel>
      </Modal>
    );
  }

  if (state.matches("loading") || state.matches("initialising")) {
    return (
      <Modal show>
        <Panel>
          <Loading />
          <span className="text-xs">
            {`${t("last.updated")}:${CONFIG.CLIENT_VERSION}`}
          </span>
        </Panel>
      </Modal>
    );
  }

  return null;
};
