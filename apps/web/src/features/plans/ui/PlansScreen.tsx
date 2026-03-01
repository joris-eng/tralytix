import { plansFaqMock, plansMock } from "@/features/plans/mock";
import { PricingCard } from "@/features/plans/ui/PricingCard";
import { Card, Divider, Heading, Text } from "@/features/ui/primitives";
import styles from "@/features/plans/ui/plans.module.css";

export function PlansScreen() {
  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <Heading level={1}>Plans</Heading>
        <Text tone="muted">Choisis une experience adaptee a ton niveau, sans complexite inutile.</Text>
      </header>

      <section className={styles.comparisonGrid} aria-label="Plan comparison">
        {plansMock.map((plan) => (
          <PricingCard key={plan.tier} plan={plan} />
        ))}
      </section>

      <Card>
        <Heading level={2}>FAQ</Heading>
        <div className={styles.faqList} style={{ marginTop: 12 }}>
          {plansFaqMock.map((item, index) => (
            <div key={item.id} className={styles.faqItem}>
              <Heading level={3}>{item.question}</Heading>
              <Text tone="muted" size="sm">
                {item.answer}
              </Text>
              {index < plansFaqMock.length - 1 ? <Divider style={{ marginTop: 8 }} /> : null}
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}
