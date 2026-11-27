import React, { useMemo } from 'react';
import { useT } from '@postpilot/react/translation/get.transation.service.client';
import clsx from 'clsx';

export const HeatMapAnalytics: React.FC<{
  data: Array<{ total: number; date: string }>;
}> = ({ data }) => {
  const t = useT();

  // Create a 7x24 grid (Days of week x Hours of day)
  const grid = useMemo(() => {
    const map = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
    let max = 0;

    data?.forEach((item) => {
      const d = new Date(item.date);
      const day = d.getDay(); // 0-6 (Sun-Sat)
      const hour = d.getHours(); // 0-23
      map[day][hour] += item.total;
      if (map[day][hour] > max) max = map[day][hour];
    });

    return { map, max };
  }, [data]);

  const days = [
    t('sun', 'Sun'),
    t('mon', 'Mon'),
    t('tue', 'Tue'),
    t('wed', 'Wed'),
    t('thu', 'Thu'),
    t('fri', 'Fri'),
    t('sat', 'Sat'),
  ];

  return (
    <div className="flex flex-col w-full overflow-x-auto mt-[20px] p-[20px] rounded-[8px] bg-newBgColorInner border border-newTableBorder shadow-sm">
      <h3 className="text-[18px] font-[600] mb-[16px]">{t('engagement_heatmap', 'Engagement Heatmap')}</h3>
      <div className="flex">
        <div className="flex flex-col gap-[4px] mr-[10px]">
          {days.map((day, idx) => (
            <div key={idx} className="h-[24px] text-[12px] flex items-center justify-end font-[500] text-textColor/70">
              {day}
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-[4px] flex-1">
          {grid.map.map((dayRow, dIdx) => (
            <div key={dIdx} className="flex gap-[4px] flex-1">
              {dayRow.map((hourVal, hIdx) => (
                <div
                  key={hIdx}
                  title={`${hourVal} interactions at ${hIdx}:00`}
                  className={clsx(
                    'flex-1 h-[24px] rounded-[4px] cursor-pointer hover:ring-2 ring-primary transition-all duration-200',
                    hourVal === 0 ? 'bg-newTableBorder/50' : 'bg-primary'
                  )}
                  style={{ opacity: hourVal === 0 ? 0.3 : Math.max(0.2, hourVal / grid.max) }}
                ></div>
              ))}
            </div>
          ))}
          <div className="flex gap-[4px] mt-[4px]">
            {Array.from({ length: 24 }).map((_, hIdx) => (
              <div key={hIdx} className="flex-1 text-[10px] text-center text-textColor/50">
                {hIdx % 3 === 0 ? hIdx : ''}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
