import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { fixLinearMetadataItems, resizeSegment } from 'common/IntervalsDataViz/data';
import { notEmpty } from 'common/IntervalsDataViz/utils';
import DebouncedNumberInputSNCF from 'common/BootstrapSNCF/FormSNCF/DebouncedNumberInputSNCF';
import { IntervalItem } from './types';

type IntervalsEditorFormProps = {
  data: IntervalItem[];
  interval: IntervalItem;
  selectedIntervalIndex: number;
  setData: (newData: IntervalItem[]) => void;
  setSelectedIntervalIndex: (selectedIntervalIndex: number) => void;
  totalLength: number;
};

const IntervalsEditorCommonForm = ({
  data,
  interval,
  selectedIntervalIndex,
  setData,
  setSelectedIntervalIndex,
  totalLength,
}: IntervalsEditorFormProps) => {
  const { t } = useTranslation('common/common');

  const [begin, setBegin] = useState<number>(interval.begin);
  const [end, setEnd] = useState(interval.end);

  useEffect(() => {
    setBegin(interval.begin);
    setEnd(interval.end);
  }, [interval]);

  /** Resize segment from inputs */
  const resizeSegmentByInput = (newPosition: number, context: 'begin' | 'end') => {
    const gap = newPosition - interval[context];
    if (gap !== 0) {
      const { result, newIndexMapping } = resizeSegment(
        data,
        selectedIntervalIndex,
        gap,
        context,
        false
      );
      const fixedResults = fixLinearMetadataItems(result?.filter(notEmpty), totalLength);
      setData(fixedResults);

      // update the selected interval if needed
      // corner case: if we create a new empty first segment
      if (
        fixedResults.length !== Object.keys(newIndexMapping).length &&
        selectedIntervalIndex === 0
      ) {
        setSelectedIntervalIndex(1);
      } else {
        const newIndex = newIndexMapping[selectedIntervalIndex];
        if (newIndex !== null && newIndex !== selectedIntervalIndex) {
          setSelectedIntervalIndex(newIndex);
        }
      }
    }
  };

  useEffect(() => resizeSegmentByInput(begin, 'begin'), [begin]);
  useEffect(() => resizeSegmentByInput(end, 'end'), [end]);

  return (
    <div>
      <DebouncedNumberInputSNCF
        id="item-begin-input"
        input={begin}
        label={t('begin')}
        setInput={setBegin}
        max={interval.end}
      />
      <DebouncedNumberInputSNCF
        id="item-end-input"
        input={end}
        label={t('end')}
        setInput={setEnd}
        min={interval.begin}
        max={totalLength}
      />
    </div>
  );
};

export default React.memo(IntervalsEditorCommonForm);
