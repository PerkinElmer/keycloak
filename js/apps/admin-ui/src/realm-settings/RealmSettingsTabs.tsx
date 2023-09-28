import type RealmRepresentation from "@keycloak/keycloak-admin-client/lib/defs/realmRepresentation";
import {
  AlertVariant,
  ButtonVariant,
  DropdownItem,
  DropdownSeparator,
  PageSection,
  Tab,
  TabTitleText,
} from "@patternfly/react-core";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { adminClient } from "../admin-client";
import { useAlerts } from "../components/alert/Alerts";
import { useConfirmDialog } from "../components/confirm-dialog/ConfirmDialog";
import type { KeyValueType } from "../components/key-value-form/key-value-convert";
import {
  RoutableTabs,
  useRoutableTab,
} from "../components/routable-tabs/RoutableTabs";
import { ViewHeader } from "../components/view-header/ViewHeader";
import { useRealms } from "../context/RealmsContext";
import { useRealm } from "../context/realm-context/RealmContext";
import { toDashboard } from "../dashboard/routes/Dashboard";
import environment from "../environment";
import { convertFormValuesToObject, convertToFormValues } from "../util";
import { RealmSettingsEmailTab } from "./EmailTab";
import { RequiredActions } from "../authentication/RequiredActions";
import { PartialExportDialog } from "./PartialExport";
import { PartialImportDialog } from "./PartialImport";
import { EventsTab } from "./event-config/EventsTab";
import { RealmSettingsTab, toRealmSettings } from "./routes/RealmSettings";

type RealmSettingsHeaderProps = {
  onChange: (value: boolean) => void;
  value: boolean;
  save: () => void;
  realmName: string;
  refresh: () => void;
};

const RealmSettingsHeader = ({
  save,
  onChange,
  value,
  realmName,
  refresh,
}: RealmSettingsHeaderProps) => {
  const { t } = useTranslation("realm-settings");
  const { refresh: refreshRealms } = useRealms();
  const { addAlert, addError } = useAlerts();
  const navigate = useNavigate();
  const [partialImportOpen, setPartialImportOpen] = useState(false);
  const [partialExportOpen, setPartialExportOpen] = useState(false);

  const [toggleDisableDialog, DisableConfirm] = useConfirmDialog({
    titleKey: "realm-settings:disableConfirmTitle",
    messageKey: "realm-settings:disableConfirm",
    continueButtonLabel: "common:disable",
    onConfirm: () => {
      onChange(!value);
      save();
    },
  });

  const [toggleDeleteDialog, DeleteConfirm] = useConfirmDialog({
    titleKey: "realm-settings:deleteConfirmTitle",
    messageKey: "realm-settings:deleteConfirm",
    continueButtonLabel: "common:delete",
    continueButtonVariant: ButtonVariant.danger,
    onConfirm: async () => {
      try {
        await adminClient.realms.del({ realm: realmName });
        addAlert(t("deletedSuccess"), AlertVariant.success);
        await refreshRealms();
        navigate(toDashboard({ realm: environment.masterRealm }));
        refresh();
      } catch (error) {
        addError("realm-settings:deleteError", error);
      }
    },
  });

  return (
    <>
      <DisableConfirm />
      <DeleteConfirm />
      <PartialImportDialog
        open={partialImportOpen}
        toggleDialog={() => setPartialImportOpen(!partialImportOpen)}
      />
      <PartialExportDialog
        isOpen={partialExportOpen}
        onClose={() => setPartialExportOpen(false)}
      />
      <ViewHeader
        titleKey={realmName}
        divider={false}
        dropdownItems={[
          <DropdownItem
            key="import"
            data-testid="openPartialImportModal"
            onClick={() => {
              setPartialImportOpen(true);
            }}
          >
            {t("partialImport")}
          </DropdownItem>,
          <DropdownItem
            key="export"
            data-testid="openPartialExportModal"
            onClick={() => setPartialExportOpen(true)}
          >
            {t("partialExport")}
          </DropdownItem>,
          <DropdownSeparator key="separator" />,
          <DropdownItem key="delete" onClick={toggleDeleteDialog}>
            {t("common:delete")}
          </DropdownItem>,
        ]}
        isEnabled={value}
        onToggle={(value) => {
          if (!value) {
            toggleDisableDialog();
          } else {
            onChange(value);
            save();
          }
        }}
      />
    </>
  );
};

type RealmSettingsTabsProps = {
  realm: RealmRepresentation;
  refresh: () => void;
};

export const RealmSettingsTabs = ({
  realm,
  refresh,
}: RealmSettingsTabsProps) => {
  const { t } = useTranslation("realm-settings");
  const { addAlert, addError } = useAlerts();
  const { realm: realmName } = useRealm();
  const { refresh: refreshRealms } = useRealms();
  const navigate = useNavigate();

  const { control, setValue, getValues } = useForm({
    mode: "onChange",
  });
  const [key, setKey] = useState(0);

  const refreshHeader = () => {
    setKey(key + 1);
  };

  const setupForm = (r: RealmRepresentation = realm) => {
    convertToFormValues(r, setValue);
  };

  useEffect(setupForm, []);

  const save = async (r: RealmRepresentation) => {
    r = convertFormValuesToObject(r);
    if (
      r.attributes?.["acr.loa.map"] &&
      typeof r.attributes["acr.loa.map"] !== "string"
    ) {
      r.attributes["acr.loa.map"] = JSON.stringify(
        Object.fromEntries(
          (r.attributes["acr.loa.map"] as KeyValueType[])
            .filter(({ key }) => key !== "")
            .map(({ key, value }) => [key, value]),
        ),
      );
    }

    try {
      const savedRealm: RealmRepresentation = {
        ...realm,
        ...r,
        id: r.realm,
      };

      // For the default value, null is expected instead of an empty string.
      if (savedRealm.smtpServer?.port === "") {
        savedRealm.smtpServer = { ...savedRealm.smtpServer, port: null };
      }
      await adminClient.realms.update({ realm: realmName }, savedRealm);
      addAlert(t("saveSuccess"), AlertVariant.success);
    } catch (error) {
      addError("realm-settings:saveError", error);
    }

    const isRealmRenamed = realmName !== (r.realm || realm.realm);
    if (isRealmRenamed) {
      await refreshRealms();
      navigate(toRealmSettings({ realm: r.realm!, tab: "general" }));
    }
    refresh();
  };

  const useTab = (tab: RealmSettingsTab) =>
    useRoutableTab(toRealmSettings({ realm: realmName, tab }));

  const requiredActionsTab = useTab("required-actions");
  const emailTab = useTab("email");
  const eventsTab = useTab("events");

  return (
    <>
      <Controller
        name="enabled"
        defaultValue={true}
        control={control}
        render={({ field }) => (
          <RealmSettingsHeader
            value={field.value}
            onChange={field.onChange}
            realmName={realmName}
            refresh={refreshHeader}
            save={() => save(getValues())}
          />
        )}
      />
      <PageSection variant="light" className="pf-u-p-0">
        <RoutableTabs
          isBox
          mountOnEnter
          aria-label="realm-settings-tabs"
          defaultLocation={toRealmSettings({
            realm: realmName,
            tab: "required-actions",
          })}
        >
          <Tab
            data-testid="requiredActions"
            title={<TabTitleText>Login actions</TabTitleText>}
            {...requiredActionsTab}
          >
            <RequiredActions />
          </Tab>
          <Tab
            title={<TabTitleText>{t("email")}</TabTitleText>}
            data-testid="rs-email-tab"
            {...emailTab}
          >
            <RealmSettingsEmailTab realm={realm} save={save} />
          </Tab>
          <Tab
            title={<TabTitleText>{t("events")}</TabTitleText>}
            data-testid="rs-realm-events-tab"
            {...eventsTab}
          >
            <EventsTab realm={realm} />
          </Tab>
        </RoutableTabs>
      </PageSection>
    </>
  );
};
