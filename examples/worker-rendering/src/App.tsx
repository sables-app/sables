import { lazy, Provider } from "@sables/ssr";

const HomeScreen = lazy(() => import("./HomeScreen.js"));

export default function App() {
  return (
    <Provider>
      <HomeScreen />
    </Provider>
  );
}
