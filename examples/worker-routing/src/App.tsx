import { Provider } from "@sables/framework";
import { createRouteSwitch, Link } from "@sables/framework/router";

import { configureManager } from "./configureManager.js";
import { routes } from "./routes.js";

function HomeScreen() {
  return <h1>Welcome to Sables!</h1>;
}

function AboutScreen() {
  return <h1>About Us</h1>;
}

const ScreenSwitch = createRouteSwitch()
  .case(routes.Home, <HomeScreen />)
  .case(routes.About, <AboutScreen />)
  .default(<div>Not Found</div>);

export default function App() {
  return (
    <Provider configureManager={configureManager}>
      <ul>
        <li>
          <Link route={routes.Home}>Home</Link>
        </li>
        <li>
          <Link route={routes.About}>About Us</Link>
        </li>
      </ul>
      <ScreenSwitch />
    </Provider>
  );
}
