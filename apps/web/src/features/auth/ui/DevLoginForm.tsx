type DevLoginFormProps = {
  className?: string;
};

export function DevLoginForm({ className }: DevLoginFormProps) {
  return (
    <div className={className}>
      <p className="ui-text" data-size="sm" data-tone="muted">
        Dev login form is not enabled in this build.
      </p>
    </div>
  );
}

