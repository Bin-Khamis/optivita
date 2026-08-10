import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/admin/marketplace/payments")({
  component: () => {
    const navigate = useNavigate();
    useEffect(() => {
      navigate({ to: "/admin/marketplace/transactions" });
    }, [navigate]);
    return null;
  },
});
