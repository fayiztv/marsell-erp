import { motion } from 'framer-motion';
import { Card } from '@/components/ui';
import { cn } from '@/utils/cn';

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  colorClass?: string;
  delay?: number;
}

export function MetricCard({
  title,
  value,
  icon,
  trend,
  colorClass = 'text-blue-400',
  delay = 0,
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
    >
      <Card padding="md" className="h-full hover:bg-gray-900/60 transition-colors">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400">{title}</p>
            <h4 className="mt-2 text-3xl font-bold text-gray-50">{value}</h4>
          </div>
          <div className={cn('p-2.5 rounded-lg bg-gray-800/50', colorClass)}>
            {icon}
          </div>
        </div>

        {trend && (
          <div className="mt-4 flex items-center text-xs">
            <span
              className={cn(
                'font-medium',
                trend.isPositive ? 'text-green-400' : 'text-red-400'
              )}
            >
              {trend.isPositive ? '+' : '-'}
              {Math.abs(trend.value)}%
            </span>
            <span className="ml-2 text-gray-500">{trend.label}</span>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
