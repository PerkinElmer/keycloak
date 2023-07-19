import type { AppRouteObject } from "../routes";
import { AddUserRoute } from "./routes/AddUser";
import { UserRoute } from "./routes/User";
import {
  UsersRoute,
  UsersRouteWithTab,
  UsersRouteWithoutRealm,
} from "./routes/Users";

const routes: AppRouteObject[] = [
  AddUserRoute,
  UsersRouteWithoutRealm,
  UsersRoute,
  UsersRouteWithTab,
  UserRoute,
];

export default routes;
