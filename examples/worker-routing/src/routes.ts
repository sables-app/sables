import {
  createRouteEffects,
  createRoutes,
  forwardTo,
} from "@sables/framework/router";

export const routes = createRoutes()
  .set("home", "/")
  .set("about", "/about-us")
  .set("aboutCompany", "/about/our-company")
  .setEffects(() =>
    createRouteEffects().append(
      routes.AboutCompany.id,
      forwardTo(() => routes.About)
    )
  );
