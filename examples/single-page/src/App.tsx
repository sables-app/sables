import { Provider } from "@sables/framework";

function HomeScreen() {
  return <h1>Welcome to Sables!</h1>;
}

export default function App() {
  return (
    <Provider>
      <HomeScreen />
    </Provider>
  );
}
