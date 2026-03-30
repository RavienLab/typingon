"use client";

type Props = {
  data: Record<string, number>;
};

/*
Legend:
LP = Left Pinky
LR = Left Ring
LM = Left Middle
LI = Left Index
RI = Right Index
RM = Right Middle
RR = Right Ring
RP = Right Pinky
THUMB = Thumb
*/

const LABELS: Record<string, string> = {
  LP: "Left Pinky",
  LR: "Left Ring",
  LM: "Left Middle",
  LI: "Left Index",

  RI: "Right Index",
  RM: "Right Middle",
  RR: "Right Ring",
  RP: "Right Pinky",

  THUMB: "Thumb",
};

export default function FingerAccuracy({ data }: Props) {
  return (
    <div className="space-y-3">
      {Object.entries(LABELS).map(([key, label]) => {
        const value = data[key] ?? 100;

        return (
          <div key={key}>
            <div className="flex justify-between text-sm mb-1">
              <span>{label}</span>
              <span>{value}%</span>
            </div>

            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-700"
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
