import { Page, Spinner, Brand, PageHeader } from "@patternfly/react-core";
import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { AlertProvider } from "ui-shared";

import { environment } from "../environment";
import { PageNav } from "./PageNav";

export const Root = () => {
  const logo = environment.logo || "/SIMA23.svg";

  return (
    <Page
      header={
        <PageHeader
          showNavToggle
          logo={
            <Brand
              src={environment.resourceUrl + logo}
              id="masthead-logo"
              alt="Logo"
              className="keycloak__pageheader_brand"
            />
          }
          logoComponent="div"
        />
      }
      sidebar={<PageNav />}
      isManagedSidebar
    >
      <AlertProvider>
        <Suspense fallback={<Spinner />}>
          <Outlet />
        </Suspense>
      </AlertProvider>
    </Page>
  );
};
