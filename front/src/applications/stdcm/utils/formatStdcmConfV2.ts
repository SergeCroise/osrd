/* eslint-disable @typescript-eslint/no-unused-vars */
import type { TFunction } from 'i18next';
import { compact } from 'lodash';
import type { Dispatch } from 'redux';

import type {
  PathfindingItem,
  PostV2TimetableByIdStdcmApiArg,
  TrainScheduleBase,
} from 'common/api/osrdEditoastApi';
import type { InfraState } from 'reducers/infra';
import { setFailure } from 'reducers/main';
import type { OsrdStdcmConfState, StandardAllowance } from 'reducers/osrdconf/types';
import { dateTimeFormatting, dateTimeToIso } from 'utils/date';
import { mToMm } from 'utils/physics';
import { ISO8601Duration2sec, sec2ms, time2sec } from 'utils/timeManipulation';

import createMargin from './createMargin';

type ValidStdcmConfig = {
  formattedStartTime: string;
  rollingStockId: number;
  timetableId: number;
  infraId: number;
  rollingStockComfort: TrainScheduleBase['comfort'];
  path: PathfindingItem[];
  speedLimitByTag?: string;
  maximumRunTime: number;
  startTime: string; // must be a datetime
  lastestStartTime: string;
  margin?: StandardAllowance;
  gridMarginBefore?: number;
  gridMarginAfter?: number;
  workScheduleGroupId?: number;
  electricalProfileSetId?: number;
};

export const checkStdcmConf = (
  dispatch: Dispatch,
  t: TFunction,
  osrdconf: OsrdStdcmConfState & InfraState
): ValidStdcmConfig | null => {
  const {
    pathSteps,
    timetableID,
    speedLimitByTag,
    rollingStockComfortV2,
    infraID,
    rollingStockID,
    maximumRunTime,
    standardStdcmAllowance,
    gridMarginBefore,
    gridMarginAfter,
    originUpperBoundTime,
    originDate,
    originTime,
    searchDatetimeWindow,
    workScheduleGroupId,
    electricalProfileSetId,
  } = osrdconf;
  let error = false;
  if (pathSteps[0] === null) {
    error = true;
    dispatch(
      setFailure({
        name: t('operationalStudies/manageTrainSchedule:errorMessages.trainScheduleTitle'),
        message: t('operationalStudies/manageTrainSchedule:errorMessages.noOrigin'),
      })
    );
  }
  if (!(osrdconf.originTime && osrdconf.originUpperBoundTime)) {
    error = true;
    dispatch(
      setFailure({
        name: t('operationalStudies/manageTrainSchedule:errorMessages.trainScheduleTitle'),
        message: t('operationalStudies/manageTrainSchedule:errorMessages.noOriginTime'),
      })
    );
  }
  if (pathSteps[pathSteps.length - 1] === null) {
    error = true;
    dispatch(
      setFailure({
        name: t('operationalStudies/manageTrainSchedule:errorMessages.trainScheduleTitle'),
        message: t('operationalStudies/manageTrainSchedule:errorMessages.noDestination'),
      })
    );
  }
  if (!rollingStockID) {
    error = true;
    dispatch(
      setFailure({
        name: t('operationalStudies/manageTrainSchedule:errorMessages.trainScheduleTitle'),
        message: t('operationalStudies/manageTrainSchedule:errorMessages.noRollingStock'),
      })
    );
  }
  if (!infraID) {
    error = true;
    dispatch(
      setFailure({
        name: t('operationalStudies/manageTrainSchedule:errorMessages.trainScheduleTitle'),
        message: t('operationalStudies/manageTrainSchedule:errorMessages.noName'),
      })
    );
  }
  if (!timetableID) {
    error = true;
    dispatch(
      setFailure({
        name: t('operationalStudies/manageTrainSchedule:errorMessages.trainScheduleTitle'),
        message: t('operationalStudies/manageTrainSchedule:errorMessages.noTimetable'),
      })
    );
  }
  const startTime = dateTimeToIso(`${originDate}T${originTime}`);
  if (!startTime) {
    error = true;
    dispatch(
      setFailure({
        name: t('operationalStudies/manageTrainSchedule:errorMessages.trainScheduleTitle'),
        message: t('operationalStudies/manageTrainSchedule:errorMessages.noOriginTime'),
      })
    );
  } else if (searchDatetimeWindow) {
    const startDatetime = new Date(startTime);
    if (startDatetime < searchDatetimeWindow.begin || searchDatetimeWindow.end < startDatetime) {
      error = true;
      dispatch(
        setFailure({
          name: t('operationalStudies/manageTrainSchedule:errorMessages.trainScheduleTitle'),
          message: t(
            'operationalStudies/manageTrainSchedule:errorMessages.originTimeOutsideWindow',
            {
              low: dateTimeFormatting(searchDatetimeWindow.begin),
              high: dateTimeFormatting(searchDatetimeWindow.end),
            }
          ),
        })
      );
    }
  }

  if (error) return null;
  return {
    infraId: infraID!,
    rollingStockId: rollingStockID!,
    timetableId: timetableID!,
    rollingStockComfort: rollingStockComfortV2,
    path: compact(osrdconf.pathSteps).map((step) => {
      const {
        id,
        arrival,
        deleted,
        locked,
        stopFor,
        positionOnPath,
        coordinates,
        name,
        ch,
        metadata,
        theoreticalMargin,
        kp,
        onStopSignal,
        ...stepLocation
      } = step;

      const duration = stopFor ? sec2ms(ISO8601Duration2sec(stopFor) || Number(stopFor)) : 0;

      if ('track' in stepLocation) {
        return {
          duration,
          location: { track: stepLocation.track, offset: mToMm(stepLocation.offset) },
        };
      }

      const secondary_code = 'trigram' in stepLocation || 'uic' in stepLocation ? ch : undefined;
      return {
        duration,
        // TODO DROP V1: we should store the offset in mm in the store
        location: { ...stepLocation, secondary_code },
      };
    }),
    startTime: originTime!,
    formattedStartTime: startTime!,
    speedLimitByTag,
    maximumRunTime,
    margin: standardStdcmAllowance,
    gridMarginBefore,
    gridMarginAfter,
    lastestStartTime: originUpperBoundTime!,
    workScheduleGroupId,
    electricalProfileSetId,
  };
};

const toMsOrUndefined = (value: number | undefined): number | undefined =>
  value ? sec2ms(value) : undefined;

export const formatStdcmPayload = (
  validConfig: ValidStdcmConfig
): PostV2TimetableByIdStdcmApiArg => {
  const maximumDepartureDelay = sec2ms(
    time2sec(validConfig.lastestStartTime) - time2sec(validConfig.startTime)
  );

  return {
    infra: validConfig.infraId,
    id: validConfig.timetableId,
    body: {
      comfort: validConfig.rollingStockComfort || 'STANDARD',
      margin: createMargin(validConfig.margin),
      maximum_departure_delay: maximumDepartureDelay,
      maximum_run_time: toMsOrUndefined(validConfig.maximumRunTime),
      rolling_stock_id: validConfig.rollingStockId,
      speed_limit_tags: validConfig.speedLimitByTag,
      start_time: validConfig.formattedStartTime,
      steps: validConfig.path,
      time_gap_after: toMsOrUndefined(validConfig.gridMarginBefore),
      time_gap_before: toMsOrUndefined(validConfig.gridMarginAfter),
      work_schedule_group_id: validConfig.workScheduleGroupId,
      electrical_profile_set_id: validConfig.electricalProfileSetId,
    },
  };
};
