import RealmRepresentation from "@keycloak/keycloak-admin-client/lib/defs/realmRepresentation";
import type UserRepresentation from "@keycloak/keycloak-admin-client/lib/defs/userRepresentation";
import {
  AlertVariant,
  ButtonVariant,
  DropdownItem,
  PageSection,
  Tab,
  TabTitleText,
} from "@patternfly/react-core";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { adminClient } from "../admin-client";
import { useAlerts } from "../components/alert/Alerts";
import { useConfirmDialog } from "../components/confirm-dialog/ConfirmDialog";
import { KeycloakSpinner } from "../components/keycloak-spinner/KeycloakSpinner";
import {
  RoutableTabs,
  useRoutableTab,
} from "../components/routable-tabs/RoutableTabs";
import { ViewHeader } from "../components/view-header/ViewHeader";
import { useAccess } from "../context/access/Access";
import { useRealm } from "../context/realm-context/RealmContext";
import { UserProfileProvider } from "../realm-settings/user-profile/UserProfileContext";
import { useFetch } from "../utils/useFetch";
import { useParams } from "../utils/useParams";
import { useUpdateEffect } from "../utils/useUpdateEffect";
import { UserCredentials } from "./UserCredentials";
import { BruteForced, UserForm } from "./UserForm";
import { UserGroups } from "./UserGroups";
import { UserIdentityProviderLinks } from "./UserIdentityProviderLinks";
import {
  isUserProfileError,
  userProfileErrorToString,
} from "./UserProfileFields";
import { UserRoleMapping } from "./UserRoleMapping";
import { UserSessions } from "./UserSessions";
import {
  UserFormFields,
  toUserFormFields,
  toUserRepresentation,
} from "./form-state";
import { UserParams, UserTab, toUser } from "./routes/User";
import { toUsers } from "./routes/Users";

import "./user-section.css";

export default function EditUser() {
  const { realm } = useRealm();
  const { id } = useParams<UserParams>();
  const { t } = useTranslation("users");
  const [user, setUser] = useState<UserRepresentation>();
  const [bruteForced, setBruteForced] = useState<BruteForced>();
  const [refreshCount, setRefreshCount] = useState(0);
  const refresh = () => setRefreshCount((count) => count + 1);

  useFetch(
    async () => {
      const [user, currentRealm, attackDetection] = await Promise.all([
        adminClient.users.findOne({ id: id!, userProfileMetadata: true }),
        adminClient.realms.findOne({ realm }),
        adminClient.attackDetection.findOne({ id: id! }),
      ]);

      if (!user || !currentRealm || !attackDetection) {
        throw new Error(t("common:notFound"));
      }

      const isBruteForceProtected = currentRealm.bruteForceProtected;
      const isLocked = isBruteForceProtected && attackDetection.disabled;

      return { user, bruteForced: { isBruteForceProtected, isLocked } };
    },
    ({ user, bruteForced }) => {
      setUser(user);
      setBruteForced(bruteForced);
    },
    [refreshCount],
  );

  if (!user || !bruteForced) {
    return <KeycloakSpinner />;
  }

  return (
    <EditUserForm user={user} bruteForced={bruteForced} refresh={refresh} />
  );
}

type EditUserFormProps = {
  user: UserRepresentation;
  bruteForced: BruteForced;
  refresh: () => void;
};

const EditUserForm = ({ user, bruteForced, refresh }: EditUserFormProps) => {
  const { t } = useTranslation("users");
  const { realm } = useRealm();
  const { addAlert, addError } = useAlerts();
  const navigate = useNavigate();
  const { hasAccess } = useAccess();
  const userForm = useForm<UserFormFields>({
    mode: "onChange",
    defaultValues: toUserFormFields(user),
  });

  const [realmRepresentation, setRealmRepresentattion] =
    useState<RealmRepresentation>();

  useFetch(
    () => adminClient.realms.findOne({ realm }),
    (realm) => {
      if (!realm) {
        throw new Error(t("common:notFound"));
      }
      setRealmRepresentattion(realm);
    },
    [],
  );

  const toTab = (tab: UserTab) =>
    toUser({
      realm,
      id: user.id!,
      tab,
    });

  const useTab = (tab: UserTab) => useRoutableTab(toTab(tab));

  const settingsTab = useTab("settings");
  const credentialsTab = useTab("credentials");
  const roleMappingTab = useTab("role-mapping");
  const groupsTab = useTab("groups");
  const identityProviderLinksTab = useTab("identity-provider-links");
  const sessionsTab = useTab("sessions");

  // Ensure the form remains up-to-date when the user is updated.
  useUpdateEffect(() => userForm.reset(toUserFormFields(user)), [user]);

  const save = async (data: UserFormFields) => {
    try {
      await adminClient.users.update(
        { id: user.id! },
        toUserRepresentation(data),
      );
      addAlert(t("userSaved"), AlertVariant.success);
      refresh();
    } catch (error) {
      if (isUserProfileError(error)) {
        addError(userProfileErrorToString(error), error);
      } else {
        addError("users:userCreateError", error);
      }
    }
  };

  const [toggleDeleteDialog, DeleteConfirm] = useConfirmDialog({
    titleKey: "users:deleteConfirm",
    messageKey: "users:deleteConfirmCurrentUser",
    continueButtonLabel: "common:delete",
    continueButtonVariant: ButtonVariant.danger,
    onConfirm: async () => {
      try {
        await adminClient.users.del({ id: user.id! });
        addAlert(t("userDeletedSuccess"), AlertVariant.success);
        navigate(toUsers({ realm }));
      } catch (error) {
        addError("users:userDeletedError", error);
      }
    },
  });

  const defaultTab = hasAccess("view-events") ? "settings" : "groups";

  return (
    <>
      <DeleteConfirm />
      {hasAccess("view-events") && (
        <ViewHeader
          titleKey={user.username!}
          className="kc-username-view-header"
          divider={false}
          dropdownItems={[
            <DropdownItem
              key="delete"
              isDisabled={!user.access?.manage}
              onClick={() => toggleDeleteDialog()}
            >
              {t("common:delete")}
            </DropdownItem>,
          ]}
          onToggle={(value) =>
            save({ ...toUserFormFields(user), enabled: value })
          }
          isEnabled={user.enabled}
        />
      )}
      <PageSection variant="light" className="pf-u-p-0">
        <UserProfileProvider>
          <FormProvider {...userForm}>
            <RoutableTabs
              isBox
              mountOnEnter
              defaultLocation={toTab(defaultTab)}
            >
              {hasAccess("view-events") && (
                <Tab
                  data-testid="user-details-tab"
                  title={<TabTitleText>{t("common:details")}</TabTitleText>}
                  {...settingsTab}
                >
                  <PageSection variant="light">
                    <UserForm
                      save={save}
                      user={user}
                      bruteForce={bruteForced}
                      realm={realmRepresentation}
                    />
                  </PageSection>
                </Tab>
              )}
              {hasAccess("view-events") && (
                <Tab
                  data-testid="credentials"
                  isHidden={!user.access?.view}
                  title={<TabTitleText>{t("common:credentials")}</TabTitleText>}
                  {...credentialsTab}
                >
                  <UserCredentials user={user} />
                </Tab>
              )}
              {hasAccess("view-events") && (
                <Tab
                  data-testid="role-mapping-tab"
                  isHidden={!user.access?.mapRoles}
                  title={<TabTitleText>{t("roleMapping")}</TabTitleText>}
                  {...roleMappingTab}
                >
                  <UserRoleMapping id={user.id!} name={user.username!} />
                </Tab>
              )}
              {hasAccess("manage-users") && (
                <Tab
                  data-testid="user-groups-tab"
                  title={<TabTitleText>{t("common:groups")}</TabTitleText>}
                  {...groupsTab}
                >
                  <UserGroups user={user} />
                </Tab>
              )}

              {hasAccess("view-identity-providers") && (
                <Tab
                  data-testid="identity-provider-links-tab"
                  title={
                    <TabTitleText>{t("identityProviderLinks")}</TabTitleText>
                  }
                  {...identityProviderLinksTab}
                >
                  <UserIdentityProviderLinks userId={user.id!} />
                </Tab>
              )}
              {hasAccess("view-events") && (
                <Tab
                  data-testid="user-sessions-tab"
                  title={<TabTitleText>{t("sessions")}</TabTitleText>}
                  {...sessionsTab}
                >
                  <UserSessions />
                </Tab>
              )}
            </RoutableTabs>
          </FormProvider>
        </UserProfileProvider>
      </PageSection>
    </>
  );
};
