import { PageSection } from "@patternfly/react-core";

import { ViewHeader } from "../components/view-header/ViewHeader";
import helpUrls from "../help-urls";
import { UserDataTable } from "../components/users/UserDataTable";
import "./user-section.css";

export default function UsersSection() {
  return (
    <>
      <ViewHeader
        titleKey="users:title"
        subKey="users:usersExplain"
        helpUrl={helpUrls.usersUrl}
        divider={false}
      />
      <PageSection
        data-testid="users-page"
        variant="light"
        className="pf-u-p-0"
      >
        <UserDataTable />
      </PageSection>
    </>
  );
}
