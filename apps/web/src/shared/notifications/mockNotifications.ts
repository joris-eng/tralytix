export type NotifType = "opportunity" | "warning" | "info";

export type Notification = {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  time: string;
  read: boolean;
};

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    type: "opportunity",
    title: "Opportunité détectée",
    body: "Votre taux de réussite sur GBP/USD est de 65% ce mois-ci.",
    time: "17:31",
    read: false,
  },
  {
    id: "n2",
    type: "warning",
    title: "Risque de surexposition",
    body: "Votre exposition sur EUR/USD dépasse 40% de votre capital.",
    time: "17:25",
    read: false,
  },
  {
    id: "n3",
    type: "opportunity",
    title: "Opportunité détectée",
    body: "Votre exposition sur EUR/USD dépasse 40% de votre capital.",
    time: "17:24",
    read: false,
  },
  {
    id: "n4",
    type: "opportunity",
    title: "Opportunité détectée",
    body: "Votre exposition sur EUR/USD dépasse 40% de votre capital.",
    time: "17:24",
    read: true,
  },
  {
    id: "n5",
    type: "info",
    title: "Rapport mensuel disponible",
    body: "Votre rapport de performance pour Février 2026 est prêt.",
    time: "09:00",
    read: true,
  },
  {
    id: "n6",
    type: "warning",
    title: "Drawdown détecté",
    body: "Votre drawdown dépasse 8% sur la semaine. Attention au risk management.",
    time: "Hier",
    read: true,
  },
];
