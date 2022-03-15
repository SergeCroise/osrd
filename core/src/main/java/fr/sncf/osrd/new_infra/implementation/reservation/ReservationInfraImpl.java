package fr.sncf.osrd.new_infra.implementation.reservation;

import com.google.common.collect.ImmutableMap;
import com.google.common.graph.ImmutableNetwork;
import fr.sncf.osrd.new_infra.api.Direction;
import fr.sncf.osrd.new_infra.api.reservation.*;
import fr.sncf.osrd.new_infra.api.tracks.directed.DiTrackInfra;
import fr.sncf.osrd.new_infra.implementation.tracks.directed.DiTrackInfraImpl;

public class ReservationInfraImpl extends DiTrackInfraImpl implements ReservationInfra {

    private final ImmutableMap<String, Detector> detectorMap;
    private final ImmutableMap<DiDetector, DetectionSection> sectionMap;
    private final ImmutableNetwork<DiDetector, ReservationRoute> infraRouteGraph;
    private final ImmutableMap<Direction, ImmutableMap<String, DiDetector>> diDetectorMap;

    /** Constructor */
    public ReservationInfraImpl(
            DiTrackInfra infra,
            ImmutableMap<String, Detector> detectorMap,
            ImmutableMap<Direction, ImmutableMap<String, DiDetector>> diDetectorMap,
            ImmutableMap<DiDetector, DetectionSection> sectionMap,
            ImmutableNetwork<DiDetector, ReservationRoute> infraRouteGraph
    ) {
        super(infra, infra.getDiTrackGraph());
        this.detectorMap = detectorMap;
        this.diDetectorMap = diDetectorMap;
        this.sectionMap = sectionMap;
        this.infraRouteGraph = infraRouteGraph;
    }

    @Override
    public ImmutableMap<String, Detector> getDetectorMap() {
        return detectorMap;
    }

    @Override
    public ImmutableMap<Direction, ImmutableMap<String, DiDetector>> getDiDetectorMap() {
        return diDetectorMap;
    }

    @Override
    public ImmutableMap<DiDetector, DetectionSection> getSectionMap() {
        return sectionMap;
    }

    @Override
    public ImmutableNetwork<DiDetector, ReservationRoute> getInfraRouteGraph() {
        return infraRouteGraph;
    }
}
