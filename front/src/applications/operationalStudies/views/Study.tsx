import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import NavBarSNCF from 'common/BootstrapSNCF/NavBarSNCF';
import { useTranslation } from 'react-i18next';
import Loader, { Spinner } from 'common/Loader';
import nextId from 'react-id-generator';
import OptionsSNCF from 'common/BootstrapSNCF/OptionsSNCF';
import ScenarioCard from 'modules/scenario/components/ScenarioCard';
import ScenarioCardEmpty from 'modules/scenario/components/ScenarioCardEmpty';
import { GoPencil } from 'react-icons/go';
import { budgetFormat } from 'utils/numbers';
import { useModal } from 'common/BootstrapSNCF/ModalSNCF';
import DateBox from 'applications/operationalStudies/components/Study/DateBox';
import StateStep from 'applications/operationalStudies/components/Study/StateStep';
import {
  PostSearchApiArg,
  ScenarioWithCountTrains,
  osrdEditoastApi,
} from 'common/api/osrdEditoastApi';
import AddOrEditStudyModal from 'modules/study/components/AddOrEditStudyModal';
import BreadCrumbs from '../components/BreadCrumbs';
import FilterTextField from '../components/FilterTextField';
import { StudyState, studyStates } from '../consts';

type SortOptions =
  | 'NameAsc'
  | 'NameDesc'
  | 'CreationDateAsc'
  | 'CreationDateDesc'
  | 'LastModifiedAsc'
  | 'LastModifiedDesc';

type studyParams = {
  projectId: string;
  studyId: string;
};

export default function Study() {
  const { t } = useTranslation('operationalStudies/study');
  const { openModal } = useModal();
  const [scenariosList, setScenariosList] = useState<ScenarioWithCountTrains[]>([]);
  const [filter, setFilter] = useState('');
  const [filterChips, setFilterChips] = useState('');
  const [sortOption, setSortOption] = useState<SortOptions>('LastModifiedDesc');
  const { projectId: urlProjectId, studyId: urlStudyId } = useParams() as studyParams;
  const [isLoading, setIsLoading] = useState(true);

  const { projectId, studyId } = useMemo(
    () => ({
      projectId: !Number.isNaN(+urlProjectId) ? +urlProjectId : undefined,
      studyId: !Number.isNaN(+urlStudyId) ? +urlStudyId : undefined,
    }),
    [urlStudyId, urlProjectId]
  );

  const {
    data: project,
    isError: isProjectError,
    error: projectError,
  } = osrdEditoastApi.useGetProjectsByProjectIdQuery(
    { projectId: +projectId! },
    {
      skip: !projectId,
    }
  );

  const {
    data: study,
    isError: isCurrentStudyError,
    error: studyError,
  } = osrdEditoastApi.useGetProjectsByProjectIdStudiesAndStudyIdQuery(
    {
      projectId: +projectId!,
      studyId: +studyId!,
    },
    {
      skip: !projectId || !studyId,
    }
  );

  const [postSearch] = osrdEditoastApi.usePostSearchMutation();
  const [getScenarios] =
    osrdEditoastApi.useLazyGetProjectsByProjectIdStudiesAndStudyIdScenariosQuery();

  useEffect(() => {
    if (!projectId || !studyId) throw new Error('Missing projectId or studyId in url');
  }, [projectId, studyId]);

  useEffect(() => {
    if (isProjectError && projectError) {
      throw projectError;
    }
    if (isCurrentStudyError && studyError) throw studyError;
  }, [isProjectError, projectError, isCurrentStudyError, studyError]);

  const sortOptions = [
    {
      label: t('sortOptions.byName'),
      value: 'NameAsc',
    },
    {
      label: t('sortOptions.byRecentDate'),
      value: 'LastModifiedDesc',
    },
  ];

  const handleSortOptions = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSortOption(e.target.value as SortOptions);
  };

  const getScenarioList = async () => {
    setIsLoading(true);
    if (projectId && studyId) {
      if (filter) {
        const payload: PostSearchApiArg = {
          pageSize: 1000,
          searchPayload: {
            object: 'scenario',
            query: [
              'and',
              [
                'or',
                ['search', ['name'], filter],
                ['search', ['description'], filter],
                ['search', ['tags'], filter],
              ],
              ['=', ['study_id'], studyId],
            ],
          },
        };
        try {
          let filteredScenarios = (await postSearch(payload).unwrap()) as ScenarioWithCountTrains[];
          if (sortOption === 'LastModifiedDesc') {
            filteredScenarios = [...filteredScenarios].sort((a, b) =>
              b.last_modification.localeCompare(a.last_modification)
            );
          } else if (sortOption === 'NameAsc') {
            filteredScenarios = [...filteredScenarios].sort((a, b) => a.name.localeCompare(b.name));
          }
          setScenariosList(filteredScenarios as ScenarioWithCountTrains[]);
        } catch (error) {
          console.error(error);
        } finally {
          setIsLoading(false);
        }
      } else {
        try {
          const { data } = await getScenarios({
            projectId: +projectId,
            studyId: +studyId,
            ordering: sortOption,
            pageSize: 1000,
          });
          if (data?.results) setScenariosList(data.results);
        } catch (error) {
          console.error(error);
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  function displayScenariosList() {
    return !isLoading ? (
      <div className="row no-gutters">
        <div className="col-hdp-3 col-hd-4 col-lg-6">
          <ScenarioCardEmpty />
        </div>
        {scenariosList.map((scenario) => (
          <div
            className="col-hdp-3 col-hd-4 col-lg-6"
            key={`study-displayScenariosList-${scenario.id}`}
          >
            <ScenarioCard scenario={scenario} setFilterChips={setFilterChips} />
          </div>
        ))}
      </div>
    ) : (
      <span className="mt-5 text-center">
        <Spinner displayDelay={500} />
      </span>
    );
  }

  useEffect(() => {
    if (studyId) getScenarioList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortOption, filter]);

  return (
    <>
      <NavBarSNCF appName={<BreadCrumbs project={project} study={study} />} />
      <main className="mastcontainer mastcontainer-no-mastnav">
        <div className="p-3 study-view">
          {project && study ? (
            <div className="study-details">
              <div className="study-details-dates">
                <DateBox
                  date={study.creation_date ? new Date(study.creation_date) : null}
                  className="creation"
                  translation="creation"
                />
                <DateBox
                  date={study.start_date ? new Date(study.start_date) : null}
                  className="start"
                  translation="start"
                  withoutTime
                />
                <DateBox
                  date={study.expected_end_date ? new Date(study.expected_end_date) : null}
                  className="estimatedend"
                  translation="estimatedend"
                  withoutTime
                />
                <DateBox
                  date={study.actual_end_date ? new Date(study.actual_end_date) : null}
                  className="realend"
                  translation="realend"
                  withoutTime
                />
                <DateBox
                  date={study.last_modification ? new Date(study.last_modification) : null}
                  className="modified"
                  translation="modified"
                />
              </div>
              <div className="d-flex flex-column p-2">
                <div className="study-details-name">
                  <div className="study-name">{study.name}</div>
                  <button
                    className="study-details-modify-button"
                    type="button"
                    onClick={() =>
                      openModal(<AddOrEditStudyModal editionMode study={study} />, 'xl')
                    }
                  >
                    <span className="study-details-modify-button-text">{t('modifyStudy')}</span>
                    <GoPencil />
                  </button>
                </div>
                {study.study_type && (
                  <div className="study-details-type">
                    {t(`studyCategories.${study.study_type}`)}
                  </div>
                )}
                <div className="study-details-description">{study.description}</div>
                {study.state && (
                  <div className="study-details-state">
                    {studyStates.map(
                      (state, idx) =>
                        project.id &&
                        study.id &&
                        study.state && (
                          <StateStep
                            key={nextId()}
                            projectID={project.id}
                            studyID={study.id}
                            number={idx + 1}
                            studyName={study.name}
                            state={state}
                            done={idx <= studyStates.indexOf(study.state as StudyState)}
                            tags={study.tags}
                          />
                        )
                    )}
                  </div>
                )}
              </div>

              {study.service_code || study.business_code || study.budget ? (
                <div className="study-details-financials">
                  <div className="study-details-financials-infos">
                    {study.service_code && (
                      <div className="study-details-financials-infos-item">
                        <h3>{t('geremiCode')}</h3>
                        <div className="code">{study.service_code}</div>
                      </div>
                    )}
                    {study.business_code && (
                      <div className="study-details-financials-infos-item">
                        <h3>{t('affairCode')}</h3>
                        <div className="code">{study.business_code}</div>
                      </div>
                    )}
                  </div>
                  {study.budget !== 0 ? (
                    <div className="study-details-financials-amount">
                      <span className="study-details-financials-amount-text">{t('budget')}</span>
                      {budgetFormat(study.budget)}
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="study-details-footer">
                <div className="study-details-tags">
                  {study.tags?.map((tag) => (
                    <div className="study-details-tags-tag" key={nextId()}>
                      {tag}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <span className="mt-5">
              <Loader position="center" />
            </span>
          )}

          <div className="scenarios-toolbar">
            <div className="">
              {t('scenariosCount', { count: scenariosList ? scenariosList.length : 0 })}
            </div>
            <div className="flex-grow-1">
              <FilterTextField
                setFilter={setFilter}
                filterChips={filterChips}
                id="scenarios-filter"
                sm
              />
            </div>
            <OptionsSNCF
              name="projects-sort-filter"
              onChange={handleSortOptions}
              selectedValue={sortOption}
              options={sortOptions}
              sm
            />
          </div>

          <div className="scenarios-list">
            {useMemo(() => displayScenariosList(), [scenariosList])}
          </div>
        </div>
      </main>
    </>
  );
}
