from flask import Blueprint, request, jsonify
from database.db import _find, _insert, _update, _delete, _all, _search
from routes.auth import login_required

students_bp = Blueprint("students", __name__, url_prefix="/api/students")


@students_bp.route("", methods=["GET"])
@login_required
def get_students():
    try:
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 20, type=int)
        search = request.args.get("search", "").strip()
        result = _search("students", search, ["name", "student_id", "department"], page=page, per_page=per_page)
        return jsonify({"students": result.data, "total": result.count, "page": page, "per_page": per_page, "total_pages": max(1, -(-result.count // per_page))}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@students_bp.route("/<student_id>", methods=["GET"])
@login_required
def get_student(student_id):
    try:
        result = _find("students", "student_id", student_id)
        if not result.data:
            return jsonify({"error": "Student not found"}), 404
        return jsonify({"student": result.data[0]}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@students_bp.route("", methods=["POST"])
@login_required
def add_student():
    try:
        data = request.get_json()
        required = ["student_id", "name", "department", "semester", "age", "gender"]
        missing = [f for f in required if not data.get(f)]
        if missing:
            return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400
        existing = _find("students", "student_id", data["student_id"])
        if existing.data:
            return jsonify({"error": "Student ID already exists"}), 409
        rec = _insert("students", {"student_id": data["student_id"], "name": data["name"], "department": data["department"], "semester": int(data["semester"]), "age": int(data["age"]), "gender": data["gender"], "attendance": float(data.get("attendance", 0)), "study_hours": float(data.get("study_hours", 0)), "assignment_score": float(data.get("assignment_score", 0)), "internal_marks": float(data.get("internal_marks", 0)), "previous_marks": float(data.get("previous_marks", 0))})
        return jsonify({"message": "Student added successfully", "student": rec.data[0]}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@students_bp.route("/<student_id>", methods=["PUT"])
@login_required
def update_student(student_id):
    try:
        data = request.get_json()
        update_data = {}
        fields = ["name", "department", "semester", "age", "gender", "attendance", "study_hours", "assignment_score", "internal_marks", "previous_marks"]
        for field in fields:
            if field in data:
                val = data[field]
                if field in ["semester", "age"]:
                    val = int(val)
                elif field in ["attendance", "study_hours", "assignment_score", "internal_marks", "previous_marks"]:
                    val = float(val)
                update_data[field] = val
        if not update_data:
            return jsonify({"error": "No fields to update"}), 400
        _update("students", "student_id", student_id, update_data)
        return jsonify({"message": "Student updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@students_bp.route("/<student_id>", methods=["DELETE"])
@login_required
def delete_student(student_id):
    try:
        _delete("students", "student_id", student_id)
        return jsonify({"message": "Student deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@students_bp.route("/all", methods=["GET"])
@login_required
def get_all_students():
    try:
        result = _all("students")
        return jsonify({"students": result.data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500