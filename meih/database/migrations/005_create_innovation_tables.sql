CREATE TABLE innovation_competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  opens_at TIMESTAMPTZ,
  closes_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','open','voting','judging','completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE innovation_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  competition_id UUID NOT NULL REFERENCES innovation_competitions(id),
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  problem TEXT,
  solution TEXT,
  impact TEXT,
  technology VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('pending_review','approved','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE innovation_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES innovation_submissions(id),
  voter_fingerprint VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (submission_id, voter_fingerprint)
);

CREATE TABLE judge_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES innovation_submissions(id),
  judge_id UUID NOT NULL REFERENCES users(id),
  innovation_score INT,
  impact_score INT,
  feasibility_score INT,
  scalability_score INT,
  sustainability_score INT,
  technology_score INT,
  business_model_score INT,
  social_impact_score INT,
  market_readiness_score INT,
  presentation_score INT,
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (submission_id, judge_id)
);
