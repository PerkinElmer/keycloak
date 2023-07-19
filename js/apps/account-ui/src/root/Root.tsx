import { Page, Spinner } from "@patternfly/react-core";
import {
  KeycloakMasthead,
  Translations,
  TranslationsProvider,
} from "keycloak-masthead";
import { Suspense, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AlertProvider } from "ui-shared";

import { environment } from "../environment";
import { keycloak } from "../keycloak";
import { joinPath } from "../utils/joinPath";
import { PageNav } from "./PageNav";

import style from "./Root.module.css";

export const Root = () => {
  const { t } = useTranslation();
  const translations = useMemo<Translations>(
    () => ({
      avatar: t("avatar"),
      fullName: t("fullName"),
      manageAccount: t("manageAccount"),
      signOut: t("signOut"),
      unknownUser: t("unknownUser"),
    }),
    [t]
  );
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === "/") {
      navigate("/personal-info");
    }
  }, [location]);

  return (
    <Page
      header={
        <TranslationsProvider translations={translations}>
          <KeycloakMasthead
            features={{ hasManageAccount: false }}
            showNavToggle
            brand={{
              src: joinPath(environment.resourceUrl, "logo.svg"),
              alt: t("logo"),
              className: style.brand,
            }}
            dropdownItems={[]}
            keycloak={keycloak}
          />
        </TranslationsProvider>
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
