import { cn } from '../lib/utils';

export default function RateLimitAlert({
  remaining,
  limit,
}: {
  remaining: number;
  limit: number;
}) {
  const percentage = (remaining / limit) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-300">Daily Downloads Remaining</span>
        <span
          className={cn(
            'font-medium',
            percentage > 50 ? 'text-green-400' : '',
            percentage <= 50 && percentage > 25 ? 'text-yellow-400' : '',
            percentage <= 25 ? 'text-red-400' : ''
          )}
        >
          {remaining} / {limit}
        </span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className={cn(
            'h-2 rounded-full',
            percentage > 50 ? 'bg-green-500' : '',
            percentage <= 50 && percentage > 25 ? 'bg-yellow-500' : '',
            percentage <= 25 ? 'bg-red-500' : ''
          )}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}