"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { loadLeads, saveLeads } from "../lib/lead-storage";
import {
  createLead,
  EMPTY_LEAD,
  getNextStage,
  LEAD_OWNERS,
  LEAD_SOURCES,
  LEAD_STAGES,
  validateLead,
  type Lead,
  type LeadDraft,
  type LeadErrors,
  type LeadOwner,
  type LeadSource,
  type LeadStage,
} from "../lib/leads";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

type Notice = {
  kind: "success" | "error";
  text: string;
};

export function LeadCrm() {
  const [draft, setDraft] = useState<LeadDraft>(EMPTY_LEAD);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [errors, setErrors] = useState<LeadErrors>({});
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isReady, setIsReady] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const restoreTask = window.setTimeout(() => {
      setLeads(loadLeads());
      setIsReady(true);
    }, 0);

    return () => window.clearTimeout(restoreTask);
  }, []);

  const stats = useMemo(
    () => ({
      total: leads.length,
      newLeads: leads.filter((lead) => lead.stage === "Новый лид").length,
      withSpec: leads.filter((lead) => lead.specRequested).length,
    }),
    [leads],
  );

  function updateDraft<K extends keyof LeadDraft>(
    field: K,
    value: LeadDraft[K],
  ) {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setNotice(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateLead(draft);
    setErrors(validationErrors);
    setNotice(null);

    if (Object.keys(validationErrors).length > 0) {
      const firstInvalidInput = validationErrors.name
        ? nameInputRef.current
        : phoneInputRef.current;
      firstInvalidInput?.focus();
      return;
    }

    const nextLeads = [createLead(draft), ...leads];

    if (!saveLeads(nextLeads)) {
      setNotice({
        kind: "error",
        text: "Не удалось сохранить лид. Проверьте настройки браузера.",
      });
      return;
    }

    setLeads(nextLeads);
    setDraft(EMPTY_LEAD);
    setErrors({});
    setNotice({ kind: "success", text: "Лид успешно сохранён" });
  }

  function advanceLeadStage(leadId: string) {
    const nextLeads = leads.map((lead) =>
      lead.id === leadId ? { ...lead, stage: getNextStage(lead.stage) } : lead,
    );

    if (!saveLeads(nextLeads)) {
      setNotice({
        kind: "error",
        text: "Не удалось обновить этап сделки.",
      });
      return;
    }

    setLeads(nextLeads);
    setNotice({ kind: "success", text: "Этап сделки обновлён" });
  }

  return (
    <main
      className="app-shell"
      data-testid="crm-app"
      data-ready={isReady ? "true" : "false"}
    >
      <header className="topbar">
        <a className="brand" href="#top" aria-label="CRM Лиды — наверх">
          <span className="brand-mark" aria-hidden="true">
            Л
          </span>
          <span>
            <strong>Лиды</strong>
            <small>простая CRM</small>
          </span>
        </a>
        <div className="topbar-status">
          <span className="status-dot" aria-hidden="true" />
          Данные сохраняются локально
        </div>
      </header>

      <section className="hero" id="top">
        <div>
          <p className="eyebrow">Рабочее пространство</p>
          <h1>Управляйте входящими лидами</h1>
          <p className="hero-copy">
            Добавляйте контакты, фиксируйте источник и двигайте сделки по этапам
            — всё на одной странице.
          </p>
        </div>
        <div className="stats" aria-label="Статистика лидов">
          <Stat label="Всего" value={stats.total} />
          <Stat label="Новые" value={stats.newLeads} />
          <Stat label="Запрошено ТЗ" value={stats.withSpec} />
        </div>
      </section>

      <div className="workspace">
        <section className="panel form-panel" aria-labelledby="form-title">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Новая заявка</p>
              <h2 id="form-title">Добавить лида</h2>
            </div>
            <span className="required-note">
              <span aria-hidden="true">*</span> обязательные поля
            </span>
          </div>

          <form
            className="lead-form"
            onSubmit={handleSubmit}
            noValidate
            aria-busy={!isReady}
          >
            <Field
              label="Имя клиента"
              error={errors.name}
              required
              htmlFor="lead-name"
            >
              <input
                id="lead-name"
                name="name"
                type="text"
                ref={nameInputRef}
                required
                value={draft.name}
                onChange={(event) => updateDraft("name", event.target.value)}
                placeholder="Например, Анна Смирнова"
                autoComplete="name"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "lead-name-error" : undefined}
              />
            </Field>

            <Field
              label="Номер телефона"
              error={errors.phone}
              required
              htmlFor="lead-phone"
            >
              <input
                id="lead-phone"
                name="phone"
                type="tel"
                ref={phoneInputRef}
                required
                value={draft.phone}
                onChange={(event) => updateDraft("phone", event.target.value)}
                placeholder="+7 999 123-45-67"
                autoComplete="tel"
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? "lead-phone-error" : undefined}
              />
            </Field>

            <div className="field-row">
              <Field label="Источник лида" htmlFor="lead-source">
                <select
                  id="lead-source"
                  name="source"
                  value={draft.source}
                  onChange={(event) =>
                    updateDraft("source", event.target.value as LeadSource)
                  }
                >
                  {LEAD_SOURCES.map((source) => (
                    <option key={source}>{source}</option>
                  ))}
                </select>
              </Field>

              <Field label="Ответственный" htmlFor="lead-owner">
                <select
                  id="lead-owner"
                  name="owner"
                  value={draft.owner}
                  onChange={(event) =>
                    updateDraft("owner", event.target.value as LeadOwner)
                  }
                >
                  {LEAD_OWNERS.map((owner) => (
                    <option key={owner}>{owner}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Этап сделки" htmlFor="lead-stage">
              <select
                id="lead-stage"
                name="stage"
                value={draft.stage}
                onChange={(event) =>
                  updateDraft("stage", event.target.value as LeadStage)
                }
              >
                {LEAD_STAGES.map((stage) => (
                  <option key={stage}>{stage}</option>
                ))}
              </select>
            </Field>

            <label className="checkbox-field" data-testid="spec-requested">
              <input
                type="checkbox"
                name="specRequested"
                checked={draft.specRequested}
                onChange={(event) =>
                  updateDraft("specRequested", event.target.checked)
                }
              />
              <span className="checkbox-control" aria-hidden="true" />
              <span>
                <strong>Запрошено ТЗ</strong>
                <small>Клиент ожидает техническое задание</small>
              </span>
            </label>

            <button
              className="primary-button"
              type="submit"
              disabled={!isReady}
            >
              <span aria-hidden="true">＋</span>
              Сохранить лида
            </button>

            <div
              className={`form-notice ${notice?.kind ?? ""}`}
              aria-live="polite"
            >
              {notice?.text ?? "\u00a0"}
            </div>
          </form>
        </section>

        <section className="panel leads-panel" aria-labelledby="leads-title">
          <div className="panel-heading leads-heading">
            <div>
              <p className="section-kicker">Воронка</p>
              <h2 id="leads-title">Сохранённые лиды</h2>
            </div>
            <span className="lead-count">{stats.total}</span>
          </div>

          <div className="lead-list" data-testid="lead-list">
            {!isReady ? (
              <div className="empty-state" role="status">
                <span className="empty-icon" aria-hidden="true">
                  ···
                </span>
                <h3>Загружаем лиды</h3>
              </div>
            ) : leads.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon" aria-hidden="true">
                  ↗
                </span>
                <h3>Здесь появятся лиды</h3>
                <p>Заполните форму — первая карточка появится в этом списке.</p>
              </div>
            ) : (
              leads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onAdvance={() => advanceLeadStage(lead.id)}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function Field({
  children,
  error,
  htmlFor,
  label,
  required = false,
}: {
  children: React.ReactNode;
  error?: string;
  htmlFor: string;
  label: string;
  required?: boolean;
}) {
  return (
    <div className={`field ${error ? "has-error" : ""}`}>
      <label htmlFor={htmlFor}>
        {label}
        {required && <span aria-hidden="true">*</span>}
      </label>
      {children}
      {error && (
        <span className="field-error" id={`${htmlFor}-error`} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

function LeadCard({ lead, onAdvance }: { lead: Lead; onAdvance: () => void }) {
  const phoneHref = `tel:${lead.phone.replace(/[^\d+]/g, "")}`;
  const isFinalStage = lead.stage === LEAD_STAGES[LEAD_STAGES.length - 1];

  return (
    <article className="lead-card" data-testid="lead-card">
      <div className="lead-card-top">
        <div className="avatar" aria-hidden="true">
          {lead.name.slice(0, 1).toLocaleUpperCase("ru-RU")}
        </div>
        <div className="lead-identity">
          <h3>{lead.name}</h3>
          <a href={phoneHref}>{lead.phone}</a>
        </div>
        <span
          className={`spec-badge ${lead.specRequested ? "" : "not-requested"}`}
        >
          {lead.specRequested ? "ТЗ запрошено" : "ТЗ не запрошено"}
        </span>
      </div>

      <dl className="lead-meta">
        <div>
          <dt>Источник</dt>
          <dd>{lead.source}</dd>
        </div>
        <div>
          <dt>Ответственный</dt>
          <dd>{lead.owner}</dd>
        </div>
        <div>
          <dt>Добавлен</dt>
          <dd>{dateFormatter.format(new Date(lead.createdAt))}</dd>
        </div>
      </dl>

      <div className="lead-card-footer">
        <span
          className={`stage stage-${LEAD_STAGES.indexOf(lead.stage)}`}
          data-testid="lead-stage"
        >
          {lead.stage}
        </span>
        <button
          className="stage-button"
          type="button"
          onClick={onAdvance}
          disabled={isFinalStage}
          aria-label={
            isFinalStage
              ? `Этап сделки для ${lead.name} финальный`
              : `Изменить этап сделки для ${lead.name}`
          }
        >
          {isFinalStage ? "Финальный этап" : "Следующий этап"}
          {!isFinalStage && <span aria-hidden="true">→</span>}
        </button>
      </div>
    </article>
  );
}
