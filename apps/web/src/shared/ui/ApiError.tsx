type ApiErrorProps = {
  message: string;
};

export function ApiError({ message }: ApiErrorProps) {
  return <p className="error">{message}</p>;
}

