'use client';

import * as Progress from '@radix-ui/react-progress';

export default function ProgressBar({ value }: { value: number }) {
  
  const safeValue = Math.min(Math.max(isFinite(value) ? value : 0, 0), 100);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-gray-400">
        <span>Download Progress</span>
        <span>{Math.round(safeValue)}%</span>
      </div>
      <Progress.Root
        className="relative overflow-hidden bg-gray-700 rounded-full w-full h-2.5"
        value={safeValue}
      >
        <Progress.Indicator
          className="bg-blue-500 w-full h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${100 - safeValue}%)` }}
        />
      </Progress.Root>
    </div>
  );
}