"use client";

import * as React from "react";

/**
 * Uncontrolled-ish inline rename: Enter commits, Escape cancels, blur
 * commits. Key events stop propagating so the sidebar's own shortcuts
 * (and the row's click handlers) don't fire while typing.
 */
export function RenameInput({
  initial,
  onCommit,
  onCancel,
}: {
  initial: string;
  onCommit: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = React.useState(initial);
  const ref = React.useRef<HTMLInputElement>(null);
  const settled = React.useRef(false);

  React.useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  const commit = () => {
    if (settled.current) return;
    settled.current = true;
    onCommit(value.trim());
  };

  return (
    <input
      ref={ref}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Enter") commit();
        if (e.key === "Escape") {
          // Guard the blur that follows, or Escape would still commit.
          settled.current = true;
          onCancel();
        }
      }}
      onBlur={commit}
      className="w-full flex-1 bg-transparent px-1 py-0.5 text-xs outline-none"
      aria-label="Ubah nama"
    />
  );
}
