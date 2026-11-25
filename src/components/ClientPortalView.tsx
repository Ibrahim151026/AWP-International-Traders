import { CheckCircle2, ExternalLink, Package } from 'lucide-react';
import { useState } from 'react';
import type { TranslationBundle } from '../i18n/translations';
import { LANGUAGE_LABELS } from '../i18n/translations';
import type { ClientAccount, ContactInquiry, ExportOrder, Incoterm, LanguageCode } from '../types';
import { INCOTERMS_OPTIONS } from '../utils/exportReports';

interface ClientPortalViewProps {
  t: TranslationBundle;
  userEmail: string;
  profile: ClientAccount;
  orders: ExportOrder[];
  inquiries: ContactInquiry[];
  isAdmin: boolean;
  onSaveProfile: (updated: Partial<ClientAccount>) => Promise<void>;
  onCancelOrder: (orderId: string) => Promise<void>;
  onTrackShipment: (trackingNumber: string) => void;
  onBrowseCatalog: () => void;
  onSwitchToAdmin?: () => void;
}

export function ClientPortalView({
  t,
  userEmail,
  profile,
  orders,
  inquiries,
  isAdmin,
  onSaveProfile,
  onCancelOrder,
  onTrackShipment,
  onBrowseCatalog,
  onSwitchToAdmin,
}: ClientPortalViewProps) {
  const [tab, setTab] = useState<'orders' | 'profile' | 'inquiries'>('orders');
  const [companyName, setCompanyName] = useState(profile.companyName);
  const [contactName, setContactName] = useState(profile.contactName);
  const [phone, setPhone] = useState(profile.phone);
  const [country, setCountry] = useState(profile.country);
  const [destinationPort, setDestinationPort] = useState(profile.destinationPort);
  const [taxId, setTaxId] = useState(profile.taxId);
  const [preferredIncoterms, setPreferredIncoterms] = useState<Incoterm>(profile.preferredIncoterms);
  const [preferredLanguage, setPreferredLanguage] = useState<LanguageCode>(profile.preferredLanguage);
  const [saving, setSaving] = useState(false);
  const [savedBanner, setSavedBanner] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedBanner(false);
    try {
      await onSaveProfile({
        companyName: companyName.trim(),
        contactName: contactName.trim(),
        phone: phone.trim(),
        country: country.trim(),
        destinationPort: destinationPort.trim(),
        taxId: taxId.trim(),
        preferredIncoterms,
        preferredLanguage,
      });
      setSavedBanner(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-10">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">{t.portal.title}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {userEmail} · {profile.creditTier} · {profile.status.replace(/_/g, ' ')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {isAdmin && onSwitchToAdmin && (
              <button
                type="button"
                onClick={onSwitchToAdmin}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                {t.nav.dashboard}
              </button>
            )}
            <button
              type="button"
              onClick={onBrowseCatalog}
              className="px-4 py-2 bg-blue-700 text-white text-xs font-semibold rounded-lg hover:bg-blue-800 cursor-pointer"
            >
              {t.portal.browseCatalogBtn}
            </button>
          </div>
        </div>

        {/* Segmented Sub-navigation */}
        <div className="mt-6 inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
          <button
            type="button"
            onClick={() => setTab('orders')}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              tab === 'orders' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.portal.ordersTab} ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('profile')}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              tab === 'profile' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.portal.profileTab}
          </button>
          <button
            type="button"
            onClick={() => setTab('inquiries')}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              tab === 'inquiries' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.portal.inquiriesTab} ({inquiries.length})
          </button>
        </div>

        {/* Tab 1: Orders */}
        {tab === 'orders' && (
          <div className="mt-6">
            {orders.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
                <Package className="w-8 h-8 text-slate-400 mx-auto" />
                <h2 className="mt-3 text-base font-semibold text-slate-900">{t.portal.noOrdersTitle}</h2>
                <p className="mt-1 text-sm text-slate-600">{t.portal.noOrdersBody}</p>
                <button
                  type="button"
                  onClick={onBrowseCatalog}
                  className="mt-5 px-4 py-2.5 bg-blue-700 text-white text-xs font-semibold rounded-lg hover:bg-blue-800 cursor-pointer"
                >
                  {t.portal.browseCatalogBtn}
                </button>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                        <th className="py-3 px-4">Order #</th>
                        <th className="py-3 px-4">Product</th>
                        <th className="py-3 px-4 text-right">Qty</th>
                        <th className="py-3 px-4">Terms / Port</th>
                        <th className="py-3 px-4 text-right">Total (USD)</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-sm">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50/70">
                          <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-900 tabular-nums">
                            {order.orderNumber}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-slate-900">{order.productName}</div>
                            <div className="text-xs font-mono text-slate-500">{order.productSku}</div>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                            {order.quantity}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-700">
                            {order.incoterms} · {order.destinationPort}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums">
                            ${order.totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3.5 px-4 text-xs font-medium text-slate-800">
                            {t.orderStatuses[order.status]}
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-3 whitespace-nowrap">
                            {order.trackingNumber && (
                              <button
                                type="button"
                                onClick={() => onTrackShipment(order.trackingNumber)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
                              >
                                <span>{t.portal.trackShipmentBtn}</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            )}
                            {order.status === 'pending_review' && (
                              <button
                                type="button"
                                onClick={() => onCancelOrder(order.id)}
                                className="text-xs font-medium text-red-700 hover:underline cursor-pointer"
                              >
                                {t.portal.cancelOrderBtn}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Company Profile */}
        {tab === 'profile' && (
          <div className="mt-6 bg-white border border-slate-200 rounded-xl p-6 lg:p-8 max-w-3xl">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Company Legal Name
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={160}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Primary Contact Name
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Phone</label>
                  <input
                    type="text"
                    maxLength={40}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Country</label>
                  <input
                    type="text"
                    required
                    maxLength={80}
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Default Destination Port
                  </label>
                  <input
                    type="text"
                    maxLength={120}
                    value={destinationPort}
                    onChange={(e) => setDestinationPort(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    VAT / Tax / EORI ID
                  </label>
                  <input
                    type="text"
                    maxLength={64}
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Preferred Incoterms
                  </label>
                  <select
                    value={preferredIncoterms}
                    onChange={(e) => setPreferredIncoterms(e.target.value as Incoterm)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                  >
                    {INCOTERMS_OPTIONS.map((term) => (
                      <option key={term} value={term}>
                        {term}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Preferred Language
                  </label>
                  <select
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value as LanguageCode)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                  >
                    {(Object.keys(LANGUAGE_LABELS) as LanguageCode[]).map((code) => (
                      <option key={code} value={code}>
                        {LANGUAGE_LABELS[code]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {savedBanner && (
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{t.portal.profileSavedMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-blue-700 text-white text-xs font-semibold rounded-lg hover:bg-blue-800 disabled:opacity-50 cursor-pointer"
              >
                {saving ? 'Saving...' : t.portal.saveProfileBtn}
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: Inquiries */}
        {tab === 'inquiries' && (
          <div className="mt-6 bg-white border border-slate-200 rounded-xl overflow-hidden">
            {inquiries.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-600">
                No inquiries submitted under this account yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {inquiries.map((inq) => (
                  <div key={inq.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{inq.productInterest}</div>
                      <div className="mt-1 text-xs text-slate-600">
                        {inq.estimatedVolume} · {inq.incoterms} · {inq.destinationPort || inq.country}
                      </div>
                      <p className="mt-2 text-xs text-slate-500">{inq.message}</p>
                    </div>
                    <div className="text-xs font-semibold text-slate-700 capitalize shrink-0">
                      {inq.status.replace(/_/g, ' ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
