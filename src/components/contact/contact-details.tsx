export function ContactDetails({
  name,
  email,
  phone,
  website,
}: {
  name: string;
  email: string;
  phone?: string | null;
  website?: string | null;
}) {
  return (
    <div className="mt-4 space-y-0.5 rounded-lg border border-positive/40 bg-positive/10 px-3 py-2 text-xs">
      <p className="font-medium text-positive">Contact details</p>
      <p className="text-ink">{name}</p>
      <p className="text-ink">{email}</p>
      {phone ? <p className="text-ink">{phone}</p> : null}
      {website ? <p className="text-ink">{website}</p> : null}
    </div>
  );
}
