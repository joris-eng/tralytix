"use client";

import { useRouter } from "next/navigation";
import { AuthGate } from "@/shared/auth/AuthGate";
import { useRequireAuth } from "@/shared/auth/useSessionState";
import { Mt5StatusCard } from "@/features/mt5/ui/Mt5StatusCard";
import { Mt5ImportCard } from "@/features/mt5/ui/Mt5ImportCard";
import { Mt5EASetupCard } from "@/features/mt5/ui/Mt5EASetupCard";
import styles from "@/features/mt5/ui/mt5.module.css";

function Mt5PageContent() {
  return (
    <div className={styles.page}>
      <div>
        <h1 className={styles.pageTitle}>Connexion MT5</h1>
        <p className={styles.pageSubtitle}>
          Importez vos données de trading depuis MetaTrader 5.
        </p>
      </div>
      <Mt5StatusCard />
      <Mt5EASetupCard />
      <Mt5ImportCard />
    </div>
  );
}

export default function Mt5StatusPage() {
  const router = useRouter();
  const { isAuthenticated, checkingSession } = useRequireAuth(router);

  return (
    <AuthGate checkingSession={checkingSession} isAuthenticated={isAuthenticated}>
      <Mt5PageContent />
    </AuthGate>
  );
}
