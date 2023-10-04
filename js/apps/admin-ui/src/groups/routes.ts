import type { AppRouteObject } from "../routes";
import {
  GroupsRoute,
  GroupsWithIdRoute,
  GroupsRouteWithoutRealm,
} from "./routes/Groups";

//const routes: AppRouteObject[] = [GroupsRoute, GroupsWithIdRoute];

const routes: AppRouteObject[] = [
  GroupsRouteWithoutRealm,
  GroupsRoute,
  GroupsWithIdRoute,
];

export default routes;
