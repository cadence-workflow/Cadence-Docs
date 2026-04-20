export interface Series {
  name: string;
  color: string;
  data: { time: string; value: number }[];
}

export const podCountData: Series[] = [
  {
    name: "running",
    color: "#22c55e",
    data: [
      { time: "2026-03-18T22:00:00", value: 3 },
      { time: "2026-03-18T22:01:00", value: 3 },
      { time: "2026-03-18T22:02:00", value: 2 },
      { time: "2026-03-18T22:03:00", value: 2 },
      { time: "2026-03-18T22:04:00", value: 2 },
      { time: "2026-03-18T22:05:00", value: 2 },
      { time: "2026-03-18T22:06:00", value: 2 },
      { time: "2026-03-18T22:07:00", value: 2 },
      { time: "2026-03-18T22:08:00", value: 2 },
      { time: "2026-03-18T22:09:00", value: 2 },
      { time: "2026-03-18T22:10:00", value: 3 },
      { time: "2026-03-18T22:11:00", value: 3 },
      { time: "2026-03-18T22:12:00", value: 3 },
      { time: "2026-03-18T22:13:00", value: 3 },
      { time: "2026-03-18T22:14:00", value: 3 },
      { time: "2026-03-18T22:15:00", value: 3 },
      { time: "2026-03-18T22:16:00", value: 3 },
      { time: "2026-03-18T22:17:00", value: 3 },
      { time: "2026-03-18T22:18:00", value: 3 },
      { time: "2026-03-18T22:19:00", value: 2 },
      { time: "2026-03-18T22:20:00", value: 2 },
      { time: "2026-03-18T22:21:00", value: 2 },
      { time: "2026-03-18T22:22:00", value: 2 },
      { time: "2026-03-18T22:23:00", value: 2 },
      { time: "2026-03-18T22:24:00", value: 2 },
      { time: "2026-03-18T22:25:00", value: 2 },
      { time: "2026-03-18T22:26:00", value: 2 },
      { time: "2026-03-18T22:27:00", value: 3 },
      { time: "2026-03-18T22:28:00", value: 3 },
      { time: "2026-03-18T22:29:00", value: 3 },
    ],
  },
];
