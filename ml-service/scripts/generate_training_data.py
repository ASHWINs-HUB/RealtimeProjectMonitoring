"""
ProjectPulse AI — Synthetic Training Data Generator
=====================================================
Generates 5000+ realistic samples simulating real-world project risk metrics.
Each sample represents a snapshot of a project/team/developer at a point in time.

Features:
  - commit_frequency: avg daily commits (0–20)
  - pr_review_time_hrs: average PR review time in hours (0.5–120)
  - pr_rejection_ratio: fraction of PRs rejected (0–1)
  - issue_completion_days: avg days to close issues (0.5–60)
  - reopened_issues_ratio: fraction of issues reopened (0–0.6)
  - sprint_delay_pct: percentage of sprint tasks that spilled over (0–1)
  - overdue_task_ratio: fraction of tasks past due date (0–1)
  - blocked_task_ratio: fraction of tasks currently blocked (0–0.5)
  - team_size: number of contributors (1–30)
  - days_remaining_ratio: time-elapsed / total-time (0–1)
  - effort_ratio: actual_hours / estimated_hours (0.3–3.5)
  - inactive_contributors_ratio: fraction of team inactive >7 days (0–1)

Labels:
  - risk_score: continuous 0–100
  - risk_class: categorical low (<40) / medium (40–65) / high (>65)
"""

import numpy as np
import pandas as pd
import os

np.random.seed(42)

N_SAMPLES = 5000

def generate_samples(n: int) -> pd.DataFrame:
    """Generate n synthetic project risk samples."""
    data = {
        # Commit activity — higher is healthier
        "commit_frequency": np.clip(np.random.gamma(3, 1.5, n), 0.1, 20),
        
        # PR review speed — lower is healthier
        "pr_review_time_hrs": np.clip(np.random.lognormal(2.5, 1.0, n), 0.5, 120),
        
        # PR rejection — lower is healthier
        "pr_rejection_ratio": np.clip(np.random.beta(2, 8, n), 0, 1),
        
        # Issue close speed — lower is healthier
        "issue_completion_days": np.clip(np.random.lognormal(1.8, 0.8, n), 0.5, 60),
        
        # Reopened issues — lower is healthier
        "reopened_issues_ratio": np.clip(np.random.beta(1.5, 10, n), 0, 0.6),
        
        # Sprint spillover — lower is healthier
        "sprint_delay_pct": np.clip(np.random.beta(2, 5, n), 0, 1),
        
        # Overdue tasks — lower is healthier
        "overdue_task_ratio": np.clip(np.random.beta(2, 6, n), 0, 1),
        
        # Blocked tasks — lower is healthier
        "blocked_task_ratio": np.clip(np.random.beta(1.5, 8, n), 0, 0.5),
        
        # Team size
        "team_size": np.random.randint(1, 31, n),
        
        # Time elapsed
        "days_remaining_ratio": np.random.uniform(0, 1, n),
        
        # Effort accuracy — closer to 1.0 is healthier; >1 means over-budget
        "effort_ratio": np.clip(np.random.lognormal(0.1, 0.4, n), 0.3, 3.5),
        
        # Inactive contributors — lower is healthier
        "inactive_contributors_ratio": np.clip(np.random.beta(1.5, 6, n), 0, 1),
    }

    df = pd.DataFrame(data)

    # ===== Compute Risk Score ===== #
    # Weighted combination with noise — simulates complex real-world risk
    risk = (
        -4.0 * np.log1p(df["commit_frequency"])               # low commits → high risk
        + 3.5 * (df["pr_review_time_hrs"] / 120)                # slow reviews → risk
        + 8.0 * df["pr_rejection_ratio"]                        # high rejection → risk
        + 3.0 * (df["issue_completion_days"] / 60)              # slow closing → risk
        + 10.0 * df["reopened_issues_ratio"]                     # reopened bugs → risk
        + 12.0 * df["sprint_delay_pct"]                          # sprint spill → risk
        + 14.0 * df["overdue_task_ratio"]                        # overdue → strong risk
        + 10.0 * df["blocked_task_ratio"]                        # blocked → risk
        - 0.5 * np.log1p(df["team_size"])                        # bigger team slightly helps
        + 4.0 * df["days_remaining_ratio"]                       # more time passed → risk
        + 5.0 * np.maximum(0, df["effort_ratio"] - 1.0)         # over budget → risk
        + 6.0 * df["inactive_contributors_ratio"]               # inactive → risk
    )

    # Normalize to 0–100 with sigmoid-like scaling
    risk_min, risk_max = risk.min(), risk.max()
    risk_norm = (risk - risk_min) / (risk_max - risk_min) * 100

    # Add Gaussian noise to simulate real-world unpredictability
    noise = np.random.normal(0, 3, n)
    risk_score = np.clip(risk_norm + noise, 0, 100).round(2)

    df["risk_score"] = risk_score

    # Classify
    df["risk_class"] = pd.cut(
        df["risk_score"],
        bins=[-1, 40, 65, 101],
        labels=["low", "medium", "high"]
    )

    return df


def main():
    print(f"📊 Generating {N_SAMPLES} synthetic training samples...")
    df = generate_samples(N_SAMPLES)

    out_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "training_data.csv")

    df.to_csv(out_path, index=False)
    print(f"✅ Saved to {out_path}")
    print(f"\n📈 Distribution:")
    print(df["risk_class"].value_counts().to_string())
    print(f"\n📊 Risk Score Stats:")
    print(df["risk_score"].describe().to_string())


if __name__ == "__main__":
    main()
