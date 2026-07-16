"use client";

import { useEffect } from "react";

export function FetchInterceptor() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const originalFetch = window.fetch;
      
      window.fetch = async (input, init) => {
        let url = "";
        if (typeof input === "string") {
          url = input;
        } else if (input instanceof URL) {
          url = input.toString();
        } else if (input && typeof input === "object" && "url" in input) {
          url = (input as Request).url;
        }

        // If this is a call to the local rewrited /api path
        if (url.startsWith("/api/") || url === "/api") {
          const token = localStorage.getItem("nexus_access_token");
          if (token) {
            init = init || {};
            
            // Handle different headers options format safely
            if (init.headers instanceof Headers) {
              if (!init.headers.has("Authorization")) {
                init.headers.set("Authorization", `Bearer ${token}`);
              }
            } else if (Array.isArray(init.headers)) {
              const hasAuth = init.headers.some(([key]) => key.toLowerCase() === "authorization");
              if (!hasAuth) {
                init.headers.push(["Authorization", `Bearer ${token}`]);
              }
            } else {
              init.headers = init.headers || {};
              const keys = Object.keys(init.headers);
              const hasAuth = keys.some((k) => k.toLowerCase() === "authorization");
              if (!hasAuth) {
                (init.headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
              }
            }
          }
        }
        
        return originalFetch(input, init);
      };
    }
  }, []);

  return null;
}
