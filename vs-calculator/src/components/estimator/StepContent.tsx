import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
// 🛠️ FIX 1: Ensure handleOptionChange is destructured
import { useEstimator } from "@/context/EstimatorContext";
import LocationStep from "@/components/estimator/LocationStep";
import ProjectTypeStep from "@/components/estimator/ProjectTypeStep";
import AreaStep from "@/components/estimator/AreaStep";
import ComponentsStep from "@/components/estimator/ComponentsStep";
import FinishesStep from "@/components/estimator/FinishesStep";
import AmenitiesStep from "@/components/estimator/AmenitiesStep";
import InteriorsStep from "@/components/estimator/InteriorsStep";
import ResultsStep from "@/components/estimator/ResultsStep";

const StepContent = () => {
  // ✅ FIX 1: Destructure handleOptionChange
  const { step, estimate, updateEstimate, handleReset, handleSaveEstimate, handleOptionChange } = useEstimator();

  // Each step replaces the previous one's content in place, so without this
  // the page keeps whatever scroll position the user was at on the prior
  // step (e.g. landing on Results already scrolled to where Components left off).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  // Set default "standard" options when first reaching step 4
  useEffect(() => {
    if (step === 4) {
      const componentsToInitialize = [
        'plumbing', 'ac', 'electrical', 'elevator', 'civilQuality',
        'lighting', 'windows', 'ceiling', 'surfaces', 'buildingEnvelope', 'waterproofing',
        'fixedFurniture', 'looseFurniture', 'furnishings', 'appliances', 'artefacts'
      ];

      componentsToInitialize.forEach(component => {
        if (!estimate[component as keyof typeof estimate]) {
          updateEstimate(component as keyof typeof estimate, 'standard');
        }
      });
    }
  }, [step, estimate, updateEstimate]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="min-h-[300px]"
      >
        {step === 1 && (
          <LocationStep
            selectedState={estimate.state}
            selectedCity={estimate.city}
            onStateSelect={(state) => updateEstimate('state', state)}
            onCitySelect={(city) => updateEstimate('city', city)}
          />
        )}

        {step === 2 && (
          <ProjectTypeStep
            selectedType={estimate.projectType}
            selectedWorkTypes={estimate.workTypes}
            selectedRoomConfig={estimate.roomConfiguration}
            selectedRoomCounts={estimate.roomCounts}
            selectedLandscapeAreas={estimate.landscapeAreas}
            selectedConstructionSubtype={estimate.constructionSubtype}
            selectedProjectMode={estimate.projectMode}
            selectedFoundationType={estimate.foundationType}
            selectedFloorCount={estimate.floorCount}
            selectedAreaInputType={estimate.areaInputType}
            onSelectType={(type) => updateEstimate('projectType', type)}
            onSelectWorkTypes={(workTypes) => updateEstimate('workTypes', workTypes)}
            onSelectRoomConfig={(config) => updateEstimate('roomConfiguration', config)}
            onSelectRoomCounts={(counts) => updateEstimate('roomCounts', counts)}
            onSelectLandscapeAreas={(areas) => updateEstimate('landscapeAreas', areas)}
            onSelectConstructionSubtype={(subtype) => updateEstimate('constructionSubtype', subtype)}
            onSelectProjectMode={(mode) => updateEstimate('projectMode', mode)}
            onSelectFoundationType={(type) => updateEstimate('foundationType', type)}
            onSelectFloorCount={(count) => updateEstimate('floorCount', count)}
            onSelectAreaInputType={(type) => updateEstimate('areaInputType', type)}
          />
        )}

        {step === 3 && (
          <AreaStep
            area={estimate.area}
            areaUnit={estimate.areaUnit}
            projectType={estimate.projectType}
            city={estimate.city}
            constructionSubtype={estimate.constructionSubtype}
            floorCount={estimate.floorCount}
            areaInputType={estimate.areaInputType}
            onAreaChange={(area) => updateEstimate('area', area)}
            onUnitChange={(unit) => updateEstimate('areaUnit', unit)}
            onBuiltUpAreaChange={(builtUpArea) => updateEstimate('builtUpArea', builtUpArea)}
            onFSIComplianceChange={(isCompliant) => updateEstimate('fsiCompliant', isCompliant)}
            onFloorCountChange={(floorCount) => updateEstimate('floorCount', floorCount)}
          />
        )}

        {step === 4 && (
          <div className="space-y-6">
            <ComponentsStep
              plumbing={estimate.plumbing}
              ac={estimate.ac}
              electrical={estimate.electrical}
              elevator={estimate.elevator}
              civilQuality={estimate.civilQuality}
              workTypes={estimate.workTypes}
              onOptionChange={handleOptionChange}
            />

            <FinishesStep
              lighting={estimate.lighting}
              windows={estimate.windows}
              ceiling={estimate.ceiling}
              surfaces={estimate.surfaces}
              buildingEnvelope={estimate.buildingEnvelope}
              waterproofing={estimate.waterproofing}
              workTypes={estimate.workTypes}
              onOptionChange={handleOptionChange}
            />

            <AmenitiesStep
              selectedAmenities={estimate.amenities ?? []}
              projectType={estimate.projectType}
              workTypes={estimate.workTypes}
              onToggleAmenity={(amenities) => updateEstimate('amenities', amenities)}
            />

            <InteriorsStep
              fixedFurniture={estimate.fixedFurniture}
              looseFurniture={estimate.looseFurniture}
              furnishings={estimate.furnishings}
              appliances={estimate.appliances}
              artefacts={estimate.artefacts}
              workTypes={estimate.workTypes}
              onOptionChange={handleOptionChange}
            />
          </div>
        )}

        {step === 5 && (
          <ResultsStep
            estimate={estimate}
            onReset={handleReset}
            onSave={handleSaveEstimate}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default StepContent;
