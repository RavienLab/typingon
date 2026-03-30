"use client";

type Props = {
  data: Record<string, number>;
};

const ROWS = [
  "qwertyuiop",
  "asdfghjkl",
  "zxcvbnm",
];

export default function KeyboardHeatmap({ data }: Props) {
  return (
    <div className="space-y-2 select-none">
      {ROWS.map((row) => (
        <div key={row} className="flex gap-2 justify-center">
          {row.split("").map((k) => {
            const v = data[k] || 0;

            return (
              <div
                key={k}
                className="w-10 h-10 rounded-md flex items-center justify-center font-semibold"
                style={{
                  background: `rgba(239,68,68,${v})`,
                }}
              >
                {k.toUpperCase()}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
