export function HashRow(props: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="text-muted-foreground text-sm">{props.label}</dt>
      <dd className="font-mono text-xs break-all">{props.value}</dd>
    </div>
  );
}
