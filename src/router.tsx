import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { appBasePath } from "./lib/app-base";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    basepath: appBasePath,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
