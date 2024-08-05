/* eslint-disable import/prefer-default-export */
import type { ManageTrainSchedulePathProperties } from 'applications/operationalStudies/types';
import type { ConfSliceActions } from 'reducers/osrdconf/osrdConfCommon';
import type { PathStep } from 'reducers/osrdconf/types';
import { store } from 'store';

export function setPointItiV2(
  pointType: 'origin' | 'destination' | 'via',
  pathStep: PathStep,
  actions: ConfSliceActions,
  pathProperties?: ManageTrainSchedulePathProperties
) {
  const { updateOriginV2, updateDestinationV2, addViaV2, updateFeatureInfoClick } = actions;

  switch (pointType) {
    case 'origin':
      store.dispatch(updateOriginV2(pathStep));
      break;
    case 'destination':
      store.dispatch(updateDestinationV2(pathStep));
      break;
    default:
      if (pathProperties) {
        store.dispatch(addViaV2({ newVia: pathStep, pathProperties }));
      } else {
        console.error('No pathProperties');
      }
  }
  store.dispatch(updateFeatureInfoClick({ displayPopup: false }));
}
