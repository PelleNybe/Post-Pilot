'use client';

import { FC, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

export const RenderPreviewDate: FC<{ date: string }> = ({ date }) => {
  const [formatted, setFormatted] = useState<string>('');

  useEffect(() => {
    setFormatted(dayjs.utc(date).local().format('MMMM D, YYYY h:mm A'));
  }, [date]);

  return <>{formatted}</>;
};
