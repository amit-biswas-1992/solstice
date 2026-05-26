import { useState } from 'react';

interface CommandBarProps {
  activeProjectName?: string;
  isBusy?: boolean;
  onSubmit: (value: string) => Promise<boolean>;
  selectedDate: string;
}

export default function CommandBar({
  activeProjectName,
  isBusy = false,
  onSubmit,
  selectedDate
}: CommandBarProps) {
  const [value, setValue] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!value.trim()) {
      return;
    }

    const saved = await onSubmit(value.trim());
    if (saved) {
      setValue('');
    }
  };

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm leading-5 text-[color:var(--color-copy-muted)]">
        <span>Selected date: {selectedDate}</span>
        <span>{activeProjectName ? `Filter: ${activeProjectName}` : 'Filter: All projects'}</span>
      </div>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
        <textarea
          aria-label="Organizer command"
          className="min-h-24 rounded-[16px] border border-[color:var(--color-line)] bg-white px-4 py-3 text-base leading-6 text-[color:var(--color-ink)] outline-none transition focus:border-[color:var(--color-line-strong)] focus:ring-2 focus:ring-[color:var(--color-line-strong)]"
          placeholder="Add task for Project Alpha on 2026-05-26"
          rows={2}
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-[10px] bg-[color:var(--color-ink)] px-5 text-base font-medium text-white transition hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-60 lg:self-end"
          disabled={isBusy || value.trim().length === 0}
        >
          Organize
        </button>
      </div>
    </form>
  );
}
