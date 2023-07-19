import type { AccessType } from "@keycloak/keycloak-admin-client/lib/defs/whoAmIRepresentation";
import type { TFunction } from "i18next";
import type { ComponentType } from "react";
import type { NonIndexRouteObject, RouteObject } from "react-router";
import { initAdminClient } from "./context/auth/AdminClient";
import { initI18n } from "./i18n";

import { App } from "./App";
import { PageNotFoundSection } from "./PageNotFoundSection";
import userRoutes from "./user/routes";

export type AppRouteObjectHandle = {
  access: AccessType | AccessType[];
};

export interface AppRouteObject extends NonIndexRouteObject {
  path: string;
  breadcrumb?: (t: TFunction) => string | ComponentType<any>;
  handle: AppRouteObjectHandle;
}

export const NotFoundRoute: AppRouteObject = {
  path: "*",
  element: <PageNotFoundSection />,
  handle: {
    access: "anyone",
  },
};

export const routes: AppRouteObject[] = [...userRoutes, NotFoundRoute];

const { keycloak, adminClient } = await initAdminClient();

await initI18n(adminClient);

export const RootRoute: RouteObject = {
  path: "/",
  element: <App keycloak={keycloak} adminClient={adminClient} />,
  children: routes,
};
