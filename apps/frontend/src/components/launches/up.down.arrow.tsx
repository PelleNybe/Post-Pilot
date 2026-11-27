import { FC, useCallback } from 'react';
import clsx from 'clsx';
import { ChevronUpIcon } from '@postpilot/frontend/components/ui/icons';

const Arrow: FC<{
  flip: boolean;
}> = (props) => {
  const { flip } = props;
  return (
    <ChevronUpIcon
      style={{
        transform: !flip ? 'rotate(180deg)' : '',
      }}
    />
  );
};
export const UpDownArrow: FC<{
  isUp: boolean;
  isDown: boolean;
  onChange: (type: 'up' | 'down') => void;
}> = (props) => {
  const { isUp, isDown, onChange } = props;
  const changePosition = useCallback(
    (type: 'up' | 'down') => () => {
      onChange(type);
    },
    [],
  );
  return (
    <div className="flex flex-col gap-[8px] pt-[8px]">
      <button
        aria-label="Move item up"
        onClick={changePosition('up')}
        disabled={!isUp}
        className={clsx(
          'w-[20px] h-[20px] flex justify-center items-center rounded-md focus-visible:ring-2 focus-visible:ring-customColor39 focus:outline-none',
          isUp
            ? 'cursor-pointer'
            : 'text-textColor disabled:opacity-50',
        )}
      >
        <Arrow flip={true} />
      </button>
      <button
        aria-label="Move item down"
        onClick={changePosition('down')}
        disabled={!isDown}
        className={clsx(
          'rounded-bl-[20px] w-[20px] h-[20px] flex justify-center items-center rounded-md focus-visible:ring-2 focus-visible:ring-customColor39 focus:outline-none',
          isDown
            ? 'cursor-pointer'
            : 'text-textColor disabled:opacity-50',
        )}
      >
        <Arrow flip={false} />
      </button>
    </div>
  );
};
