
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "./Pages/Home";
import URLShortner from "./Pages/URLShortner";
import Landing from "./Pages/Landing";
import Profile from "./Pages/Profile";
import EmailVerify from "./Pages/EmailVerify";
import EmailVerifyToken from "./Pages/EmailVerifyToken";
import { Toaster } from "react-hot-toast";
import LoginPage from "./Components/Auth/LoginPage";
import RegisterPage from "./Components/Auth/RegisterPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
    children: [
      {
        index: true,
        element: <Landing />,
      },
      {
        path: "urlshortner",
        element: <URLShortner />,
      },
      {
        path: "login",
        element: <LoginPage/>,
      },
      {
        path: "register",
        element: <RegisterPage />,
      },
      {
        path: "profile",
        element: <Profile />,
      },
      {
        path: "verify-email",
        element: <EmailVerify />,
      },
      {
        path: "verify-email-token",
        element: <EmailVerifyToken />,
      },
    ],
  },
]);

const App = () => {
  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <RouterProvider router={router} />
    </>
  );
};

export default App;
