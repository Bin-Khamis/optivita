import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/admin/marketplace/complaints")({
  component: () => {
    const navigate = useNavigate();
    useEffect(() => {
      navigate({ to: "/admin/marketplace/disputes" });
    }, [navigate]);
    return null;
  },
});
