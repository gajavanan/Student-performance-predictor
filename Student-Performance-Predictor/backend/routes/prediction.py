from flask import Blueprint, request, jsonify
from database.db import _insert, _search, _delete, _all, _find
from routes.auth import login_required
from services.ml_service import load_model, predict_performance, get_ai_insights

prediction_bp = Blueprint("prediction", __name__, url_prefix="/api/predictions")


@prediction_bp.route("/predict", methods=["POST"])
@login_required
def predict():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        model = load_model()
        if model is None:
            return jsonify({"error": "No trained model found. Please train a model first."}), 400
        features = {"attendance": float(data.get("attendance", 0)), "study_hours": float(data.get("study_hours", 0)), "assignment_score": float(data.get("assignment_score", 0)), "internal_marks": float(data.get("internal_marks", 0)), "previous_marks": float(data.get("previous_marks", 0))}
        result = predict_performance(model, features)
        insights = get_ai_insights(features)
        rec = _insert("predictions", {"student_id": data.get("student_id", "N/A"), "student_name": data.get("student_name", ""), "department": data.get("department", ""), "semester": int(data.get("semester", 1)), "attendance": features["attendance"], "study_hours": features["study_hours"], "assignment_score": features["assignment_score"], "internal_marks": features["internal_marks"], "previous_marks": features["previous_marks"], "predicted_marks": result["predicted_marks"], "grade": result["grade"], "performance": result["performance"], "risk_level": result["risk_level"], "recommendation": result["recommendation"], "algorithm": data.get("algorithm", "Random Forest"), "accuracy": float(data.get("accuracy", 0))})
        return jsonify({"prediction": result, "insights": insights, "record_id": rec.data[0]["id"] if rec.data else None}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@prediction_bp.route("/history", methods=["GET"])
@login_required
def get_history():
    try:
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 20, type=int)
        search = request.args.get("search", "").strip()
        dept = request.args.get("department", "").strip()
        perf = request.args.get("performance", "").strip()
        filters = {}
        if dept: filters["department"] = dept
        if perf: filters["performance"] = perf
        result = _search("predictions", search, ["student_name", "student_id"], page=page, per_page=per_page, filters=filters)
        return jsonify({"predictions": result.data, "total": result.count, "page": page, "per_page": per_page, "total_pages": max(1, -(-result.count // per_page))}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@prediction_bp.route("/<prediction_id>", methods=["DELETE"])
@login_required
def delete_prediction(prediction_id):
    try:
        _delete("predictions", "id", prediction_id)
        return jsonify({"message": "Prediction deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@prediction_bp.route("/export", methods=["GET"])
@login_required
def export_predictions():
    try:
        result = _all("predictions", order="created_at")
        return jsonify({"predictions": result.data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500