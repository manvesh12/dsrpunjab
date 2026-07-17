import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./security/auth.context";

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}