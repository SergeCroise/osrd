use diesel::sql_types::{Array, Integer, Json};
use diesel::PgConnection;
use diesel::{sql_query, RunQueryDsl};

use super::graph::Graph;
use crate::generated_data::error::ErrGenerator;
use crate::infra_cache::InfraCache;
use crate::schema::{DetectorCache, InfraError, ObjectRef, ObjectType};
use diesel::result::Error as DieselError;
use serde_json::{to_value, Value};

const DETECTOR_ERRORS: [ErrGenerator<&DetectorCache>; 2] = [check_invalid_ref, check_out_of_range];

pub fn insert_errors(
    conn: &PgConnection,
    infra_id: i32,
    infra_cache: &InfraCache,
) -> Result<(), DieselError> {
    let infra_errors = generate_errors(infra_cache);

    let errors: Vec<Value> = infra_errors
        .iter()
        .map(|error| to_value(error).unwrap())
        .collect();
    let count = sql_query(include_str!("sql/detectors_insert_errors.sql"))
        .bind::<Integer, _>(infra_id)
        .bind::<Array<Json>, _>(&errors)
        .execute(conn)?;
    assert_eq!(count, infra_errors.len());

    Ok(())
}

pub fn generate_errors(infra_cache: &InfraCache) -> Vec<InfraError> {
    let mut errors = vec![];

    for detector in infra_cache.detectors().values() {
        let detector = detector.unwrap_detector();
        // Retrieve invalid refs
        for f in DETECTOR_ERRORS.iter() {
            errors.extend(f(detector, infra_cache, &Graph::load(&infra_cache)));
        }

        // let infra_errors = check_invalid_ref(detector, infra_cache);
        // if !infra_errors.is_empty() {
        //     errors.extend(infra_errors);
        //     continue;
        // }
        // Retrieve out of range
        // let infra_errors = check_out_of_range(detector, infra_cache);
        // if !infra_errors.is_empty() {
        //     errors.extend(infra_errors);
        //     continue;
        // }
    }
    errors
}

/// Retrieve invalide ref error for detectors
pub fn check_invalid_ref(
    detector: &DetectorCache,
    infra_cache: &InfraCache,
    _: &Graph,
) -> Vec<InfraError> {
    if !infra_cache.track_sections().contains_key(&detector.track) {
        let obj_ref = ObjectRef::new(ObjectType::TrackSection, detector.track.clone());
        vec![InfraError::new_invalid_reference(
            detector, "track", obj_ref,
        )]
    } else {
        vec![]
    }
}

/// Retrieve out of range position error for detectors
pub fn check_out_of_range(
    detector: &'static DetectorCache,
    infra_cache: &InfraCache,
    _: &Graph,
) -> Vec<InfraError> {
    let track_cache = infra_cache
        .track_sections()
        .get(&detector.track)
        .unwrap()
        .unwrap_track_section();
    if !(0.0..=track_cache.length).contains(&detector.position) {
        vec![InfraError::new_out_of_range(
            detector,
            "position",
            detector.position,
            [0.0, track_cache.length],
        )]
    } else {
        vec![]
    }
}
#[cfg(test)]
mod tests {
    use crate::infra_cache::tests::{create_detector_cache, create_small_infra_cache};
    use crate::schema::{ObjectRef, ObjectType};

    use super::check_invalid_ref;
    use super::check_out_of_range;
    use super::InfraError;
    use crate::generated_data::error::graph::Graph;

    #[test]
    fn invalid_ref() {
        let mut infra_cache = create_small_infra_cache();
        let detector = create_detector_cache("D_error", "E", 250.);
        infra_cache.add(detector.clone());
        let errors = check_invalid_ref(&detector, &infra_cache, &Graph::load(&infra_cache));
        assert_eq!(1, errors.len());
        let obj_ref = ObjectRef::new(ObjectType::TrackSection, "E");
        let infra_error = InfraError::new_invalid_reference(&detector, "track", obj_ref);
        assert_eq!(infra_error, errors[0]);
    }

    #[test]
    fn out_of_range() {
        let mut infra_cache = create_small_infra_cache();
        let detector = create_detector_cache("D_error", "A", 530.);
        infra_cache.add(detector.clone());
        let errors = check_out_of_range(&detector, &infra_cache, &Graph::load(&infra_cache));
        assert_eq!(1, errors.len());
        let infra_error = InfraError::new_out_of_range(&detector, "position", 530., [0.0, 500.]);
        assert_eq!(infra_error, errors[0]);
    }
}
