type Props = { mensaje?: string };

export default function MensajeError({ mensaje }: Props) {
  if (!mensaje) return null;
  return (
    <p
      role="alert"
      className="rounded-lg border border-peligro-borde bg-peligro-fondo p-3 text-sm text-peligro"
    >
      {mensaje}
    </p>
  );
}