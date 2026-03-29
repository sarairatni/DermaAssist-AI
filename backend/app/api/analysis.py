from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.patient import Patient
from app.models.skin_image import SkinImage
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
import json

router = APIRouter(prefix="/patients", tags=["Analysis"])


class AnalysisRequest(BaseModel):
    """Request body for skin image analysis."""
    image_id: str


class TestAnalysisRequest(BaseModel):
    """Request body for test analysis with generated CNN data."""
    image_id: str
    condition_name: Optional[str] = None  # e.g., "acne vulgaire"
    confidence: Optional[float] = None    # e.g., 0.88


@router.post("/{patient_id}/analyze-skin-image")
async def analyze_skin_image(
    patient_id: str,
    request: AnalysisRequest,
    db: Session = Depends(get_db)
):
    """
    Analyze a skin image using the RAG pipeline.
    
    Expects:
    {
        "image_id": "uuid of the skin image"
    }
    """
    try:
        image_id = request.image_id
        if not image_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="image_id is required"
            )
        
        # Get patient
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
        
        # Get skin image
        skin_image = db.query(SkinImage).filter(
            SkinImage.id == image_id,
            SkinImage.patient_id == patient_id
        ).first()
        
        if not skin_image:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Image not found"
            )
        
        # Get patient demographics
        patient_age = patient.age or 0
        patient_city = patient.city.value if patient.city else "Unknown"
        patient_fitzpatrick = patient.fitzpatrick_type.value if patient.fitzpatrick_type else "Unknown"
        
        # Parse CNN predictions if available
        module1_output = None
        if skin_image.cnn_predictions:
            try:
                cnn_data = json.loads(skin_image.cnn_predictions) if isinstance(skin_image.cnn_predictions, str) else skin_image.cnn_predictions
                module1_output = {
                    "condition_id": cnn_data.get("condition_id", "unknown"),
                    "condition_name": cnn_data.get("condition_name", "Unknown Condition"),
                    "confidence": cnn_data.get("confidence", 0.5),
                    "top_alternatives": cnn_data.get("top_alternatives", []),
                }
            except Exception as e:
                print(f"Error parsing CNN predictions: {e}")
        
        # If no Module 1 data yet, return template response
        if not module1_output:
            return {
                "status": "waiting_for_module_1",
                "message": "CNN Module 1 analysis not available yet. Please analyze with Module 1 first.",
                "image_id": str(image_id),
                "patient_info": {
                    "age": patient_age,
                    "fitzpatrick": patient_fitzpatrick,
                    "city": patient_city,
                    "medical_history": patient.medical_history or "None"
                },
                "image_metadata": {
                    "cnn_label": skin_image.cnn_label,
                    "cnn_confidence": skin_image.cnn_confidence,
                    "uploaded_at": skin_image.uploaded_at.isoformat() if skin_image.uploaded_at else None,
                    "source": skin_image.source.value if skin_image.source else None
                }
            }
        
        # Import RAG pipeline components
        try:
            from app.ai.modele2_RAG.rag_pipeline import DiagnosisAwareRetriever, ClinicalGenerator, Module1Output
            from app.ai.modele2_RAG.alert_engine import PatientContext
        except ImportError as e:
            print(f"Warning: Could not import RAG modules: {e}")
            # Return basic response if RAG modules not available
            return {
                "status": "rag_unavailable",
                "message": "RAG pipeline not available. Returning basic analysis.",
                "condition_name": module1_output["condition_name"],
                "confidence": module1_output["confidence"],
                "top_alternatives": module1_output.get("top_alternatives", []),
            }
        
        # Build Module 1 Output object
        module1 = Module1Output(
            condition_id=module1_output["condition_id"],
            condition_name=module1_output["condition_name"],
            confidence=module1_output["confidence"],
            top_alternatives=module1_output.get("top_alternatives", []),
        )
        
        # Build Patient Context
        patient_context = PatientContext(
            age=patient_age,
            sexe="unknown",  # Not available in current schema
            fitzpatrick=patient_fitzpatrick,
            ville=patient_city,
            antecedents=patient.medical_history.split(",") if patient.medical_history else [],
            medicaments_actuels=[],
        )
        
        # Initialize RAG pipeline
        retriever = DiagnosisAwareRetriever()
        generator = ClinicalGenerator()
        
        # Get retrieval results
        retrieval_results = retriever.retrieve(module1, patient_context)
        
        # Generate initial analysis
        analyse_resultat_initiale = generator.generate_analyse_initiale(
            module1,
            patient_context,
            retrieval_results["condition_data"],
            retrieval_results["confidence_level"],
            retrieval_results["retrieved_chunks"],
        )
        
        # Generate refined analysis (if questions available)
        analyse_resultat_affinee = generator.generate_analyse_affinee(
            module1,
            patient_context,
            retrieval_results["condition_data"],
            retrieval_results["confidence_level"],
            retrieval_results["retrieved_chunks"],
            [],  # No question answers yet
        )
        
        # Compile response
        response = {
            "status": "success",
            "condition_id": module1_output["condition_id"],
            "condition_name": module1_output["condition_name"],
            "confidence": module1_output["confidence"],
            "confidence_level": retrieval_results["confidence_level"],
            "top_alternatives": module1_output.get("top_alternatives", []),
            
            # Analysis results
            "analyse_initiale": analyse_resultat_initiale.get("analyse_initiale", ""),
            "analyse_affinee": analyse_resultat_affinee.get("analyse_affinee", ""),
            "urgence_display": analyse_resultat_initiale.get("urgence_display", ""),
            
            # Clinical recommendations
            "plan_prise_en_charge": analyse_resultat_affinee.get("plan_prise_en_charge", []),
            "delai_urgence": analyse_resultat_affinee.get("delai_urgence", ""),
            "medicaments_a_eviter": analyse_resultat_affinee.get("medicaments_a_eviter", []),
            
            # Medications and alerts
            "medicaments": retrieval_results.get("medicaments", []),
            "alertes_patient": retrieval_results.get("alertes_patient", []),
            "alertes_maladie": retrieval_results.get("alertes_maladie", []),
            "questions": retrieval_results.get("questions", []),
            
            # Image metadata
            "image_id": str(image_id),
            "patient_id": str(patient_id),
            "analyzed_at": datetime.utcnow().isoformat(),
        }
        
        return response
    
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Error during analysis: {e}")
        print(traceback.format_exc())
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )


@router.post("/{patient_id}/test-analyze-skin-image")
async def test_analyze_skin_image(
    patient_id: str,
    request: TestAnalysisRequest,
    db: Session = Depends(get_db)
):
    """
    TEST ENDPOINT: Analyze a skin image with automatically generated CNN test data.
    
    This endpoint:
    1. Generates realistic CNN predictions from the knowledge base
    2. Populates the skin_image database record with this test data
    3. Calls the regular analyze-skin-image endpoint
    
    Useful for testing the RAG pipeline before Module 1 (CNN) is ready.
    
    Request:
    {
        "image_id": "uuid of the skin image",
        "condition_name": "acne vulgaire" (optional - if None, random),
        "confidence": 0.88 (optional - if None, random between 0.75-0.95)
    }
    
    Examples:
        - POST /patients/{id}/test-analyze-skin-image
          {"image_id": "xxx", "condition_name": None, "confidence": None}
          -> Random condition with random confidence
        
        - POST /patients/{id}/test-analyze-skin-image
          {"image_id": "xxx", "condition_name": "acne vulgaire"}
          -> Acne vulgaire with random confidence
        
        - POST /patients/{id}/test-analyze-skin-image
          {"image_id": "xxx", "condition_name": "acne vulgaire", "confidence": 0.88}
          -> Acne vulgaire with 88% confidence
    """
    try:
        image_id = request.image_id
        if not image_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="image_id is required"
            )
        
        # Get patient
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
        
        # Get skin image
        skin_image = db.query(SkinImage).filter(
            SkinImage.id == image_id,
            SkinImage.patient_id == patient_id
        ).first()
        
        if not skin_image:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Image not found"
            )
        
        # Generate test CNN data
        from app.utils.test_cnn_data import generate_test_cnn_data
        
        try:
            cnn_data = generate_test_cnn_data(
                condition_name=request.condition_name,
                confidence=request.confidence
            )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        
        # Update skin_image with test CNN data
        skin_image.cnn_predictions = json.dumps(cnn_data)
        skin_image.cnn_label = cnn_data.get("condition_id")
        skin_image.cnn_confidence = cnn_data.get("confidence")
        skin_image.analyzed_at = datetime.utcnow()
        
        db.commit()
        db.refresh(skin_image)
        
        print(f"Generated test CNN data for image {image_id}:")
        print(f"  Condition: {cnn_data.get('condition_name')}")
        print(f"  Confidence: {cnn_data.get('confidence')}")
        print(f"  Alternatives: {len(cnn_data.get('top_alternatives', []))} conditions")
        
        # Build response with test CNN data
        try:
            # Try to import and use RAG pipeline
            from app.ai.modele2_RAG.rag_pipeline import DiagnosisAwareRetriever, ClinicalGenerator, Module1Output
            from app.ai.modele2_RAG.alert_engine import PatientContext
            
            # Get patient details for context
            patient_age = patient.age
            patient_fitzpatrick = patient.fitzpatrick_skin_type or "Unknown"
            patient_city = patient.city or "Unknown"
            
            # Build Module 1 Output object from test data
            module1 = Module1Output(
                condition_id=cnn_data["condition_id"],
                condition_name=cnn_data["condition_name"],
                confidence=cnn_data["confidence"],
                top_alternatives=cnn_data.get("top_alternatives", []),
            )
            
            # Build Patient Context
            patient_context = PatientContext(
                age=patient_age,
                sexe="unknown",
                fitzpatrick=patient_fitzpatrick,
                ville=patient_city,
                antecedents=patient.medical_history.split(",") if patient.medical_history else [],
                medicaments_actuels=[],
            )
            
            # Initialize RAG pipeline
            retriever = DiagnosisAwareRetriever()
            generator = ClinicalGenerator()
            
            # Get retrieval results
            retrieval_results = retriever.retrieve(module1, patient_context)
            
            # Generate initial analysis
            analyse_resultat_initiale = generator.generate_analyse_initiale(
                module1,
                patient_context,
                retrieval_results["condition_data"],
                retrieval_results["confidence_level"],
                retrieval_results["retrieved_chunks"],
            )
            
            # Generate refined analysis
            analyse_resultat_affinee = generator.generate_analyse_affinee(
                module1,
                patient_context,
                retrieval_results["condition_data"],
                retrieval_results["confidence_level"],
                retrieval_results["retrieved_chunks"],
                [],
            )
            
            # Return full analysis response
            return {
                "status": "success",
                "message": "Test analysis completed with generated CNN data",
                "condition_id": cnn_data["condition_id"],
                "condition_name": cnn_data["condition_name"],
                "confidence": cnn_data["confidence"],
                "confidence_level": retrieval_results["confidence_level"],
                "top_alternatives": cnn_data.get("top_alternatives", []),
                "analyse_initiale": analyse_resultat_initiale.get("analyse_initiale", ""),
                "analyse_affinee": analyse_resultat_affinee.get("analyse_affinee", ""),
                "urgence_display": analyse_resultat_initiale.get("urgence_display", ""),
                "plan_management": analyse_resultat_initiale.get("plan_management", []),
                "medications_avoid": analyse_resultat_initiale.get("medications_avoid", []),
                "medicaments_recommandes": analyse_resultat_affinee.get("medicaments_recommandes", []),
                "clinical_alerts": analyse_resultat_affinee.get("clinical_alerts", []),
            }
        
        except ImportError as e:
            print(f"Warning: RAG modules not available: {e}")
            # Return basic response if RAG modules not available
            return {
                "status": "success",
                "message": "Test analysis completed (RAG pipeline unavailable)",
                "condition_id": cnn_data["condition_id"],
                "condition_name": cnn_data["condition_name"],
                "confidence": cnn_data["confidence"],
                "top_alternatives": cnn_data.get("top_alternatives", []),
                "analyse_initiale": f"Condition detected: {cnn_data['condition_name']} with {int(cnn_data['confidence']*100)}% confidence",
                "urgence_display": "RAG pipeline unavailable",
            }
        except Exception as e:
            import traceback
            print(f"Error during RAG analysis: {e}")
            print(traceback.format_exc())
            # Still return the test data on error
            return {
                "status": "partial_success",
                "message": f"Test data generated but analysis failed: {str(e)}",
                "condition_id": cnn_data["condition_id"],
                "condition_name": cnn_data["condition_name"],
                "confidence": cnn_data["confidence"],
                "top_alternatives": cnn_data.get("top_alternatives", []),
            }
    
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Error during test analysis: {e}")
        print(traceback.format_exc())
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Test analysis failed: {str(e)}"
        )
