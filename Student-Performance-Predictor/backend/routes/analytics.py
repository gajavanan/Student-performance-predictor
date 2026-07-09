from flask import Blueprint, request, jsonify
from database.db import _all, _find
from routes.auth import login_required
import pandas as pd
import numpy as np

analytics_bp = Blueprint("analytics", __name__, url_prefix="/api/analytics")


@analytics_bp.route("/dashboard", methods=["GET"])
@login_required
def get_dashboard():
    try:
        students = _all("students")
        predictions = _all("predictions")
        total_students = students.count
        total_predictions = predictions.count
        avg_performance = 0
        pass_count = 0
        if predictions.data:
            marks = [p.get("predicted_marks", 0) for p in predictions.data if p.get("predicted_marks")]
            if marks:
                avg_performance = round(np.mean(marks), 2)
                pass_count = sum(1 for m in marks if m >= 40)
        pass_percentage = round((pass_count / total_predictions * 100), 2) if total_predictions > 0 else 0
        models_result = _all("ml_models")
        accuracy = 0
        for m in models_result.data:
            if m.get("is_active"):
                accuracy = m.get("accuracy", 0)
                break
        departments = {}
        for s in students.data:
            dept = s.get("department", "Unknown")
            departments[dept] = departments.get(dept, 0) + 1
        dept_analytics = [{"department": d, "count": c} for d, c in sorted(departments.items(), key=lambda x: -x[1])]
        performance_dist = {}
        for p in predictions.data:
            level = p.get("performance", "Unknown")
            performance_dist[level] = performance_dist.get(level, 0) + 1
        grade_dist = {}
        for p in predictions.data:
            g = p.get("grade", "N/A")
            grade_dist[g] = grade_dist.get(g, 0) + 1
        return jsonify({"total_students": total_students, "total_predictions": total_predictions, "average_performance": avg_performance, "pass_percentage": pass_percentage, "accuracy": accuracy, "departments": dept_analytics, "performance_distribution": performance_dist, "grade_distribution": grade_dist, "recent_predictions": predictions.data[-10:] if predictions.data else []}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@analytics_bp.route("/students", methods=["GET"])
@login_required
def get_student_analytics():
    try:
        result = _all("students")
        if not result.data:
            return jsonify({"students": [], "stats": {}}), 200
        df = pd.DataFrame(result.data)
        numeric_cols = ["attendance", "study_hours", "assignment_score", "internal_marks", "previous_marks"]
        stats = {}
        for col in numeric_cols:
            if col in df.columns:
                stats[col] = {"mean": round(df[col].mean(), 2), "median": round(df[col].median(), 2), "min": round(df[col].min(), 2), "max": round(df[col].max(), 2), "std": round(df[col].std(), 2)}
        gender_stats = df["gender"].value_counts().to_dict() if "gender" in df.columns else {}
        semester_stats = df["semester"].value_counts().sort_index().to_dict() if "semester" in df.columns else {}
        return jsonify({"students": result.data, "stats": stats, "gender_distribution": gender_stats, "semester_distribution": semester_stats}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@analytics_bp.route("/ml", methods=["GET"])
@login_required
def get_ml_analytics():
    try:
        result = _all("ml_models", order="created_at")
        return jsonify({"models": result.data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@analytics_bp.route("/department", methods=["GET"])
@login_required
def get_department_analytics():
    try:
        students = _all("students")
        predictions = _all("predictions")
        students_df = pd.DataFrame(students.data) if students.data else pd.DataFrame()
        predictions_df = pd.DataFrame(predictions.data) if predictions.data else pd.DataFrame()
        dept_data = {}
        if not students_df.empty and "department" in students_df.columns:
            for dept in students_df["department"].unique():
                dept_students = students_df[students_df["department"] == dept]
                avg_marks = 0
                avg_attendance = dept_students["attendance"].mean() if "attendance" in dept_students.columns else 0
                student_count = len(dept_students)
                if not predictions_df.empty and "department" in predictions_df.columns:
                    dept_preds = predictions_df[predictions_df["department"] == dept]
                    if not dept_preds.empty and "predicted_marks" in dept_preds.columns:
                        avg_marks = dept_preds["predicted_marks"].mean()
                dept_data[dept] = {"student_count": student_count, "average_marks": round(avg_marks, 2), "average_attendance": round(avg_attendance, 2)}
        return jsonify({"departments": dept_data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500