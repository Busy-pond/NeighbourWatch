# NeighbourWatch 🏙️
**AI-Powered Civic Intelligence Platform**

NeighbourWatch is a citizen-driven civic reporting platform designed to drastically reduce the friction between local government departments and citizens. By taking a simple photo and voice/text description of a civic issue (like a pothole or sewage leak), NeighbourWatch automatically categorizes, scores, clusters, and routes the complaint to the correct Indian government department using advanced AI—all within a single optimized pipeline.

---

## 🚀 Ultra-Optimized AI Pipeline Architecture

To maintain zero-latency responsiveness while staying within strict free-tier API quotas, NeighbourWatch employs a highly specialized architectural pipeline:

### 1. 1-Call Master Agent Batching
Instead of chaining 7 different AI Prompts (Vision -> Transcription -> Severity -> etc.), the system executes **ONE monolithic multimodal prompt**.
- **Input:** GPS Trace, Base64 Image, and User Description.
- **Output:** A massive unified JSON payload returning `issue_type`, `severity`, translations, routing departments, and a drafted RTI letter.
- **Benefit:** Reduces API cost by 700% (From ~10,000 tokens down to ~1,500 tokens).

### 2. PostGIS Cluster & Pattern Engine
Instead of using Generative AI to guess patterns, we moved all heavy geographical lifting to PostgreSQL logic.
- Before saving the AI's response, the API route queries `get_nearby_reports` using the DB's PostGIS spatial capabilities (within a 500m radius).
- By comparing the AI's generated `issue_type` with surrounding reports, the system automatically detects if the issue is `isolated`, `seasonal`, or `recurring`, eliminating 2 entire AI calls!

### 3. Failsafe Key Rotation
To prevent Google's strictly enforced API rate limits (HTTP 429 & HTTP 503 errors):
- The `gemini.ts` orchestrator rotates across **multiple API Keys** (`GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`) configured in `.env.local`.
- The system cascades gracefully across models, starting with `gemini-2.0-flash-lite`, and if a quota block is detected, it sleeps for a few seconds and automatically falls back to `gemini-2.0-flash`.

---

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL with PostGIS extensions)
- **AI Engine**: Google Gemini API (`@google/generative-ai` v0.24)
- **Styling**: Tailwind CSS
- **Mapping**: Leaflet.js with React-Leaflet
- **Icons**: Lucide-React

## ⚙️ Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Multiple keys required for automatic load balancing
GEMINI_API_KEY_1=your_first_google_ai_key
GEMINI_API_KEY_2=your_second_google_ai_key
```

## 📦 Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000)

## 🗄️ Database Setup (Supabase SQL)

To enable the spatial queries required for the pattern engines, run the following inside your Supabase SQL Editor:

```sql
-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE OR REPLACE FUNCTION get_nearby_reports(lat FLOAT, lng FLOAT, radius_meters FLOAT)
RETURNS TABLE (
    id UUID,
    gps_location GEOGRAPHY(POINT, 4326),
    issue_type TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT r.id, r.gps_location, r.issue_type, r.created_at
    FROM reports r
    WHERE ST_DWithin(r.gps_location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography, radius_meters);
END;
$$ LANGUAGE plpgsql;
```
