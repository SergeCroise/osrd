import { useContext, useState } from 'react';

import { Button, Checkbox } from '@osrd-project/ui-core';
import { Alert, Filter } from '@osrd-project/ui-icons';
import cx from 'classnames';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { osrdEditoastApi, type TrainScheduleResult } from 'common/api/osrdEditoastApi';
import DeleteModal from 'common/BootstrapSNCF/ModalSNCF/DeleteModal';
import { ModalContext } from 'common/BootstrapSNCF/ModalSNCF/ModalProvider';
import { setFailure, setSuccess } from 'reducers/main';
import { updateSelectedTrainId } from 'reducers/simulationResults';
import { getSelectedTrainId } from 'reducers/simulationResults/selectors';
import { useAppDispatch } from 'store';
import { castErrorToFailure } from 'utils/error';
import { useDebounce } from 'utils/helpers';

import FilterPanel from './FilterPanel';
import type {
  ScheduledPointsHonoredFilter,
  TrainScheduleWithDetails,
  ValidityFilter,
} from './types';
import useFilterTrainSchedules from './useFilterTrainSchedules';
import { timetableHasInvalidTrain } from './utils';

type TimetableToolbarProps = {
  showTrainDetails: boolean;
  toggleShowTrainDetails: () => void;
  trainSchedulesWithDetails: TrainScheduleWithDetails[];
  displayedTrainSchedules: TrainScheduleWithDetails[];
  setDisplayedTrainSchedules: (trainSchedulesDetails: TrainScheduleWithDetails[]) => void;
  selectedTrainIds: number[];
  setSelectedTrainIds: (selectedTrainIds: number[]) => void;
  removeTrains: (trainIds: number[]) => void;
  trainSchedules: TrainScheduleResult[];
  isInSelection: boolean;
};

const TimetableToolbar = ({
  showTrainDetails,
  toggleShowTrainDetails,
  trainSchedulesWithDetails,
  displayedTrainSchedules,
  setDisplayedTrainSchedules,
  selectedTrainIds,
  setSelectedTrainIds,
  removeTrains,
  trainSchedules,
  isInSelection,
}: TimetableToolbarProps) => {
  const { t } = useTranslation(['operationalStudies/scenario', 'common/itemTypes']);
  const dispatch = useAppDispatch();
  const { openModal } = useContext(ModalContext);

  const selectedTrainId = useSelector(getSelectedTrainId);

  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  const [filter, setFilter] = useState('');
  const [rollingStockFilter, setRollingStockFilter] = useState('');
  const [validityFilter, setValidityFilter] = useState<ValidityFilter>('both');
  const [scheduledPointsHonoredFilter, setScheduledPointsHonoredFilter] =
    useState<ScheduledPointsHonoredFilter>('both');
  const [selectedTags, setSelectedTags] = useState<Set<string | null>>(new Set());

  const debouncedFilter = useDebounce(filter, 500);

  const debouncedRollingstockFilter = useDebounce(rollingStockFilter, 500);

  const [deleteTrainSchedules] = osrdEditoastApi.endpoints.deleteTrainSchedule.useMutation();

  // TODO: move this hook in Timetable
  const { uniqueTags } = useFilterTrainSchedules(
    trainSchedulesWithDetails,
    debouncedFilter,
    debouncedRollingstockFilter,
    validityFilter,
    scheduledPointsHonoredFilter,
    selectedTags,
    setDisplayedTrainSchedules
  );

  const toggleFilterPanel = () => {
    setIsFilterPanelOpen(!isFilterPanelOpen);
  };

  const toggleAllTrainsSelecton = () => {
    if (displayedTrainSchedules.length === selectedTrainIds.length) {
      setSelectedTrainIds([]);
    } else {
      setSelectedTrainIds(displayedTrainSchedules.map((train) => train.id));
    }
  };

  const handleTrainsDelete = async () => {
    const trainsCount = selectedTrainIds.length;

    if (selectedTrainId && selectedTrainIds.includes(selectedTrainId)) {
      // we need to set selectedTrainId to undefined, otherwise just after the delete,
      // some unvalid rtk calls are dispatched (see rollingstock request in SimulationResults)
      dispatch(updateSelectedTrainId(undefined));
    }

    await deleteTrainSchedules({ body: { ids: selectedTrainIds } })
      .unwrap()
      .then(() => {
        removeTrains(selectedTrainIds);
        dispatch(
          setSuccess({
            title: t('timetable.trainsSelectionDeletedCount', { count: trainsCount }),
            text: '',
          })
        );
      })
      .catch((e) => {
        if (selectedTrainId && selectedTrainIds.includes(selectedTrainId)) {
          dispatch(updateSelectedTrainId(selectedTrainId));
        } else {
          dispatch(setFailure(castErrorToFailure(e)));
        }
      });
  };

  const exportTrainSchedules = (selectedTrainIdsFromClick: number[]) => {
    if (!trainSchedules) return;

    const formattedTrainSchedules = trainSchedules
      .filter(({ id }) => selectedTrainIdsFromClick.includes(id))
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(({ id, timetable_id, ...trainSchedule }) => trainSchedule);

    const jsonString = JSON.stringify(formattedTrainSchedules);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'train_schedules.json';
    a.click();
  };

  return (
    <>
      <div
        className={cx('scenario-timetable-toolbar', {
          centered: trainSchedules.length === 0,
        })}
      >
        <div
          className={cx('toolbar-header', {
            'with-details': isInSelection,
          })}
        >
          {trainSchedules.length === 0 ? (
            <Checkbox small readOnly label={t('timetable.noTrain')} />
          ) : (
            <div className="train-count">
              <Checkbox
                label={t('trainCount', {
                  count: selectedTrainIds.length,
                  totalCount: displayedTrainSchedules.length,
                })}
                small
                checked={
                  selectedTrainIds.length === trainSchedulesWithDetails.length &&
                  selectedTrainIds.length > 0
                }
                isIndeterminate={
                  selectedTrainIds.length !== trainSchedulesWithDetails.length &&
                  selectedTrainIds.length > 0
                }
                onChange={() => toggleAllTrainsSelecton()}
              />
            </div>
          )}

          {trainSchedules.length > 0 && (
            <div>
              <button
                type="button"
                className="more-details-button"
                onClick={toggleShowTrainDetails}
                title={t('displayTrainsWithDetails')}
              >
                {showTrainDetails ? t('lessDetails') : t('moreDetails')}
              </button>
            </div>
          )}
        </div>

        {selectedTrainIds.length > 0 && (
          <div className="action-buttons">
            <Button
              size="small"
              variant="Destructive"
              label={t('timetable.delete')}
              title={t('timetable.deleteSelection')}
              onClick={() =>
                openModal(
                  <DeleteModal
                    handleDelete={handleTrainsDelete}
                    items={t('common/itemTypes:trains', { count: selectedTrainIds.length })}
                  />,
                  'sm'
                )
              }
            />
            <Button
              size="small"
              label={t('timetable.export')}
              title={t('timetable.exportSelection')}
              type="button"
              onClick={() => exportTrainSchedules(selectedTrainIds)}
            />
          </div>
        )}
      </div>
      {timetableHasInvalidTrain(displayedTrainSchedules) && (
        <div className="invalid-trains">
          <Alert size="sm" variant="fill" />
          <span data-testid="invalid-trains-message" className="invalid-trains-message">
            {t('timetable.invalidTrains')}
          </span>
        </div>
      )}
      {trainSchedules.length > 0 && (
        <div
          className={cx('sticky-filter', {
            'selection-mode-open': isInSelection,
          })}
        >
          {!isFilterPanelOpen ? (
            <div className="filter">
              <button
                data-testid="timetable-filter-button"
                aria-label={t('timetable.toggleFilters')}
                onClick={toggleFilterPanel}
                type="button"
                className="filter-button"
              >
                <Filter />
              </button>
            </div>
          ) : (
            <FilterPanel
              toggleFilterPanel={toggleFilterPanel}
              filter={filter}
              setFilter={setFilter}
              rollingStockFilter={rollingStockFilter}
              setRollingStockFilter={setRollingStockFilter}
              validityFilter={validityFilter}
              setValidityFilter={setValidityFilter}
              scheduledPointsHonoredFilter={scheduledPointsHonoredFilter}
              setScheduledPointsHonoredFilter={setScheduledPointsHonoredFilter}
              uniqueTags={uniqueTags}
              selectedTags={selectedTags}
              setSelectedTags={setSelectedTags}
            />
          )}
        </div>
      )}
    </>
  );
};

export default TimetableToolbar;
