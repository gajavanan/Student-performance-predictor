import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
import os


def train_and_save_model():
    dataset_path = os.path.join(os.path.dirname(__file__), "datasets", "student_dataset.csv")
    
    if not os.path.exists(dataset_path):
        print(f"Dataset not found at {dataset_path}")
        print("Creating sample dataset...")
        from create_sample_data import create_dataset
        create_dataset()

    df = pd.read_csv(dataset_path)
    print(f"Loaded dataset with {len(df)} rows and {len(df.columns)} columns")

    df_encoded = df.copy()
    categorical_cols = ["gender", "department"]
    for col in categorical_cols:
        if col in df.columns:
            df_encoded[col] = df_encoded[col].astype("category").cat.codes

    feature_cols = ["attendance", "study_hours", "assignment_score", 
                    "previous_marks", "semester", "age"]
    
    for col in categorical_cols:
        if col in df_encoded.columns:
            feature_cols.append(col)

    target_col = "internal_marks"

    X = df_encoded[feature_cols]
    y = df_encoded[target_col]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)

    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)

    print(f"\nModel Performance:")
    print(f"  MAE: {mae:.2f}")
    print(f"  RMSE: {rmse:.2f}")
    print(f"  R² Score: {r2:.4f}")

    models_dir = os.path.join(os.path.dirname(__file__), "models")
    os.makedirs(models_dir, exist_ok=True)
    
    model_path = os.path.join(models_dir, "student_model.pkl")
    joblib.dump(model, model_path)
    joblib.dump(feature_cols, os.path.join(models_dir, "feature_columns.pkl"))

    print(f"\nModel saved to: {model_path}")
    print(f"Features used: {feature_cols}")
    print(f"Target: {target_col}")
    print("\nTraining complete! Model ready for predictions.")


if __name__ == "__main__":
    train_and_save_model()