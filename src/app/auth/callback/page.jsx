"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function Callback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        router.push("/"); // o dashboard
      } else {
        router.push("/login");
      }
    };

    handleAuth();
  }, [router]);

  return <p>Procesando...</p>;
}