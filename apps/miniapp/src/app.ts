import { resolveRuntimeConfig } from "./config/runtime";

App<IAppOption>({
  globalData: resolveRuntimeConfig()
});
