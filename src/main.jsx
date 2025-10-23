import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AppLayout from "./routes/AppLayout.jsx";
import DashboardPage from "./routes/DashboardPage.jsx";
import CustomersPage from "./routes/CustomersPage.jsx";
import CustomerDetailPage from "./routes/CustomerDetailPage.jsx";
import "./index.css";
import BookingPage from "./routes/BookingPage.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "customers", element: <CustomersPage /> },
      { path: "customers/:id", element: <CustomerDetailPage /> },
      { path: "appointments", element: <BookingPage /> },
    ],
  },
]);


createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);