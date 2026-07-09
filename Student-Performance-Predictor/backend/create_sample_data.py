import pandas as pd
import numpy as np
import os


def create_dataset():
    np.random.seed(42)
    n = 200

    data = {
        "student_id": [f"S{str(i+1).zfill(3)}" for i in range(n)],
        "name": [f"Student_{i+1}" for i in range(n)],
        "department": np.random.choice(
            ["Computer Science", "Information Technology", "Electronics", 
             "Mechanical", "Civil", "Electrical Engineering"], n
        ),
        "semester": np.random.randint(1, 9, n),
        "age": np.random.randint(17, 26, n),
        "gender": np.random.choice(["Male", "Female", "Other"], n, p=[0.5, 0.45, 0.05]),
    }

    base_attendance = np.random.normal(80, 12, n)
    data["attendance"] = np.clip(np.round(base_attendance, 1), 30, 100)

    base_study = np.random.normal(4.0, 1.5, n)
    data["study_hours"] = np.clip(np.round(base_study, 1), 0.5, 10)

    assignment_base = 40 + 0.4 * base_attendance + 5 * base_study + np.random.normal(0, 8, n)
    data["assignment_score"] = np.clip(np.round(assignment_base, 1), 10, 100)

    internal_base = 30 + 0.3 * base_attendance + 4 * base_study + 0.2 * assignment_base + np.random.normal(0, 6, n)
    data["internal_marks"] = np.clip(np.round(internal_base, 1), 10, 100)

    previous_base = 35 + 0.25 * base_attendance + 3 * base_study + 0.15 * assignment_base + np.random.normal(0, 5, n)
    data["previous_marks"] = np.clip(np.round(previous_base, 1), 10, 100)

    df = pd.DataFrame(data)

    output_path = os.path.join(os.path.dirname(__file__), "datasets", "student_dataset.csv")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"Sample dataset created with {n} records at: {output_path}")
    return df


if __name__ == "__main__":
    df = create_dataset()
    print(f"\nColumns: {list(df.columns)}")
    print(f"\nSample data:\n{df.head()}")
    print(f"\nStats:\n{df.describe()}")