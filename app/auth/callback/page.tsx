"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser-client";

export default function AuthCallbackPage() {
  const [message, setMessage] = useState("Finishing sign in...");

  useEffect(() => {
    const finishSignIn = async () => {
      const supabase = createBrowserSupabaseClient();
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;
      }
      const { data } = await supabase.auth.getSession();
      setMessage(data.session ? "Signed in. You can return to the team library." : "No sign-in session was found.");
    };

    finishSignIn().catch((error) => setMessage(error instanceof Error ? error.message : "Unable to finish sign in."));
  }, []);

  return (
    <main className="app-shell">
      <section className="page">
        <div className="panel">
          <h1>Manager Sign In</h1>
          <p className="muted">{message}</p>
          <Link className="button primary" href="/">
            Team Library
          </Link>
        </div>
      </section>
    </main>
  );
}
