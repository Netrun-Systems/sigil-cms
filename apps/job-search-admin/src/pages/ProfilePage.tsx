import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import Header from '../components/common/Header';
import Panel from '../components/common/Panel';
import Button from '../components/common/Button';
import { getProfile, updateProfile } from '../services/api';

interface ProfileData {
  fullName: string; email: string; phone: string;
  linkedin: string; github: string; website: string;
  currentTitle: string; currentCompany: string;
  yearsExperience: number | '';
  targetRoles: string; targetComp: string;
  location: string; remotePreference: string;
  skills: string; about: string;
}

const emptyProfile: ProfileData = {
  fullName: '', email: '', phone: '',
  linkedin: '', github: '', website: '',
  currentTitle: '', currentCompany: '',
  yearsExperience: '',
  targetRoles: '', targetComp: '',
  location: '', remotePreference: 'hybrid',
  skills: '', about: '',
};

export default function ProfilePage() {
  const [form, setForm] = useState<ProfileData>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await getProfile();
        const p = res.data;
        if (p) {
          setForm({
            fullName: p.fullName || '', email: p.email || '', phone: p.phone || '',
            linkedin: p.linkedin || '', github: p.github || '', website: p.website || '',
            currentTitle: p.currentTitle || '', currentCompany: p.currentCompany || '',
            yearsExperience: p.yearsExperience || '',
            targetRoles: Array.isArray(p.targetRoles) ? p.targetRoles.join(', ') : '',
            targetComp: p.targetComp || '',
            location: p.location || '', remotePreference: p.remotePreference || 'hybrid',
            skills: Array.isArray(p.skills) ? p.skills.join(', ') : '',
            about: p.about || '',
          });
        }
      } catch (err) { console.error('Failed to load profile:', err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await updateProfile({
        ...form,
        yearsExperience: form.yearsExperience === '' ? null : Number(form.yearsExperience),
        targetRoles: form.targetRoles.split(',').map(s => s.trim()).filter(Boolean),
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) { console.error('Failed to save profile:', err); }
    finally { setSaving(false); }
  }

  function field(label: string, key: keyof ProfileData, type: string = 'text', placeholder?: string) {
    return (
      <div>
        <label className="block text-xs uppercase tracking-wider mb-1"
          style={{ color: 'var(--text-muted)' }}>{label}</label>
        <input type={type} placeholder={placeholder || label}
          value={form[key] as string}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          className="w-full rounded-lg px-3 py-2 text-sm"
          style={{ background: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }} />
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <Header title="Profile" subtitle="Loading..." />
        <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <Header
        title="Candidate Profile"
        subtitle="Your profile powers all AI-generated materials"
        action={
          <Button loading={saving} onClick={handleSave}>
            <Save size={14} /> {saved ? 'Saved!' : 'Save Profile'}
          </Button>
        }
      />

      <div className="p-4 md:p-8 space-y-6">
        <Panel title="Personal Information">
          <div className="grid md:grid-cols-2 gap-4">
            {field('Full Name', 'fullName')}
            {field('Email', 'email', 'email')}
            {field('Phone', 'phone', 'tel')}
            {field('LinkedIn URL', 'linkedin', 'url', 'https://linkedin.com/in/...')}
            {field('GitHub URL', 'github', 'url', 'https://github.com/...')}
            {field('Website', 'website', 'url', 'https://...')}
          </div>
        </Panel>

        <Panel title="Current Position">
          <div className="grid md:grid-cols-3 gap-4">
            {field('Current Title', 'currentTitle')}
            {field('Current Company', 'currentCompany')}
            {field('Years Experience', 'yearsExperience', 'number')}
          </div>
        </Panel>

        <Panel title="Target Search">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1"
                style={{ color: 'var(--text-muted)' }}>Target Roles (comma-separated)</label>
              <input placeholder="CTO, VP Engineering, Staff Engineer"
                value={form.targetRoles}
                onChange={(e) => setForm({ ...form, targetRoles: e.target.value })}
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }} />
            </div>
            {field('Target Compensation', 'targetComp', 'text', '$200k-$300k')}
            {field('Location', 'location')}
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1"
                style={{ color: 'var(--text-muted)' }}>Remote Preference</label>
              <select value={form.remotePreference}
                onChange={(e) => setForm({ ...form, remotePreference: e.target.value })}
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-site</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>
          </div>
        </Panel>

        <Panel title="Skills & About">
          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1"
                style={{ color: 'var(--text-muted)' }}>Skills (comma-separated)</label>
              <input placeholder="TypeScript, Python, Cloud Architecture, DevSecOps, ..."
                value={form.skills}
                onChange={(e) => setForm({ ...form, skills: e.target.value })}
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1"
                style={{ color: 'var(--text-muted)' }}>About / Summary</label>
              <textarea rows={4} placeholder="Brief professional summary for AI context..."
                value={form.about}
                onChange={(e) => setForm({ ...form, about: e.target.value })}
                className="w-full rounded-lg px-3 py-2 text-sm resize-none"
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }} />
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
