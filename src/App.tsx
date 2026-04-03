import { RouterProvider } from "react-router-dom";
import { router } from "@/router";
import { AuthProvider } from "@/context/auth-context";
import { ConfigProvider } from "@/context/config-context";

export default function App() {
  return (
    <ConfigProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ConfigProvider>
  );
}
