"use client";

type HeatmapData = Record<
  string,
  { total: number; mistakes: number; accuracy: number }
>;

export function Heatmap({ data }: { data: HeatmapData }) { 
  const keys = Object.entries(data).sort(
    (a, b) => a[1].accuracy - b[1].accuracy
  );

  return (
    <div className="bg-gray-900 p-6 rounded-xl">
      <h2 className="text-xl mb-4">Problematic Keys</h2>

      <div className="grid grid-cols-6 gap-2">
        {keys.map(([key, stat]) => {
          const bad = stat.accuracy < 80;

          return (
            <div
              key={key}
              title={`${stat.accuracy}% accuracy`}
              className={`p-2 rounded text-center font-mono ${
                bad ? "bg-red-500/40" : "bg-green-500/30"
              }`}
            >
              {key}
            </div>
          );
        })}
      </div>
    </div>
  );
}
