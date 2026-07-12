"use client";

import { Github } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export function GitHubSignIn() {
  async function signIn() {
    if (process.env.NEXT_PUBLIC_AUTH_ENABLED !== "true") {
      window.location.assign("/app/projects");
      return;
    }
    await authClient.signIn.social({ provider: "github", callbackURL: "/app/projects" });
  }
  return <button type="button" className="github-button" onClick={signIn}><Github /> Continue with GitHub</button>;
}
