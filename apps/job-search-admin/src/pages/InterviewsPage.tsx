import { useState, useEffect } from 'react';
import { Calendar, BookOpen, Plus } from 'lucide-react';
import Header from '../components/common/Header';
import Panel from '../components/common/Panel';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { getInterviews, generateInterviewPrepById } from '../services/api';

const typeVariant: Record<string, 'info' | 'warning' | 'accent' | 'default'> = {
  phone: 'info', technical: 'warning', behavioral: 'accent',
  system_design: 'warning', culture_fit: 'accent', final: 'default',
};

const outcomeVariant: Record<string, 'success' | 'error' | 'warning' | 'default'> = {
  passed: 'success', failed: 'error', pending: 'warning',
  cancelled: 'default', rescheduled: 'default',
};

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [prepLoading, setPrepLoading] = useState<string | null>(null);
  const [prepResult, setPrepResult] = useState<any>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await getInterviews();
        setInterviews(res.data || []);
      } catch (err) { console.error('Failed to load interviews:', err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  async function handlePrep(interviewId: string) {
    setPrepLoading(interviewId);
    try {
      const res = await generateInterviewPrepById(interviewId);
      setPrepResult((res as any).data);
    } catch (err) { console.error('Prep generation failed:', err); }
    finally { setPrepLoading(null); }
  }

  if (loading) {
    return (
      <div>
        <Header title="Interviews" subtitle="Loading..." />
        <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>Loading...</div>
      </div>
    );
  }

  const now = new Date();
  const upcoming = interviews.filter(i => i.scheduledAt && new Date(i.scheduledAt) >= now);
  const past = interviews.filter(i => !i.scheduledAt || new Date(i.scheduledAt) < now);

  return (
    <div>
      <Header title="Interviews" subtitle={`${upcoming.length} upcoming, ${past.length} completed`} />

      <div className="p-4 md:p-8 space-y-6">
        {/* Prep result */}
        {prepResult && (
          <Panel title="Interview Preparation"
            action={<Button size="sm" variant="ghost" onClick={() => setPrepResult(null)}>Close</Button>}>
            <div className="space-y-4">
              <div>
                <h4 className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                  Company Brief
                </h4>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{prepResult.companyBrief}</p>
              </div>
              <div>
                <h4 className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                  Likely Questions
                </h4>
                <div className="space-y-2">
                  {prepResult.likelyQuestions?.map((q: any, i: number) => (
                    <div key={i} className="rounded-lg p-3" style={{ background: 'var(--bg-input)' }}>
                      <p className="text-sm font-body mb-1" style={{ color: 'var(--text-primary)' }}>
                        {q.question}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{q.suggestedAnswer}</p>
                      <Badge label={q.category} variant="info" />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                  Questions to Ask
                </h4>
                <ul className="list-disc pl-4 space-y-1">
                  {prepResult.questionsToAsk?.map((q: string, i: number) => (
                    <li key={i} className="text-sm" style={{ color: 'var(--text-secondary)' }}>{q}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Panel>
        )}

        {/* Upcoming */}
        <Panel title="Upcoming Interviews">
          {upcoming.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No upcoming interviews scheduled</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map((interview: any) => (
                <div key={interview.id} className="flex items-center justify-between py-3"
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <div>
                    <p className="text-sm font-body" style={{ color: 'var(--text-primary)' }}>
                      {interview.company} - {interview.role}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      <Calendar size={12} className="inline mr-1" />
                      {new Date(interview.scheduledAt).toLocaleString()}
                      {interview.interviewerName && ` with ${interview.interviewerName}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge label={interview.interviewType} variant={typeVariant[interview.interviewType] || 'default'} />
                    <Button size="sm" variant="secondary"
                      loading={prepLoading === interview.id}
                      onClick={() => handlePrep(interview.id)}>
                      <BookOpen size={14} /> Prep
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* Past */}
        {past.length > 0 && (
          <Panel title="Past Interviews">
            <div className="space-y-3">
              {past.map((interview: any) => (
                <div key={interview.id} className="flex items-center justify-between py-3"
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <div>
                    <p className="text-sm font-body" style={{ color: 'var(--text-primary)' }}>
                      {interview.company} - {interview.role}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {interview.scheduledAt ? new Date(interview.scheduledAt).toLocaleDateString() : 'Unscheduled'}
                      {interview.interviewerName && ` with ${interview.interviewerName}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge label={interview.interviewType} variant={typeVariant[interview.interviewType] || 'default'} />
                    {interview.outcome && (
                      <Badge label={interview.outcome} variant={outcomeVariant[interview.outcome] || 'default'} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}
