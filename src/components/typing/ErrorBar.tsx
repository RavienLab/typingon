export function ErrorBar({ errors }: { errors: number }) {
  if (errors <= 0) return null;

  return (
    <div className="mt-4 text-xs text-red-400">
      {errors} mistakes
    </div>
  );
}
 