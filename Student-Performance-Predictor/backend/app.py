import os
import sys
from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_session import Session
from config import Config
from database.db import init_db

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

init_db()

app = Flask(__name__, static_folder="../frontend", static_url_path="")
app.config["SECRET_KEY"] = Config.SECRET_KEY
app.config["SESSION_TYPE"] = "filesystem"
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_USE_SIGNER"] = True
app.config["SESSION_FILE_DIR"] = os.path.join(os.path.dirname(__file__), "..", "flask_session")

os.makedirs(app.config["SESSION_FILE_DIR"], exist_ok=True)

CORS(app, supports_credentials=True)
Session(app)

from routes.auth import auth_bp
from routes.students import students_bp
from routes.prediction import prediction_bp
from routes.analytics import analytics_bp
from routes.reports import reports_bp
from routes.ml import ml_bp
from routes.dataset import dataset_bp

app.register_blueprint(auth_bp)
app.register_blueprint(students_bp)
app.register_blueprint(prediction_bp)
app.register_blueprint(analytics_bp)
app.register_blueprint(reports_bp)
app.register_blueprint(ml_bp)
app.register_blueprint(dataset_bp)

print(f"Database initialized at backend/data/spp.db")


@app.route("/")
def serve_index():
    return send_from_directory(app.static_folder, "index.html")


@app.route("/<path:path>")
def serve_static(path):
    file_path = os.path.join(app.static_folder, path)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, "index.html")


@app.errorhandler(404)
def not_found(e):
    return {"error": "Not found"}, 404


@app.errorhandler(500)
def server_error(e):
    return {"error": "Internal server error"}, 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=Config.DEBUG)