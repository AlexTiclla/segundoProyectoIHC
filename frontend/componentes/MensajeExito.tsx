type Props = { mensaje?: string };

// Aviso flotante: aparece abajo sin mover el resto de la pantalla
export default function MensajeExito({ mensaje }: Props) {
  if (!mensaje) return null;
  return (
    <p
      role="status"
      className="fixed inset-x-4 bottom-4 z-20 mx-auto max-w-md rounded-lg bg-tinta p-4 text-sm font-medium text-white shadow-lg"
    >
      {mensaje}
    </p>
  );
}
