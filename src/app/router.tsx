import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Login from "../pages/Login";
import Home from "../pages/Home";

import Mirage from "../pages/maps/Mirage";
import Dust2 from "../pages/maps/Dust2";
import Inferno from "../pages/maps/Inferno";
import Nuke from "../pages/maps/Nuke";
import Overpass from "../pages/maps/Overpass";
import Ancient from "../pages/maps/Ancient";
import Anubis from "../pages/maps/Anubis";

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },

  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: "maps/mirage", element: <Mirage /> },
      { path: "maps/dust2", element: <Dust2 /> },
      { path: "maps/inferno", element: <Inferno /> },
      { path: "maps/nuke", element: <Nuke /> },
      { path: "maps/overpass", element: <Overpass /> },
      { path: "maps/ancient", element: <Ancient /> },
      { path: "maps/anubis", element: <Anubis /> }
    ],
  },
]);
