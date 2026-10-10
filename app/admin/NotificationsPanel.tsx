"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bell, Send, CheckCircle2, AlertCircle, RefreshCw, Smartphone, ShieldCheck, Copy, Check } from "lucide-react";
import { api } from "@/lib/api";
import { getAxiosErrorMessage } from "@/lib/errorUtils";

interface SmsTemplate {
  key: string;
  name: string;
  category: string;
  notificationService: string;
  dltTemplateId: string;
  msg91TemplateId: string | null;
  format: string;
  isConfigured: boolean;
}

interface TemplatesResponse {
  msg91Configured: boolean;
  templates: SmsTemplate[];
}

export default function NotificationsPanel({ isAdmin }: { isAdmin: boolean }) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("ORDER_SUCCESS");
  const [phone, setPhone] = useState<string>("");
  const [customOrderNum, setCustomOrderNum] = useState<string>("DIV-20261010-ABCD");
  const [customAmount, setCustomAmount] = useState<string>("499");
  const [customUrl, setCustomUrl] = useState<string>("https://divantraa.com/account");
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; reqId?: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery<TemplatesResponse>({
    queryKey: ["admin-sms-templates"],
    queryFn: async () => (await api.get("/admin/notifications/templates")).data.data,
  });

  const sendTest = useMutation({
    mutationFn: async () => {
      const res = await api.post("/admin/notifications/test-sms", {
        templateKey: selectedTemplate,
        phone,
        variables: {
          alphanumeric: customOrderNum,
          orderNumber: customOrderNum,
          AMOUNT: customAmount,
          number: customAmount,
          amount: customAmount,
          url: customUrl,
          var2: customUrl,
        },
      });
      return res.data;
    },
    onSuccess: (res) => {
      setTestResult({
        success: true,
        message: res.message || "Test SMS sent successfully!",
      });
    },
    onError: (err) => {
      setTestResult({
        success: false,
        message: getAxiosErrorMessage(err, "Failed to send test SMS"),
      });
    },
  });

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const templates = data?.templates ?? [];
  const currentTpl = templates.find((t) => t.key === selectedTemplate);

  const renderPreview = () => {
    if (!currentTpl) return "";
    let str = currentTpl.format;
    str = str.replace(/\{#alphanumeric#\}/g, customOrderNum || "DIV-20261010-ABCD");
    str = str.replace(/\{#url#\}/g, customUrl || "https://divantraa.com/track-order");
    str = str.replace(/\{#AMOUNT\}/g, customAmount || "499");
    str = str.replace(/\{#number#\}/g, customAmount || "499");
    return str;
  };

  return (
    <div className="space-y-8">
      {/* Header card with status */}
      <div className="bg-white border border-ink/10 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-display font-semibold text-ink">SMS & Notification Templates</h2>
            {data?.msg91Configured ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle2 size={13} className="text-emerald-600" /> MSG91 Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                <AlertCircle size={13} className="text-amber-600" /> MSG91 Key Missing
              </span>
            )}
          </div>
          <p className="text-sm text-ink/50 mt-1">
            DLT-approved transactional SMS templates sent via MSG91 for order updates, deliveries, and refunds.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border border-ink/15 hover:border-ink/30 text-ink/70 hover:text-ink transition-colors disabled:opacity-50"
        >
          <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Test SMS Box (Admin only) */}
      {isAdmin && (
        <div className="bg-white border border-ink/10 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Smartphone size={18} className="text-leaf" />
            <h3 className="font-semibold text-ink">Send Test SMS</h3>
            <span className="text-xs text-ink/40">(Safely verify templates with any phone number)</span>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink/70 mb-1.5">Select Template</label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => {
                    setSelectedTemplate(e.target.value);
                    setTestResult(null);
                  }}
                  className="w-full text-sm border border-ink/15 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-leaf bg-white"
                >
                  {templates.map((tpl) => (
                    <option key={tpl.key} value={tpl.key}>
                      {tpl.name} ({tpl.notificationService})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink/70 mb-1.5">Recipient Mobile Number</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-ink/40 font-mono bg-ink/5 px-3 py-2.5 rounded-xl border border-ink/10">+91</span>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, ""));
                      setTestResult(null);
                    }}
                    className="flex-1 text-sm border border-ink/15 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-leaf font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink/70 mb-1.5">Sample Order #</label>
                  <input
                    type="text"
                    value={customOrderNum}
                    onChange={(e) => setCustomOrderNum(e.target.value)}
                    className="w-full text-xs font-mono border border-ink/15 rounded-xl px-3 py-2 focus:outline-none focus:border-leaf"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink/70 mb-1.5">Sample Amount (₹)</label>
                  <input
                    type="text"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full text-xs font-mono border border-ink/15 rounded-xl px-3 py-2 focus:outline-none focus:border-leaf"
                  />
                </div>
              </div>

              {currentTpl?.format.includes("{#url#}") && (
                <div>
                  <label className="block text-xs font-medium text-ink/70 mb-1.5 flex items-center justify-between">
                    <span>CTA / Tracking URL</span>
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      Must match DLT CTA Whitelist
                    </span>
                  </label>
                  <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://divantraa.com/track-order"
                    className="w-full text-xs font-mono border border-ink/15 rounded-xl px-3 py-2 focus:outline-none focus:border-leaf"
                  />
                </div>
              )}

              <button
                onClick={() => sendTest.mutate()}
                disabled={phone.length < 10 || sendTest.isPending}
                className="w-full flex items-center justify-center gap-2 bg-leaf text-white font-medium text-sm py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                <Send size={15} />
                {sendTest.isPending ? "Sending..." : "Send Test SMS"}
              </button>

              {testResult && (
                <div
                  className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                    testResult.success
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {testResult.success ? <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" /> : <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />}
                  <div className="flex-1">
                    <p className="font-semibold">{testResult.success ? "Success" : "Delivery Error"}</p>
                    <p className="mt-0.5 text-xs opacity-90">{testResult.message}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Live Message Preview */}
            <div className="bg-sand/30 border border-ink/10 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold text-ink/50 uppercase tracking-wider mb-2">Message Preview</p>
                <div className="bg-white rounded-xl p-4 border border-ink/10 shadow-sm text-sm text-ink whitespace-pre-line leading-relaxed font-sans">
                  {renderPreview()}
                </div>
              </div>
              {currentTpl && (
                <div className="mt-3 pt-3 border-t border-ink/10 flex flex-wrap items-center justify-between text-xs text-ink/60">
                  <span>DLT ID: <span className="font-mono">{currentTpl.dltTemplateId || "N/A"}</span></span>
                  <span className="font-medium text-leaf">{currentTpl.notificationService}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Templates List */}
      <div>
        <h3 className="font-semibold text-ink mb-4">All Configured Templates ({templates.length})</h3>

        {isLoading ? (
          <div className="text-center py-12 text-ink/40 text-sm">Loading templates...</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {templates.map((tpl) => (
              <div key={tpl.key} className="bg-white border border-ink/10 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-ink/5 text-ink/60">
                        {tpl.category}
                      </span>
                      <h4 className="text-sm font-semibold text-ink mt-1.5">{tpl.name}</h4>
                      <p className="text-xs text-ink/50">{tpl.notificationService}</p>
                    </div>
                    {tpl.isConfigured ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <ShieldCheck size={12} /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        Pending ID
                      </span>
                    )}
                  </div>

                  {/* DLT ID */}
                  <div className="mt-3 flex items-center justify-between bg-ink/[0.02] border border-ink/5 rounded-lg px-2.5 py-1.5 text-xs">
                    <span className="text-ink/50 text-[11px]">DLT Template ID:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-ink text-[11px] font-medium">{tpl.dltTemplateId || "Configurable"}</span>
                      {tpl.dltTemplateId && (
                        <button
                          onClick={() => handleCopy(tpl.dltTemplateId, tpl.key)}
                          className="text-ink/40 hover:text-ink p-0.5"
                          title="Copy DLT ID"
                        >
                          {copiedKey === tpl.key ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Template Format */}
                  <div className="mt-3">
                    <p className="text-[11px] font-semibold text-ink/40 uppercase tracking-wider mb-1">Approved Format</p>
                    <div className="bg-sand/20 rounded-xl p-3 border border-ink/5 text-xs text-ink/80 whitespace-pre-line font-mono text-[11px] leading-relaxed">
                      {tpl.format}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-ink/5 flex justify-end">
                  <button
                    onClick={() => {
                      setSelectedTemplate(tpl.key);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="text-xs font-medium text-leaf hover:underline flex items-center gap-1"
                  >
                    Test this template →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
