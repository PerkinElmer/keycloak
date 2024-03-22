import {
  Avatar,
  Brand,
  Dropdown,
  DropdownItem,
  DropdownSeparator,
  DropdownToggle,
  KebabToggle,
  PageHeader,
  PageHeaderTools,
  PageHeaderToolsGroup,
  PageHeaderToolsItem,
} from "@patternfly/react-core";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAdminClient } from "./context/auth/AdminClient";
import { useWhoAmI } from "./context/whoami/WhoAmI";
import environment from "./environment";

const ManageAccountDropdownItem = () => {
  const { keycloak } = useAdminClient();
  const { t } = useTranslation();
  return (
    <DropdownItem
      key="manage account"
      id="manage-account"
      onClick={() => keycloak.accountManagement()}
    >
      {t("manageAccount")}
    </DropdownItem>
  );
};

const SignOutDropdownItem = () => {
  const { keycloak } = useAdminClient();
  const { t } = useTranslation();
  return (
    <DropdownItem
      id="sign-out"
      key="sign out"
      onClick={() => keycloak.logout({ redirectUri: "" })}
    >
      {t("signOut")}
    </DropdownItem>
  );
};

const kebabDropdownItems = [
  <ManageAccountDropdownItem key="kebab Manage Account" />,
  <DropdownSeparator key="kebab sign out separator" />,
  <SignOutDropdownItem key="kebab Sign out" />,
];

const userDropdownItems = [
  <ManageAccountDropdownItem key="Manage Account" />,
  <DropdownSeparator key="sign out separator" />,
  <SignOutDropdownItem key="Sign out" />,
];

const KebabDropdown = () => {
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  return (
    <Dropdown
      id="user-dropdown-kebab"
      isPlain
      position="right"
      toggle={<KebabToggle onToggle={setDropdownOpen} />}
      isOpen={isDropdownOpen}
      dropdownItems={kebabDropdownItems}
    />
  );
};

const UserDropdown = () => {
  const { whoAmI } = useWhoAmI();
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  return (
    <Dropdown
      isPlain
      position="right"
      id="user-dropdown"
      isOpen={isDropdownOpen}
      toggle={
        <DropdownToggle onToggle={setDropdownOpen}>
          {whoAmI.getDisplayName()}
        </DropdownToggle>
      }
      dropdownItems={userDropdownItems}
    />
  );
};

export const Header = () => {
  const headerTools = () => {
    const adminClient = useAdminClient();
    const picture = adminClient.keycloak.tokenParsed?.picture;
    return (
      <PageHeaderTools>
        <PageHeaderToolsGroup>
          <PageHeaderToolsItem
            visibility={{
              md: "hidden",
            }} /** this kebab dropdown replaces the icon buttons and is hidden for desktop sizes */
          >
            <KebabDropdown />
          </PageHeaderToolsItem>
          <PageHeaderToolsItem
            visibility={{
              default: "hidden",
              md: "visible",
            }} /** this user dropdown is hidden on mobile sizes */
          >
            <UserDropdown />
          </PageHeaderToolsItem>
        </PageHeaderToolsGroup>
        <Avatar
          src={picture || environment.resourceUrl + "/img_avatar.svg"}
          alt="Avatar image"
        />
      </PageHeaderTools>
    );
  };

  return (
    <PageHeader
      logo={
        <Brand
          src={environment.resourceUrl + "/revvity-logo-white.svg"}
          id="masthead-logo"
          alt="Logo"
          className="keycloak__pageheader_brand"
        />
      }
      logoComponent="div"
      headerTools={headerTools()}
    />
  );
};
