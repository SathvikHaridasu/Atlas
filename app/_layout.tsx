import { AuthProvider } from "../contexts/AuthContext";
import RootNavigator from "../src/navigation/RootNavigator";

export default function Layout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
