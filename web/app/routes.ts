import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  layout("layouts/auth.tsx", [
    route("auth/sign-up", "routes/auth/sign-up/route.tsx"),
  ]),
] satisfies RouteConfig;
