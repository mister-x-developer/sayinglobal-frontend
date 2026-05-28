'use client';

/**
 * Admin Plans Management — full CRUD + Promo Codes.
 * No unlimited plans. Every plan has monthly + active limits.
 */

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Edit, Archive, Loader2, CheckCircle2, XCircle,
  Tag, Ticket, RefreshCw, Trash2, Users,
} from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { toast } from '@/components/ui/Toast';
import { plansApi, type Plan } from '@/lib/api/plans';
import apiClient from '@/lib/api/client';
import { formatPrice, formatDate } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

interface PromoCode {
  id: string;
  code: string;
  plan: string;
  plan_name: string;
  max_uses: number;
  uses_count: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  is_valid: boolean;
  created_at: string;
}

type Tab = 'plans' | 'promo' | 'referrals';

export default function AdminPlansPage() {
  const [tab, setTab] = useState<Tab>('plans');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<Plan>>({});
  const [saving, setSaving] = useState(false);

  // Promo codes
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [promosLoading, setPromosLoading] = useState(false);
  const [creatingPromo, setCreatingPromo] = useState(false);
  const [promoForm, setPromoForm] = useState<{
    code: string; plan: string; max_uses: number; valid_until: string;
  }>({ code: '', plan: '', max_uses: 100, valid_until: '' });
  const [savingPromo, setSavingPromo] = useState(false);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      const data = await plansApi.adminList();
      setPlans(data);
    } catch {
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPromos = useCallback(async () => {
    setPromosLoading(true);
    try {
      const res = await apiClient.get('/plans/admin/promo/');
      const data = res.data;
      setPromos(Array.isArray(data) ? data : data?.results ?? []);
    } catch {
      setPromos([]);
    } finally {
      setPromosLoading(false);
    }
  }, []);

  useEffect(() => { loadPlans(); }, [loadPlans]);
  useEffect(() => {
    if (tab === 'promo') loadPromos();
  }, [tab, loadPromos]);

  const openCreate = () => {
    setForm({
      name: '', name_uz: '', name_uz_cyrl: '', name_ru: '', name_en: '',
      description_uz: '', description_ru: '', description_en: '',
      monthly_listing_limit: 5, active_listing_limit: 3,
      price_uzs: 0, price_usd: 0, duration_days: 30,
      referrals_required: 0,
      order: plans.length + 1, is_default: false, status: 'active',
    });
    setCreating(true);
    setEditing(null);
  };

  const openEdit = (plan: Plan) => {
    setForm({ ...plan });
    setEditing(plan);
    setCreating(false);
  };

  const save = async () => {
    if (!form.name && !form.name_uz) {
      toast.error('Name is required');
      return;
    }
    if ((form.monthly_listing_limit ?? 0) < 1 || (form.active_listing_limit ?? 0) < 1) {
      toast.error('No unlimited plans — limits must be ≥ 1');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await plansApi.adminUpdate(editing.id, form);
        toast.success('Plan updated');
      } else {
        await plansApi.adminCreate(form);
        toast.success('Plan created');
      }
      setEditing(null);
      setCreating(false);
      await loadPlans();
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const archive = async (plan: Plan) => {
    if (!confirm(`Archive plan "${plan.name}"?`)) return;
    try {
      await plansApi.adminArchive(plan.id);
      toast.success('Plan archived');
      await loadPlans();
    } catch {
      toast.error('Archive failed');
    }
  };

  const savePromo = async () => {
    if (!promoForm.code.trim() || !promoForm.plan) {
      toast.error('Code and plan are required');
      return;
    }
    setSavingPromo(true);
    try {
      await apiClient.post('/plans/admin/promo/', {
        code: promoForm.code.trim().toUpperCase(),
        plan: promoForm.plan,
        max_uses: promoForm.max_uses,
        valid_until: promoForm.valid_until || null,
      });
      toast.success('Promo code created');
      setCreatingPromo(false);
      setPromoForm({ code: '', plan: '', max_uses: 100, valid_until: '' });
      await loadPromos();
    } catch {
      toast.error('Failed to create promo code');
    } finally {
      setSavingPromo(false);
    }
  };

  const deactivatePromo = async (id: string) => {
    if (!confirm('Deactivate this promo code?')) return;
    try {
      await apiClient.patch(`/plans/admin/promo/${id}/`, { is_active: false });
      toast.success('Promo code deactivated');
      await loadPromos();
    } catch {
      toast.error('Failed to deactivate');
    }
  };

  return (
    <AdminLayout>
      <div className="container-page py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-eyebrow">Admin</p>
            <h1 className="display-md mt-1">Tariflar boshqaruvi</h1>
            <p className="mt-1 text-sm text-fg-muted">
              Har bir tarif oylik va faol e'lon limitiga ega. Limitsiz tariflar yo'q.
            </p>
          </div>
          {tab === 'plans' && (
            <button onClick={openCreate} className="btn btn-primary btn-sm">
              <Plus className="h-4 w-4" strokeWidth={2.25} />
              Yangi tarif
            </button>
          )}
          {tab === 'promo' && (
            <button onClick={() => setCreatingPromo(true)} className="btn btn-primary btn-sm">
              <Plus className="h-4 w-4" strokeWidth={2.25} />
              Yangi promo kod
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-border">
          {(['plans', 'promo', 'referrals'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition',
                tab === t
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-fg-muted hover:text-fg',
              )}
            >
              {t === 'plans' ? <Tag className="h-4 w-4" strokeWidth={1.75} /> : t === 'promo' ? <Ticket className="h-4 w-4" strokeWidth={1.75} /> : <Users className="h-4 w-4" strokeWidth={1.75} />}
              {t === 'plans' ? 'Tariflar' : t === 'promo' ? 'Promo kodlar' : 'Referrallar'}
            </button>
          ))}
        </div>

        {/* Plans tab */}
        {tab === 'plans' && (
          <>
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {plans.map((plan, i) => (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="surface-elevated p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-lg font-bold text-fg">{plan.name}</h3>
                          {plan.is_default && (
                            <span className="rounded-full bg-brand-primary/10 px-2 py-0.5 text-[10px] font-bold text-brand-primary uppercase">
                              Default
                            </span>
                          )}
                          {plan.status === 'archived' && (
                            <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-bold text-danger uppercase">
                              Archived
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-fg-muted">{plan.description_uz || plan.description}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-bg-subtle p-3 text-center">
                        <p className="font-display text-2xl font-bold text-brand-primary">
                          {plan.monthly_listing_limit}
                        </p>
                        <p className="text-[11px] text-fg-subtle">Oylik limit</p>
                      </div>
                      <div className="rounded-xl bg-bg-subtle p-3 text-center">
                        <p className="font-display text-2xl font-bold text-info">
                          {plan.active_listing_limit}
                        </p>
                        <p className="text-[11px] text-fg-subtle">Faol limit</p>
                      </div>
                    </div>

                    {plan.referrals_required > 0 && (
                      <div className="mt-3 rounded-xl bg-bg-subtle p-3 text-center">
                        <p className="font-display text-xl font-bold text-warning">
                          {plan.referrals_required}
                        </p>
                        <p className="text-[11px] text-fg-subtle">Referral kerak</p>
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="font-bold text-fg">
                        {plan.price_uzs > 0 ? formatPrice(plan.price_uzs, 'UZS') : 'Bepul'}
                      </span>
                      <span className="text-fg-subtle">{plan.duration_days} kun</span>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => openEdit(plan)}
                        className="btn btn-secondary btn-sm flex-1"
                      >
                        <Edit className="h-3.5 w-3.5" strokeWidth={1.75} />
                        Tahrirlash
                      </button>
                      {plan.status === 'active' && (
                        <button
                          onClick={() => archive(plan)}
                          className="btn btn-secondary btn-sm"
                          aria-label="Archive plan"
                        >
                          <Archive className="h-3.5 w-3.5" strokeWidth={1.75} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Promo codes tab */}
        {tab === 'promo' && (
          <div className="surface-elevated overflow-hidden">
            {promosLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
              </div>
            ) : promos.length === 0 ? (
              <div className="py-16 text-center text-fg-muted">
                <Ticket className="mx-auto h-8 w-8 opacity-30" strokeWidth={1.5} />
                <p className="mt-3 text-sm">Promo kodlar yo'q</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-bg-subtle">
                      {['Kod', 'Tarif', 'Foydalanish', 'Amal qilish muddati', 'Holat', ''].map((h, i) => (
                        <th
                          key={i}
                          className={cn(
                            'px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-fg-subtle',
                            i === 5 && 'text-right',
                          )}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {promos.map((p, i) => (
                      <motion.tr
                        key={p.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="group hover:bg-bg-subtle"
                      >
                        <td className="px-5 py-4">
                          <code className="rounded bg-bg-subtle px-2 py-1 text-sm font-mono font-bold text-fg">
                            {p.code}
                          </code>
                        </td>
                        <td className="px-5 py-4 text-sm text-fg">{p.plan_name}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-24 rounded-full bg-bg-subtle overflow-hidden">
                              <div
                                className="h-full rounded-full bg-brand-primary"
                                style={{ width: `${Math.min((p.uses_count / p.max_uses) * 100, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-fg-muted">{p.uses_count}/{p.max_uses}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-fg-muted">
                          {p.valid_until ? formatDate(p.valid_until, 'short') : '—'}
                        </td>
                        <td className="px-5 py-4">
                          <span className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
                            p.is_valid
                              ? 'bg-success/10 text-success'
                              : 'bg-danger/10 text-danger',
                          )}>
                            {p.is_valid ? 'Faol' : 'Nofaol'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {p.is_active && (
                            <button
                              type="button"
                              onClick={() => deactivatePromo(p.id)}
                              className="btn btn-sm bg-danger/12 text-danger hover:bg-danger/20 opacity-0 group-hover:opacity-100"
                              aria-label="Deactivate promo code"
                            >
                              <XCircle className="h-3.5 w-3.5" strokeWidth={2} />
                            </button>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Referrals tab */}
        {tab === 'referrals' && <AdminReferralsList />}
      </div>

      {/* Create/Edit plan form */}
      {(creating || editing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="surface-elevated w-full max-w-2xl p-6 my-4">
            <h2 className="display-sm mb-4">
              {editing ? 'Tarifni tahrirlash' : 'Yangi tarif'}
            </h2>
            <div className="space-y-4">
              {/* Names */}
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-fg-subtle">Nomi (4 tilda)</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-fg-subtle">UZ (lotin)</label>
                    <input
                      value={form.name_uz || ''}
                      onChange={(e) => setForm((p) => ({ ...p, name_uz: e.target.value, name: e.target.value }))}
                      className="input-base mt-1 w-full"
                      placeholder="Boshlang'ich"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-fg-subtle">UZ (kirill)</label>
                    <input
                      value={form.name_uz_cyrl || ''}
                      onChange={(e) => setForm((p) => ({ ...p, name_uz_cyrl: e.target.value }))}
                      className="input-base mt-1 w-full"
                      placeholder="Бошланғич"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-fg-subtle">RU</label>
                    <input
                      value={form.name_ru || ''}
                      onChange={(e) => setForm((p) => ({ ...p, name_ru: e.target.value }))}
                      className="input-base mt-1 w-full"
                      placeholder="Начальный"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-fg-subtle">EN</label>
                    <input
                      value={form.name_en || ''}
                      onChange={(e) => setForm((p) => ({ ...p, name_en: e.target.value }))}
                      className="input-base mt-1 w-full"
                      placeholder="Starter"
                    />
                  </div>
                </div>
              </div>

              {/* Descriptions */}
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-fg-subtle">Tavsif (ixtiyoriy)</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-fg-subtle">UZ</label>
                    <textarea
                      value={form.description_uz || ''}
                      onChange={(e) => setForm((p) => ({ ...p, description_uz: e.target.value, description: e.target.value }))}
                      className="input-base mt-1 w-full h-16 py-2 resize-none"
                      placeholder="Tavsif..."
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-fg-subtle">RU</label>
                    <textarea
                      value={form.description_ru || ''}
                      onChange={(e) => setForm((p) => ({ ...p, description_ru: e.target.value }))}
                      className="input-base mt-1 w-full h-16 py-2 resize-none"
                      placeholder="Описание..."
                    />
                  </div>
                </div>
              </div>

              {/* Limits */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-fg-subtle">
                    Oylik limit <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.monthly_listing_limit || ''}
                    onChange={(e) => setForm((p) => ({ ...p, monthly_listing_limit: Number(e.target.value) }))}
                    className="input-base mt-1 w-full"
                  />
                  <p className="mt-1 text-[11px] text-fg-subtle">Min: 1 (limitsiz tariflar yo'q)</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-fg-subtle">
                    Faol limit <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.active_listing_limit || ''}
                    onChange={(e) => setForm((p) => ({ ...p, active_listing_limit: Number(e.target.value) }))}
                    className="input-base mt-1 w-full"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-semibold text-fg-subtle">Narx (UZS)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.price_uzs || 0}
                    onChange={(e) => setForm((p) => ({ ...p, price_uzs: Number(e.target.value) }))}
                    className="input-base mt-1 w-full"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-fg-subtle">Narx (USD)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.price_usd || 0}
                    onChange={(e) => setForm((p) => ({ ...p, price_usd: Number(e.target.value) }))}
                    className="input-base mt-1 w-full"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-fg-subtle">Davomiyligi (kun)</label>
                  <input
                    type="number"
                    min={1}
                    value={form.duration_days || 30}
                    onChange={(e) => setForm((p) => ({ ...p, duration_days: Number(e.target.value) }))}
                    className="input-base mt-1 w-full"
                  />
                </div>
              </div>

              {/* Referrals required */}
              <div>
                <label className="text-xs font-semibold text-fg-subtle">
                  Referral soni (bepul olish uchun, 0 = referral shart emas)
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.referrals_required ?? 0}
                  onChange={(e) => setForm((p) => ({ ...p, referrals_required: Number(e.target.value) }))}
                  className="input-base mt-1 w-full"
                />
              </div>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!form.is_default}
                  onChange={(e) => setForm((p) => ({ ...p, is_default: e.target.checked }))}
                  className="h-4 w-4 rounded border-border text-brand-primary"
                />
                Yangi foydalanuvchilar uchun standart tarif
              </label>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => { setEditing(null); setCreating(false); }}
                className="btn btn-secondary flex-1"
                disabled={saving}
              >
                Bekor qilish
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="btn btn-primary flex-1"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create promo code modal */}
      {creatingPromo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="surface-elevated w-full max-w-md p-6">
            <h2 className="display-sm mb-4">Yangi promo kod</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-fg-subtle">Kod <span className="text-danger">*</span></label>
                <input
                  value={promoForm.code}
                  onChange={(e) => setPromoForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                  className="input-base mt-1 w-full font-mono"
                  placeholder="SUMMER2024"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-fg-subtle">Tarif <span className="text-danger">*</span></label>
                <select
                  value={promoForm.plan}
                  onChange={(e) => setPromoForm((p) => ({ ...p, plan: e.target.value }))}
                  className="input-base mt-1 w-full cursor-pointer"
                >
                  <option value="">Tarif tanlang</option>
                  {plans.filter((p) => p.status === 'active').map((p) => (
                    <option key={p.id} value={p.id}>{p.name_uz || p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-fg-subtle">Maksimal foydalanish</label>
                <input
                  type="number"
                  min={1}
                  value={promoForm.max_uses}
                  onChange={(e) => setPromoForm((p) => ({ ...p, max_uses: Number(e.target.value) }))}
                  className="input-base mt-1 w-full"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-fg-subtle">Amal qilish muddati (ixtiyoriy)</label>
                <input
                  type="date"
                  value={promoForm.valid_until}
                  onChange={(e) => setPromoForm((p) => ({ ...p, valid_until: e.target.value }))}
                  className="input-base mt-1 w-full"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setCreatingPromo(false)}
                className="btn btn-secondary flex-1"
                disabled={savingPromo}
              >
                Bekor qilish
              </button>
              <button
                onClick={savePromo}
                disabled={savingPromo}
                className="btn btn-primary flex-1"
              >
                {savingPromo ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Yaratish
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

// ── Admin Referrals List ──────────────────────────────────────────────────────
function AdminReferralsList() {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/plans/admin/referrals/')
      .then((r) => setReferrals(Array.isArray(r.data) ? r.data : r.data?.results ?? []))
      .catch(() => setReferrals([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (referrals.length === 0) {
    return (
      <div className="surface-elevated py-16 text-center text-fg-muted">
        <Users className="mx-auto h-8 w-8 opacity-30" strokeWidth={1.5} />
        <p className="mt-3 text-sm">Referrallar yo'q</p>
      </div>
    );
  }

  return (
    <div className="surface-elevated overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-bg-subtle">
              {['Referral kodi', 'Taklif qiluvchi', 'Taklif qilingan', 'Holat', 'Sana'].map((h, i) => (
                <th key={i} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-fg-subtle">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {referrals.map((r: any, i: number) => (
              <motion.tr
                key={r.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="hover:bg-bg-subtle"
              >
                <td className="px-5 py-4">
                  <code className="rounded bg-bg-subtle px-2 py-1 text-sm font-mono font-bold text-fg">
                    {r.referral_code?.code ?? '—'}
                  </code>
                </td>
                <td className="px-5 py-4 text-sm text-fg">
                  {r.referral_code?.user?.full_name ?? '—'}
                </td>
                <td className="px-5 py-4 text-sm text-fg">
                  {r.referred_user?.full_name ?? '—'}
                </td>
                <td className="px-5 py-4">
                  <span className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
                    r.status === 'rewarded' ? 'bg-success/10 text-success' :
                    r.status === 'pending' ? 'bg-warning/10 text-warning' :
                    'bg-danger/10 text-danger',
                  )}>
                    {r.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm text-fg-muted">
                  {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
