import type GroupRepresentation from "@keycloak/keycloak-admin-client/lib/defs/groupRepresentation";
import {
  Button,
  DropdownItem,
  PageSection,
  PageSectionVariants,
  Tab,
  TabTitleText,
  Tabs,
  Tooltip,
} from "@patternfly/react-core";
import { AngleLeftIcon, TreeIcon } from "@patternfly/react-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import { GroupBreadCrumbs } from "../components/bread-crumb/GroupBreadCrumbs";
import { ViewHeader } from "../components/view-header/ViewHeader";
import { useAccess } from "../context/access/Access";
import { fetchAdminUI } from "../context/auth/admin-ui-endpoint";
import { useRealm } from "../context/realm-context/RealmContext";
import helpUrls from "../help-urls";
import { useFetch } from "../utils/useFetch";
import useToggle from "../utils/useToggle";
import { GroupAttributes } from "./GroupAttributes";
import { GroupTable } from "./GroupTable";
import { GroupsModal } from "./GroupsModal";
import { Members } from "./Members";
import { useSubGroups } from "./SubGroupsContext";
import { DeleteGroup } from "./components/DeleteGroup";
import { getId, getLastId } from "./groupIdUtils";
import { toGroups } from "./routes/Groups";

import "./GroupsSection.css";

export default function GroupsSection() {
  const { t } = useTranslation("groups");
  const [activeTab, setActiveTab] = useState(0);

  const { subGroups, setSubGroups, currentGroup } = useSubGroups();
  const { realm } = useRealm();

  const [rename, setRename] = useState<GroupRepresentation>();
  const [deleteOpen, toggleDeleteOpen] = useToggle();

  const navigate = useNavigate();
  const location = useLocation();
  const id = getLastId(location.pathname);

  const [open, toggle] = useToggle(true);
  const [key, setKey] = useState(0);
  const refresh = () => setKey(key + 1);

  const { hasAccess } = useAccess();
  const canManageGroup = hasAccess("view-events");
  const canViewDetails =
    hasAccess("view-users") || hasAccess("manage-users", "query-groups");
  const canViewMembers =
    hasAccess("view-users") ||
    currentGroup()?.access?.viewMembers ||
    currentGroup()?.access?.manageMembers;

  useFetch(
    async () => {
      const ids = getId(location.pathname);
      const isNavigationStateInValid = ids && ids.length > subGroups.length;

      if (isNavigationStateInValid) {
        const groups: GroupRepresentation[] = [];
        for (const i of ids!) {
          const group =
            i !== "search"
              ? await fetchAdminUI<GroupRepresentation | undefined>(
                  "groups/" + i,
                )
              : { name: t("searchGroups"), id: "search" };
          if (group) {
            groups.push(group);
          } else {
            throw new Error(t("common:notFound"));
          }
        }
        return groups;
      }
      return [];
    },
    (groups: GroupRepresentation[]) => {
      if (groups.length) setSubGroups(groups);
    },
    [id],
  );

  return (
    <>
      <DeleteGroup
        show={deleteOpen}
        toggleDialog={toggleDeleteOpen}
        selectedRows={[currentGroup()!]}
        refresh={() => {
          navigate(toGroups({ realm }));
          refresh();
        }}
      />
      {rename && (
        <GroupsModal
          id={id}
          rename={rename}
          refresh={(group) => {
            refresh();
            setSubGroups([...subGroups.slice(0, subGroups.length - 1), group!]);
          }}
          handleModalToggle={() => setRename(undefined)}
        />
      )}
      <PageSection variant={PageSectionVariants.light} className="pf-u-p-0">
        <Tooltip content={open ? t("common:hide") : t("common:show")}>
          <Button
            aria-label={open ? t("common:hide") : t("common:show")}
            variant="plain"
            icon={open ? <AngleLeftIcon /> : <TreeIcon />}
            onClick={toggle}
          />
        </Tooltip>
        <GroupBreadCrumbs />
        <ViewHeader
          titleKey={!id ? "groups:groups" : currentGroup()?.name!}
          subKey={!id ? "groups:groupsDescription" : ""}
          helpUrl={!id ? helpUrls.groupsUrl : ""}
          divider={!id}
          dropdownItems={
            id && canManageGroup
              ? [
                  <DropdownItem
                    data-testid="renameGroupAction"
                    key="renameGroup"
                    onClick={() => setRename(currentGroup())}
                  >
                    {t("renameGroup")}
                  </DropdownItem>,
                  <DropdownItem
                    data-testid="deleteGroup"
                    key="deleteGroup"
                    onClick={toggleDeleteOpen}
                  >
                    {t("deleteGroup")}
                  </DropdownItem>,
                ]
              : undefined
          }
        />
        {subGroups.length > 0 && (
          <Tabs
            inset={{
              default: "insetNone",
              md: "insetSm",
              xl: "insetLg",
              "2xl": "inset2xl",
            }}
            activeKey={activeTab}
            onSelect={(_, key) => setActiveTab(key as number)}
            isBox
            mountOnEnter
            unmountOnExit
          >
            {canViewMembers && (
              <Tab
                data-testid="members"
                eventKey={0}
                title={<TabTitleText>{t("members")}</TabTitleText>}
              >
                <Members />
              </Tab>
            )}
            <Tab
              data-testid="attributes"
              eventKey={1}
              title={<TabTitleText>{t("common:attributes")}</TabTitleText>}
            >
              <GroupAttributes />
            </Tab>
          </Tabs>
        )}
        {subGroups.length === 0 && (
          <GroupTable refresh={refresh} canViewDetails={canViewDetails} />
        )}
      </PageSection>
    </>
  );
}
