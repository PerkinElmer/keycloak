import { PageSection } from "@patternfly/react-core";

import { ViewHeader } from "../components/view-header/ViewHeader";
import { UserDataTable } from "../components/users/UserDataTable";
import "./user-section.css";

export default function UsersSection() {
  return (
    <>
      <ViewHeader titleKey="users:title" divider={true} />
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
