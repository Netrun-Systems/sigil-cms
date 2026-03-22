/**
 * @netrun/job-search — AI Service
 *
 * Wraps Google Gemini for all AI-powered job search features:
 * - JD analysis and role fit assessment
 * - Cover letter and outreach generation
 * - Interview preparation briefings
 * - Follow-up email generation
 * - Job discovery via Gemini + Google Search grounding
 * - Company research intelligence
 * - Priority assessment
 *
 * Uses GOOGLE_API_KEY env var. Models:
 * - gemini-2.5-flash for fast operations (analysis, discovery, follow-ups)
 * - gemini-2.5-pro for high-quality generation (cover letters, outreach)
 */

import type { JobSearchProfile, JobSearchTrackerEntry } from './schema.js';

// ============================================================================
// Types
// ============================================================================

export interface JdAnalysis {
  title: string;
  company: string;
  requirements: string[];
  niceToHaves: string[];
  keywords: string[];
  matchStrengths: string[];
  matchGaps: string[];
  overallFitScore: number; // 0-100
  summary: string;
}

export interface CompanyResearch {
  name: string;
  domain: string;
  industry: string;
  size: string;
  funding: string;
  recentNews: string[];
  techStack: string[];
  culture: string;
  glassdoorRating: string;
  competitors: string[];
  talkingPoints: string[];
}

export interface CoverLetterResult {
  coverLetter: string;
  keyThemes: string[];
}

export interface OutreachResult {
  subject: string;
  body: string;
  keyHooks: string[];
}

export interface InterviewPrepResult {
  companyBrief: string;
  likelyQuestions: Array<{ question: string; suggestedAnswer: string; category: string }>;
  talkingPoints: string[];
  questionsToAsk: string[];
  redFlags: string[];
}

export interface FollowupResult {
  subject: string;
  body: string;
}

export interface DiscoveredJob {
  company: string;
  role: string;
  url: string;
  compensation: string;
  location: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  matchReason: string;
}

export interface PriorityAssessment {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  reasons: string[];
  score: number;
}

// ============================================================================
// Gemini Client (lazy-loaded)
// ============================================================================

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

const FLASH_MODEL = 'gemini-2.5-flash-preview-05-20';
const PRO_MODEL = 'gemini-2.5-pro-preview-05-06';

function getApiKey(): string {
  const key = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GOOGLE_API_KEY or GEMINI_API_KEY environment variable is required');
  }
  return key;
}

async function callGemini(
  prompt: string,
  model: string = FLASH_MODEL,
  systemInstruction?: string,
): Promise<string> {
  const apiKey = getApiKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    },
  };

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errBody}`);
  }

  const data = (await res.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Empty response from Gemini API');
  }
  return text;
}

function parseJsonResponse<T>(text: string): T {
  // Strip markdown code fences if present
  const cleaned = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
  return JSON.parse(cleaned) as T;
}

function formatProfile(profile: JobSearchProfile): string {
  return [
    `Name: ${profile.fullName}`,
    `Current Title: ${profile.currentTitle || 'Not specified'}`,
    `Current Company: ${profile.currentCompany || 'Not specified'}`,
    `Years Experience: ${profile.yearsExperience || 'Not specified'}`,
    `Location: ${profile.location || 'Not specified'}`,
    `Target Roles: ${JSON.stringify(profile.targetRoles)}`,
    `Target Compensation: ${profile.targetComp || 'Not specified'}`,
    `Skills: ${JSON.stringify(profile.skills)}`,
    `LinkedIn: ${profile.linkedin || 'Not specified'}`,
    `GitHub: ${profile.github || 'Not specified'}`,
    `Website: ${profile.website || 'Not specified'}`,
    `About: ${profile.about || 'Not specified'}`,
  ].join('\n');
}

// ============================================================================
// AI Methods
// ============================================================================

/**
 * Analyze a job description against the candidate profile.
 */
export async function analyzeJobDescription(
  jdText: string,
  profile: JobSearchProfile,
): Promise<JdAnalysis> {
  const prompt = `Analyze this job description against the candidate profile. Return JSON matching this schema:
{
  "title": "string - job title from JD",
  "company": "string - company name from JD",
  "requirements": ["string array - key requirements"],
  "niceToHaves": ["string array - nice-to-have qualifications"],
  "keywords": ["string array - important ATS keywords"],
  "matchStrengths": ["string array - where candidate is strong match"],
  "matchGaps": ["string array - where candidate has gaps"],
  "overallFitScore": "number 0-100",
  "summary": "string - 2-3 sentence assessment"
}

CANDIDATE PROFILE:
${formatProfile(profile)}

JOB DESCRIPTION:
${jdText}`;

  const text = await callGemini(prompt, FLASH_MODEL,
    'You are a senior technical recruiter analyzing job fit. Be honest about gaps.');
  return parseJsonResponse<JdAnalysis>(text);
}

/**
 * Generate a tailored cover letter.
 */
export async function generateCoverLetter(
  company: string,
  role: string,
  jdAnalysis: JdAnalysis | Record<string, unknown>,
  profile: JobSearchProfile,
): Promise<CoverLetterResult> {
  const prompt = `Write a compelling, professional cover letter for this application. Return JSON:
{
  "coverLetter": "string - the full cover letter text",
  "keyThemes": ["string array - 3-5 key themes emphasized"]
}

The cover letter should:
- Open with a compelling hook (not "I am writing to apply")
- Highlight specific achievements that match the role
- Show genuine knowledge of the company
- Be concise (3-4 paragraphs)
- Close with a clear call to action

CANDIDATE PROFILE:
${formatProfile(profile)}

TARGET: ${role} at ${company}

JD ANALYSIS:
${JSON.stringify(jdAnalysis, null, 2)}`;

  const text = await callGemini(prompt, PRO_MODEL,
    'You are an expert career coach who writes compelling cover letters. Never be generic.');
  return parseJsonResponse<CoverLetterResult>(text);
}

/**
 * Generate personalized outreach email.
 */
export async function generateOutreach(
  company: string,
  role: string,
  contact: { name?: string; title?: string; email?: string } | null,
  jdAnalysis: JdAnalysis | Record<string, unknown>,
  profile: JobSearchProfile,
): Promise<OutreachResult> {
  const contactInfo = contact
    ? `Contact: ${contact.name || 'Unknown'}, ${contact.title || 'Unknown title'}`
    : 'No specific contact identified (address to hiring team)';

  const prompt = `Write a concise, personalized outreach email for this job opportunity. Return JSON:
{
  "subject": "string - email subject line (compelling, under 60 chars)",
  "body": "string - email body",
  "keyHooks": ["string array - 2-3 key hooks used"]
}

The email should:
- Be under 150 words
- Reference something specific about the company/role
- Include a concrete value proposition
- Have a soft call to action

CANDIDATE PROFILE:
${formatProfile(profile)}

TARGET: ${role} at ${company}
${contactInfo}

JD ANALYSIS:
${JSON.stringify(jdAnalysis, null, 2)}`;

  const text = await callGemini(prompt, PRO_MODEL,
    'You write concise, high-converting outreach emails. No fluff, no buzzwords.');
  return parseJsonResponse<OutreachResult>(text);
}

/**
 * Generate interview preparation briefing.
 */
export async function generateInterviewPrep(
  company: string,
  role: string,
  jdAnalysis: JdAnalysis | Record<string, unknown>,
  profile: JobSearchProfile,
  interviewType: string = 'general',
): Promise<InterviewPrepResult> {
  const prompt = `Create a comprehensive interview preparation briefing. Return JSON:
{
  "companyBrief": "string - 3-4 sentence company overview and recent context",
  "likelyQuestions": [
    { "question": "string", "suggestedAnswer": "string - STAR format where applicable", "category": "string - behavioral/technical/culture/situational" }
  ],
  "talkingPoints": ["string array - key achievements to weave into answers"],
  "questionsToAsk": ["string array - smart questions to ask the interviewer"],
  "redFlags": ["string array - potential concerns to address proactively"]
}

Generate 8-12 likely questions tailored to the ${interviewType} interview format.

CANDIDATE PROFILE:
${formatProfile(profile)}

TARGET: ${role} at ${company}

JD ANALYSIS:
${JSON.stringify(jdAnalysis, null, 2)}`;

  const text = await callGemini(prompt, PRO_MODEL,
    'You are a senior interview coach preparing a candidate for a specific interview.');
  return parseJsonResponse<InterviewPrepResult>(text);
}

/**
 * Generate follow-up email (day 7 or day 14 pattern).
 */
export async function generateFollowup(
  company: string,
  role: string,
  contact: { name?: string; title?: string } | null,
  followupNumber: number,
  profile: JobSearchProfile,
): Promise<FollowupResult> {
  const timing = followupNumber === 1 ? 'one week' : `${followupNumber} weeks`;
  const contactName = contact?.name || 'Hiring Team';

  const prompt = `Write a follow-up email for a job application sent ${timing} ago. Return JSON:
{
  "subject": "string - subject line",
  "body": "string - email body"
}

This is follow-up #${followupNumber}. The email should:
${followupNumber === 1
    ? '- Reiterate interest, add a new insight or value point\n- Be warm but professional\n- Under 100 words'
    : '- Be brief and respectful of their time\n- Offer to provide additional information\n- Under 75 words\n- Provide a graceful exit if not interested'}

CANDIDATE: ${profile.fullName}
TARGET: ${role} at ${company}
CONTACT: ${contactName}`;

  const text = await callGemini(prompt, FLASH_MODEL,
    'You write concise, professional follow-up emails.');
  return parseJsonResponse<FollowupResult>(text);
}

/**
 * Discover jobs via Gemini with Google Search grounding.
 */
export async function discoverJobs(
  searchTerms: string[],
  profile: JobSearchProfile,
): Promise<DiscoveredJob[]> {
  const prompt = `Based on these search terms and candidate profile, find relevant job openings.
Return a JSON array of discovered jobs:
[{
  "company": "string",
  "role": "string",
  "url": "string - URL to job posting if known, empty string otherwise",
  "compensation": "string - estimated range if known",
  "location": "string",
  "priority": "HIGH | MEDIUM | LOW",
  "matchReason": "string - why this is a good match"
}]

Return 5-10 results, prioritized by fit.

SEARCH TERMS: ${searchTerms.join(', ')}

CANDIDATE PROFILE:
${formatProfile(profile)}`;

  const text = await callGemini(prompt, FLASH_MODEL,
    'You are a job search assistant. Only suggest roles that genuinely match the profile.');
  return parseJsonResponse<DiscoveredJob[]>(text);
}

/**
 * Assess priority of a target company/role.
 */
export async function assessPriority(
  company: string,
  role: string,
  profile: JobSearchProfile,
): Promise<PriorityAssessment> {
  const prompt = `Assess the priority of this job opportunity for the candidate. Return JSON:
{
  "priority": "HIGH | MEDIUM | LOW",
  "reasons": ["string array - 2-4 reasons for this priority level"],
  "score": "number 0-100"
}

HIGH = strong match + good company + right compensation range
MEDIUM = partial match or unknown factors
LOW = weak match or significant concerns

CANDIDATE PROFILE:
${formatProfile(profile)}

TARGET: ${role} at ${company}`;

  const text = await callGemini(prompt, FLASH_MODEL,
    'You are a career advisor assessing opportunity fit.');
  return parseJsonResponse<PriorityAssessment>(text);
}

/**
 * Research a company for interview prep and outreach.
 */
export async function researchCompany(
  company: string,
  domain?: string,
): Promise<CompanyResearch> {
  const prompt = `Research this company and return a comprehensive intelligence brief. Return JSON:
{
  "name": "string",
  "domain": "string - primary domain/website",
  "industry": "string",
  "size": "string - employee count range",
  "funding": "string - funding stage/amount if known",
  "recentNews": ["string array - 3-5 recent news items"],
  "techStack": ["string array - known technologies"],
  "culture": "string - 2-3 sentence culture summary",
  "glassdoorRating": "string - rating if known",
  "competitors": ["string array - 3-5 competitors"],
  "talkingPoints": ["string array - 3-5 points to reference in outreach/interviews"]
}

COMPANY: ${company}
${domain ? `DOMAIN: ${domain}` : ''}`;

  const text = await callGemini(prompt, FLASH_MODEL,
    'You are a business analyst. Report only what you know with confidence. Say "unknown" for uncertain fields.');
  return parseJsonResponse<CompanyResearch>(text);
}
